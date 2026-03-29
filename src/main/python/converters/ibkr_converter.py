"""
Interactive Brokers (IBKR) CSV Converter.

This module implements the BrokerConverterInterface for Interactive Brokers
Flex Query CSV exports. It handles both standard Flex Query format and
Sharesight-compatible format.
"""

import csv
import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Optional

from ..interfaces.broker_converter import BaseBrokerConverter
from ..models.standard_transaction import (
    StandardTransaction,
    TransactionType,
    AssetClass
)

logger = logging.getLogger(__name__)


class IBKRConverter(BaseBrokerConverter):
    """
    Converter for Interactive Brokers (IBKR) CSV files.

    Supports:
    1. Activity Flex Query (Trades section)
    2. Sharesight-compatible format
    """

    @property
    def broker_name(self) -> str:
        return "Interactive Brokers"

    @property
    def supported_file_extensions(self) -> List[str]:
        return ["csv"]

    def get_required_columns(self) -> List[str]:
        """
        IBKR Flex Queries are customizable, so we check for a subset of
        critical columns that are usually present in trade reports.
        """
        return ["Symbol", "Quantity"]

    def detect_confidence(self, file_path: str) -> float:
        """
        Detect if file is from IBKR based on column presence.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # Read first few lines to find header
                # IBKR CSVs sometimes have metadata rows before header
                header = None
                for _ in range(10):
                    line = f.readline()
                    if not line:
                        break
                    if "Symbol" in line and "Quantity" in line:
                        header = line.strip().split(',')
                        break

                if not header:
                    return 0.0

                # Check for IBKR-specific columns
                ibkr_cols = {
                    "ClientAccountID", "AssetClass", "TradeDate", "SettleDate",
                    "TradePrice", "IBCommission", "Buy/Sell", "Code",
                    "TransactionType", "Exchange", "ListingExchange"
                }

                file_cols = set(h.strip() for h in header)
                matches = len(ibkr_cols & file_cols)

                if matches >= 3:
                    return 1.0
                elif matches >= 1:
                    return 0.7

                return 0.0

        except Exception:
            return 0.0

    def convert(
        self,
        file_path: str,
        base_currency: str = "GBP",
        **kwargs
    ) -> List[StandardTransaction]:
        """Convert IBKR CSV to StandardTransaction objects."""
        transactions = []

        with open(file_path, 'r', encoding='utf-8') as f:
            # Skip metadata lines until header
            pos = f.tell()
            line = f.readline()
            header_line = ""

            # Look for header line
            while line:
                if "Symbol" in line and "Quantity" in line:
                    header_line = line
                    break
                pos = f.tell()
                line = f.readline()

            if not header_line:
                # Reset to start if no header found in scan (might be standard CSV)
                f.seek(0)
            else:
                # Go back to start of header line
                f.seek(pos)

            reader = csv.DictReader(f)

            for row in reader:
                try:
                    # Skip summary rows or empty rows
                    if not row.get('Symbol') or row.get('Header') == 'Header':
                        continue

                    tx = self._process_row(row, base_currency)
                    if tx:
                        transactions.append(tx)

                except Exception as e:
                    logger.warning(f"Error processing row: {row}. Error: {e}")
                    continue

        return transactions

    def _process_row(self, row: Dict[str, str], base_currency: str) -> Optional[StandardTransaction]:
        """Process a single CSV row into a StandardTransaction."""

        # 1. Parse Date
        date_str = (
            row.get('TradeDate') or
            row.get('Date') or
            row.get('DateTime')
        )
        if not date_str:
            return None

        date = self._parse_date(date_str)
        if not date:
            return None

        # 2. Determine Transaction Type
        tx_type = self._parse_transaction_type(row)
        if not tx_type:
            return None

        # 3. Parse Quantity
        qty_str = row.get('Quantity', '0').replace(',', '')
        quantity = Decimal(qty_str)

        # Adjust quantity sign for Sell if needed (Sharesight format often has positive qty for sell)
        if tx_type == TransactionType.SELL and quantity > 0:
            quantity = -quantity
        elif tx_type == TransactionType.BUY and quantity < 0:
            quantity = abs(quantity)

        # 4. Parse Price
        price_str = (
            row.get('TradePrice') or
            row.get('T. Price') or
            row.get('Price') or
            '0'
        ).replace(',', '')
        price = Decimal(price_str)

        # 5. Parse Currency
        currency = (
            row.get('Currency') or
            row.get('CurrencyPrimary') or
            base_currency
        ).upper()

        # 6. Parse Fees
        commission = abs(Decimal(
            (row.get('IBCommission') or row.get('Comm/Fee') or '0').replace(',', '')
        ))

        tax = abs(Decimal(
            (row.get('Tax') or '0').replace(',', '')
        ))

        # 7. Parse FX Rate
        fx_rate = None
        fx_rate_str = row.get('FXRateToBase') or row.get('ExchangeRate')
        if fx_rate_str:
            try:
                fx_rate = Decimal(fx_rate_str)
            except Exception:
                pass

        # 8. Create Transaction
        return StandardTransaction(
            date=date,
            symbol=row.get('Symbol', ''),
            transaction_type=tx_type,
            quantity=quantity,
            price=price,
            transaction_currency=currency,
            base_currency=base_currency,

            # Optional fields
            name=row.get('Description') or row.get('Name', ''),
            isin=row.get('ISIN'),
            broker="Interactive Brokers",
            transaction_id=row.get('TradeID') or row.get('TransactionID'),
            asset_class=self._parse_asset_class(row.get('AssetClass', '')),

            # Fees
            commission=commission,
            other_fees=tax,  # Map generic tax to other_fees for now

            # FX
            fx_rate_to_base=fx_rate,
            fx_rate_source="Broker" if fx_rate else None,

            # IBKR Specifics
            cost_basis=self._parse_decimal(row.get('Basis')),
            realized_pl=self._parse_decimal(row.get('Realized P/L') or row.get('FifoPnlRealized')),
            notes=row.get('Code', '')
        )

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string in various formats."""
        formats = [
            '%Y-%m-%d', '%Y%m%d', '%d/%m/%Y', '%m/%d/%Y',
            '%Y-%m-%d;%H:%M:%S'  # Sometimes includes time
        ]

        # Clean string
        date_str = date_str.strip()

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return None

    def _parse_transaction_type(self, row: Dict[str, str]) -> Optional[TransactionType]:
        """Determine transaction type from row data."""
        # Check 'Code' column (standard Flex Query)
        code = row.get('Code', '').strip()
        if code:
            if 'O' in code:
                return TransactionType.BUY  # Opening
            if 'C' in code:
                return TransactionType.SELL  # Closing
            if 'A' in code:
                return TransactionType.BUY  # Assignment (usually buy)
            if 'Ex' in code:
                return TransactionType.SELL  # Exercise (usually sell)

        # Check 'Buy/Sell' column (Sharesight format)
        buy_sell = row.get('Buy/Sell', '').upper()
        if buy_sell == 'BUY':
            return TransactionType.BUY
        if buy_sell == 'SELL':
            return TransactionType.SELL
        if buy_sell == 'DIV':
            return TransactionType.DIVIDEND
        if buy_sell == 'INT':
            return TransactionType.INTEREST

        # Check 'TransactionType' column
        tx_type_str = row.get('TransactionType', '').upper()
        if 'DIV' in tx_type_str:
            return TransactionType.DIVIDEND
        if 'INT' in tx_type_str:
            return TransactionType.INTEREST
        if 'WITHHOLD' in tx_type_str or 'TAX' in tx_type_str:
            return TransactionType.TAX_WITHHOLDING

        # Fallback based on quantity
        qty = Decimal(row.get('Quantity', '0').replace(',', ''))
        if qty > 0:
            return TransactionType.BUY
        if qty < 0:
            return TransactionType.SELL

        return None

    def _parse_asset_class(self, asset_class: str) -> AssetClass:
        """Map IBKR asset class to internal enum."""
        mapping = {
            'STK': AssetClass.STOCK,
            'OPT': AssetClass.OPTION,
            'FUT': AssetClass.FUTURE,
            'CASH': AssetClass.FOREX,
            'BOND': AssetClass.BOND,
            'FUND': AssetClass.FUND,
            'CFD': AssetClass.STOCK  # Treat CFDs as stock for now
        }
        return mapping.get(asset_class.upper(), AssetClass.STOCK)

    def _parse_decimal(self, value: Optional[str]) -> Optional[Decimal]:
        """Parse decimal safely."""
        if not value:
            return None
        try:
            return Decimal(value.replace(',', ''))
        except Exception:
            return None
