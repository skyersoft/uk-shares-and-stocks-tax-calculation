"""
IBKR Activity Statement converter.

Activity Statements are multi-section CSVs: column 0 is the section name and
column 1 is ``Header`` / ``Data`` / ``Total``. Only the ``Trades`` section is
read, and only stock orders are converted.
"""
import csv
import io
import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Optional, Tuple

from pathlib import Path

from ..interfaces.broker_converter import BaseBrokerConverter
from ..models.file_inspection import (
    ColumnInfo,
    FileInspection,
    RowStats,
    SkippedRows,
    Summary,
)
from ..models.standard_transaction import (
    AssetClass,
    StandardTransaction,
    TransactionType,
)

logger = logging.getLogger(__name__)

BOM = "﻿"


@dataclass
class TradesSection:
    """Rows of the Trades section, across all asset categories."""
    headers: List[str] = field(default_factory=list)
    rows: List[Dict[str, str]] = field(default_factory=list)
    encoding_warnings: List[str] = field(default_factory=list)


class IBKRActivityStatementConverter(BaseBrokerConverter):
    """Converter for IBKR Activity Statement CSV exports (Trades section, stocks)."""

    PENCE_CODES = {'GBX', 'GBp', 'GBPENCE'}
    STOCK_CATEGORIES = {'Stocks': AssetClass.STOCK, 'ETFs': AssetClass.ETF}
    REQUIRED_COLUMNS = ('Symbol', 'Date/Time', 'Quantity', 'T. Price', 'Currency', 'Comm/Fee')
    USED_COLUMNS = REQUIRED_COLUMNS + ('Asset Category',)
    MAX_SAMPLES = 3
    DATE_FORMATS = ('%Y-%m-%d, %H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d')

    @property
    def broker_name(self) -> str:
        return "Interactive Brokers (Activity Statement)"

    @property
    def supported_file_extensions(self) -> List[str]:
        return ["csv"]

    # ------------------------------------------------------------------ reading

    @staticmethod
    def _read_text(file_path: str) -> Tuple[str, List[str]]:
        """Decode as UTF-8 (BOMs stripped), falling back to cp1252 with a warning."""
        with open(file_path, 'rb') as f:
            raw = f.read()
        warnings: List[str] = []
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            text = raw.decode('cp1252', errors='replace')
            warnings.append("File is not valid UTF-8; decoded as Windows-1252.")
        return text.lstrip(BOM), warnings

    @staticmethod
    def _rows(text: str):
        return csv.reader(io.StringIO(text))

    def read_trades_section(self, file_path: str) -> TradesSection:
        """Return the Trades section's data rows (all asset categories) as dicts."""
        text, warnings = self._read_text(file_path)
        section = TradesSection(encoding_warnings=warnings)
        header: Optional[List[str]] = None

        for row in self._rows(text):
            if len(row) < 2 or row[0].strip() != 'Trades':
                continue
            kind = row[1].strip()
            if kind == 'Header':
                header = [h.strip() for h in row[2:]]
                if not section.headers:
                    section.headers = header
            elif kind == 'Data' and header is not None:
                values = row[2:]
                # Unquoted "YYYY-MM-DD, HH:MM:SS" splits into two fields: re-join
                if len(values) == len(header) + 1 and 'Date/Time' in header:
                    i = header.index('Date/Time')
                    values = values[:i] + [values[i] + ',' + values[i + 1]] + values[i + 2:]
                if len(values) < len(header):
                    values = values + [''] * (len(header) - len(values))
                section.rows.append({h: values[i].strip() for i, h in enumerate(header)})
        return section

    # ---------------------------------------------------------------- detection

    def detect_confidence(self, file_path: str) -> float:
        try:
            text, _ = self._read_text(file_path)
        except Exception:
            return 0.0

        first = None
        has_trades = False
        for row in self._rows(text):
            if not any(c.strip() for c in row):
                continue
            if first is None:
                first = row
                if not (len(row) >= 3 and row[0].strip() == 'Statement'
                        and row[1].strip() == 'Header' and row[2].strip() == 'Field Name'):
                    return 0.0
            if len(row) >= 2 and row[0].strip() == 'Trades' and row[1].strip() == 'Header':
                has_trades = True
                break
        if first is None:
            return 0.0
        return 0.95 if has_trades else 0.6

    # --------------------------------------------------------------- conversion

    @classmethod
    def _parse_date(cls, value: str) -> Optional[datetime]:
        value = (value or '').strip().strip('"')
        for fmt in cls.DATE_FORMATS:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return None

    def convert(self, file_path: str, base_currency: str = "GBP", **kwargs) -> List[StandardTransaction]:
        section = self.read_trades_section(file_path)
        transactions: List[StandardTransaction] = []
        failed = 0

        for row in section.rows:
            if row.get('DataDiscriminator') != 'Order':
                continue
            asset_class = self.STOCK_CATEGORIES.get(row.get('Asset Category', ''))
            if asset_class is None:
                continue
            try:
                tx = self._to_transaction(row, asset_class, base_currency)
            except (InvalidOperation, ValueError) as e:
                failed += 1
                logger.debug("Skipping unparseable row %s: %s", row, e)
                continue
            if tx is None:
                failed += 1
            else:
                transactions.append(tx)

        if failed:
            logger.warning("%s: %d stock rows could not be processed", self.broker_name, failed)
        return transactions

    def _to_transaction(self, row: Dict[str, str], asset_class: AssetClass,
                        base_currency: str) -> Optional[StandardTransaction]:
        date = self._parse_date(row.get('Date/Time', ''))
        symbol = row.get('Symbol', '')
        if date is None or not symbol:
            return None

        quantity = Decimal(row.get('Quantity', '').replace(',', ''))
        if quantity == 0:
            return None
        price_str = row.get('T. Price', '').replace(',', '')
        price = Decimal(price_str) if price_str else Decimal('0')
        proceeds_str = row.get('Proceeds', '').replace(',', '')
        if price == 0 and proceeds_str:
            price = abs(Decimal(proceeds_str)) / abs(quantity)
        comm_str = row.get('Comm/Fee', '').replace(',', '')
        commission = abs(Decimal(comm_str)) if comm_str else Decimal('0')

        currency = row.get('Currency', '') or base_currency
        if currency in self.PENCE_CODES:
            # Everything on a pence-quoted row is in pence
            price = price / 100
            commission = commission / 100
            currency = 'GBP'

        return StandardTransaction(
            date=date,
            symbol=symbol,
            transaction_type=TransactionType.SELL if quantity < 0 else TransactionType.BUY,
            quantity=abs(quantity),
            price=price,
            transaction_currency=currency,
            broker=self.broker_name,
            account_id=row.get('Account') or None,
            asset_class=asset_class,
            commission=commission,
            base_currency=base_currency,
        )

    # --------------------------------------------------------------- inspection

    @staticmethod
    def _tax_year(d: datetime) -> str:
        start = d.year if (d.month, d.day) >= (4, 6) else d.year - 1
        return f"{start}-{start + 1}"

    def _column_info(self, header: str, orders: List[Dict[str, str]]) -> ColumnInfo:
        values = [r.get(header, '').strip() for r in orders]
        filled = [v for v in values if v]
        samples: List[str] = []
        for v in filled:
            if v not in samples:
                samples.append(v)
            if len(samples) == self.MAX_SAMPLES:
                break
        used = header in self.USED_COLUMNS
        return ColumnInfo(
            header=header,
            mapped_to=header if used else None,
            status="understood" if used else "ignored",
            filled=len(filled),
            blank=len(values) - len(filled),
            samples=samples,
            note=None if used else "Not needed for the calculation",
        )

    def inspect(self, file_path: str) -> FileInspection:
        section = self.read_trades_section(file_path)
        warnings = list(section.encoding_warnings)
        orders = [r for r in section.rows if r.get('DataDiscriminator') == 'Order']

        columns = [self._column_info(h, orders) for h in section.headers]
        missing = ([c for c in self.REQUIRED_COLUMNS if c not in section.headers]
                   if section.headers else [])
        for name in missing:
            columns.append(ColumnInfo(
                header=name, mapped_to=name, status="blocked", filled=0, blank=len(orders),
                samples=[], note="Required column is missing",
            ))

        skipped_counts: Dict[str, int] = {}
        transactions = []
        failed = 0
        for row in orders:
            category = row.get('Asset Category', '')
            asset_class = self.STOCK_CATEGORIES.get(category)
            if asset_class is None:
                reason = f"{category or 'Unknown asset category'} (not supported)"
                skipped_counts[reason] = skipped_counts.get(reason, 0) + 1
                continue
            try:
                tx = None if missing else self._to_transaction(row, asset_class, "GBP")
            except (InvalidOperation, ValueError):
                tx = None
            if tx is None:
                failed += 1
            else:
                transactions.append(tx)

        skipped = [SkippedRows(r, n) for r, n in skipped_counts.items()]
        if failed:
            skipped.append(SkippedRows("Stock rows that could not be read", failed))

        stock_rows = len(transactions) + failed
        if missing:
            verdict = "blocked"
            warnings.append("Missing required column(s): " + ", ".join(missing))
        elif stock_rows == 0:
            verdict = "no_trades"
        elif not transactions:
            verdict = "no_trades"
            warnings.append("None of the stock rows could be read.")
        elif warnings or skipped:
            verdict = "ready_with_warnings"
        else:
            verdict = "ready"

        dates = sorted(t.date for t in transactions)
        summary = Summary(
            buys=sum(1 for t in transactions if t.transaction_type == TransactionType.BUY),
            sells=sum(1 for t in transactions if t.transaction_type == TransactionType.SELL),
            tickers=sorted({t.symbol for t in transactions}),
            currencies=sorted({t.transaction_currency for t in transactions}),
            first_date=dates[0].date().isoformat() if dates else None,
            last_date=dates[-1].date().isoformat() if dates else None,
            tax_years=sorted({self._tax_year(d) for d in dates}),
        )
        return FileInspection(
            filename=Path(file_path).name,
            format=None,
            verdict=verdict,
            columns=columns,
            rows=RowStats(total=len(orders), usable=len(transactions), skipped=skipped),
            summary=summary,
            next_actions=[],
            warnings=warnings,
        )
