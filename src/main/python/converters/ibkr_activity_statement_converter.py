"""
IBKR Activity Statement converter.

Activity Statements are multi-section CSVs: column 0 is the section name and
column 1 is ``Header`` / ``Data`` / ``Total``. Only the ``Trades`` section is
read, and only stock orders are converted.

Contract shared by ``inspect()`` and ``convert()``: a file is blocked by
``inspect()`` exactly when ``convert()`` raises ``BrokerConversionError``
(see ``_blocking_problems``). In particular, non-GBP stock rows are refused:
the statement carries no exchange rates, and converting them at 1.0 would
report a foreign-currency gain as pounds.
"""
import re
import csv
import io
import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

from ..interfaces.broker_converter import BaseBrokerConverter, BrokerConversionError
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
    headers: List[str] = field(default_factory=list)  # first Trades header (any category)
    rows: List[Dict[str, str]] = field(default_factory=list)
    encoding_warnings: List[str] = field(default_factory=list)
    # The Trades header in force for each row (parallel to ``rows``); a statement repeats
    # the header per asset category and the columns can differ between them.
    row_headers: List[Tuple[str, ...]] = field(default_factory=list)


class IBKRActivityStatementConverter(BaseBrokerConverter):
    """Converter for IBKR Activity Statement CSV exports (Trades section, stocks)."""

    PENCE_CODES = {'GBX', 'GBp', 'GBPENCE'}
    GBP_CODES = {'GBP'} | PENCE_CODES
    # Trades "Code" values that mean the stock trade came from an option
    ASSIGNMENT_CODES = {'A': 'assignment', 'Ex': 'exercise'}
    STOCK_CATEGORIES = {'Stocks': AssetClass.STOCK, 'ETFs': AssetClass.ETF}
    REQUIRED_COLUMNS = ('Symbol', 'Date/Time', 'Quantity', 'T. Price', 'Currency', 'Comm/Fee')
    # Asset Category decides which rows are stocks, so inspection treats it as required too
    INSPECT_REQUIRED = REQUIRED_COLUMNS + ('Asset Category',)
    USED_COLUMNS = INSPECT_REQUIRED
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
                section.row_headers.append(tuple(header))
        return section

    def _corporate_action_tickers(self, text: str) -> List[str]:
        """Tickers of stock rows in the Corporate Actions section (splits, mergers, ...)."""
        header: Optional[List[str]] = None
        tickers: List[str] = []
        for row in self._rows(text):
            if len(row) < 2 or row[0].strip() != 'Corporate Actions':
                continue
            kind = row[1].strip()
            if kind == 'Header':
                header = [h.strip() for h in row[2:]]
            elif kind == 'Data' and header is not None:
                rec = dict(zip(header, (v.strip() for v in row[2:])))
                if rec.get('Asset Category') not in self.STOCK_CATEGORIES:
                    continue
                # No Symbol column: the description starts "TICKER(ISIN) Split ..."
                m = re.match(r'\s*([^\s(]+)', rec.get('Description', ''))
                if m and m.group(1) not in tickers:
                    tickers.append(m.group(1))
        return sorted(tickers)

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

    def _order_rows(self, rows: List[Dict[str, str]]) -> Iterator[Tuple[Dict[str, str], Optional[AssetClass]]]:
        """Yield (row, asset_class) for every Order row; asset_class is None for unsupported categories.

        Shared by convert() and inspect() so the two cannot disagree about which rows count.
        """
        for row in rows:
            if row.get('DataDiscriminator') == 'Order':
                yield row, self.STOCK_CATEGORIES.get(row.get('Asset Category', ''))

    def _required_missing(self, section: TradesSection) -> List[str]:
        """Required columns missing from the header(s) in force for the stock rows.

        A statement repeats the Trades header per asset category, so the first header may
        belong to Forex or options and must not decide whether the stock rows are readable.
        """
        order_headers = [h for r, h in zip(section.rows, section.row_headers)
                         if r.get('DataDiscriminator') == 'Order']
        stock_headers = [h for r, h in zip(section.rows, section.row_headers)
                         if r.get('DataDiscriminator') == 'Order'
                         and r.get('Asset Category', '') in self.STOCK_CATEGORIES]
        if stock_headers:
            return [c for c in self.INSPECT_REQUIRED if any(c not in h for h in set(stock_headers))]
        if order_headers:
            # Only non-stock rows: blocked only if we cannot even tell the asset category
            return ['Asset Category'] if any('Asset Category' not in h for h in order_headers) else []
        if section.headers:
            return [c for c in self.INSPECT_REQUIRED if c not in section.headers]
        return []

    def _non_gbp(self, section: TradesSection) -> List[str]:
        return sorted({(row.get('Currency') or 'GBP') for row, asset_class in self._order_rows(section.rows)
                       if asset_class is not None and (row.get('Currency') or 'GBP') not in self.GBP_CODES})

    def non_gbp_currencies(self, file_path: str) -> List[str]:
        """Currencies (other than GBP/GBX) of the stock rows in the file, sorted."""
        return self._non_gbp(self.read_trades_section(file_path))

    @staticmethod
    def non_gbp_message(currencies: List[str]) -> str:
        return (f"This statement contains trades in {', '.join(currencies)}. The Activity Statement has no "
                "exchange rates, so we cannot convert them to pounds yet. Ask us to add support, or export "
                "a Flex Query that includes FX rates (the FXRateToBase column) and upload that instead.")

    def _blocking_problems(self, section: TradesSection) -> Tuple[List[str], List[str]]:
        """(missing required columns, warnings) that make the file unusable.

        inspect() reports these as ``blocked``; convert() raises with the same text, so the
        two can never disagree (no silent FX rate of 1.0, no silently empty conversion).
        """
        missing = self._required_missing(section)
        problems = ["Missing required column(s): " + ", ".join(missing)] if missing else []
        currencies = [] if 'Currency' in missing else self._non_gbp(section)
        if currencies:
            problems.append(self.non_gbp_message(currencies))
        return missing, problems

    def convert(self, file_path: str, base_currency: str = "GBP", **kwargs) -> List[StandardTransaction]:
        section = self.read_trades_section(file_path)
        _, problems = self._blocking_problems(section)
        if problems:
            raise BrokerConversionError(self.broker_name, file_path, " ".join(problems))
        transactions: List[StandardTransaction] = []
        failed = 0

        for row, asset_class in self._order_rows(section.rows):
            if asset_class is None:
                continue
            try:
                tx = self._to_transaction(row, asset_class, base_currency)
            except (InvalidOperation, ValueError) as e:
                failed += 1
                logger.debug("Skipping unparseable stock row: %s", type(e).__name__)  # no row content in logs
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
        # IBKR Date/Time is in the timezone the statement was generated in (often US Eastern),
        # not UK time. It is used as the trade date as-is: a fill late in the US evening could
        # in theory fall on the next UK calendar day. Follow-up, see the X-ray fix report.
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

    def _cost_event_warnings(self, file_path: str, transactions: List[StandardTransaction]) -> List[str]:
        """Warn about events that change share count or cost but are not applied (not calculated)."""
        out: List[str] = []
        text, _ = self._read_text(file_path)
        actions = self._corporate_action_tickers(text)
        if actions:
            out.append(
                "This statement has corporate actions for " + ", ".join(actions) + ": splits/mergers "
                "change your share count and cost; we have not applied them, check these tickers.")
        section = self.read_trades_section(file_path)
        hit: List[str] = []
        for row, asset_class in self._order_rows(section.rows):
            if asset_class is None:
                continue
            codes = {c.strip() for c in (row.get('Code') or '').split(';')}
            if codes & set(self.ASSIGNMENT_CODES) and row.get('Symbol') and row['Symbol'] not in hit:
                hit.append(row['Symbol'])
        if hit:
            out.append(
                "This statement includes option assignment/exercise for " + ", ".join(sorted(hit))
                + "; premium not included in cost, so check these tickers.")
        return out

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
        order_rows = list(self._order_rows(section.rows))
        orders = [row for row, _ in order_rows]

        # Show the columns of the header the stock rows use (falls back to the first header)
        display = next((list(h) for r, h in zip(section.rows, section.row_headers)
                        if r.get('DataDiscriminator') == 'Order'
                        and r.get('Asset Category', '') in self.STOCK_CATEGORIES), section.headers)
        columns = [self._column_info(h, orders) for h in display]
        missing, problems = self._blocking_problems(section)
        for name in missing:
            shown = next((c for c in columns if c.header == name), None)
            if shown is not None:  # present in this header, missing from another stock header
                shown.status, shown.note = "blocked", "Missing from some of the stock rows"
                continue
            columns.append(ColumnInfo(
                header=name, mapped_to=name, status="blocked", filled=0, blank=len(orders),
                samples=[], note="Required column is missing",
            ))

        skipped_counts: Dict[str, int] = {}
        transactions = []
        failed = 0
        for row, asset_class in order_rows:
            if asset_class is None:
                category = row.get('Asset Category', '')
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
        if not problems:
            warnings.extend(self._cost_event_warnings(file_path, transactions))
        if problems:
            verdict = "blocked"
            warnings.extend(problems)
        elif stock_rows == 0:
            verdict = "no_trades"
        elif not transactions:
            verdict = "no_trades"
            warnings.append("None of the stock rows could be read.")
        elif warnings or skipped:
            verdict = "ready_with_warnings"
        else:
            verdict = "ready"

        if problems:
            # Nothing from a blocked file reaches the calculation, so nothing is summarised as usable;
            # the currencies still show which stock rows caused the block
            transactions = []
            currencies = sorted({(r.get('Currency') or 'GBP') for r, a in order_rows if a is not None})
        else:
            currencies = sorted({t.transaction_currency for t in transactions})
        dates = sorted(t.date for t in transactions)
        summary = Summary(
            buys=sum(1 for t in transactions if t.transaction_type == TransactionType.BUY),
            sells=sum(1 for t in transactions if t.transaction_type == TransactionType.SELL),
            tickers=sorted({t.symbol for t in transactions}),
            currencies=currencies,
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
