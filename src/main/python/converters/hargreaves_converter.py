"""
Hargreaves Lansdown Converter implementation.

Parses Hargreaves Lansdown CSV exports into StandardTransaction format.
"""
import csv
import logging
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from ..interfaces.broker_converter import BaseBrokerConverter
from ..models.standard_transaction import (
    StandardTransaction,
    TransactionType
)

logger = logging.getLogger(__name__)

class HargreavesConverter(BaseBrokerConverter):
    """
    Converter for Hargreaves Lansdown CSV files.

    Handles HL export format.
    Note: HL CSVs are often incomplete (missing ticker, FX rates).
    We do our best to infer data.
    """

    @property
    def broker_name(self) -> str:
        return "Hargreaves Lansdown"

    def detect_confidence(self, file_path: str) -> float:
        """
        Detect if the file is a Hargreaves Lansdown CSV.
        """
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                header = f.readline().strip()

            # HL specific columns
            if "Transaction Type" in header and "Security" in header and "Account Type" in header:
                return 1.0

            # Fallback for variations
            if "Date" in header and "Transaction Type" in header and "ISIN" in header:
                return 0.9

            return 0.0
        except Exception:
            return 0.0

    @property
    def supported_file_extensions(self) -> List[str]:
        return ["csv"]

    def convert(
        self,
        file_path: str,
        base_currency: str = "GBP",
        **kwargs
    ) -> List[StandardTransaction]:
        """Convert HL CSV to StandardTransaction objects."""
        transactions = []

        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    # Skip empty rows
                    if not any(row.values()):
                        continue

                    tx = self._process_row(row)
                    if tx:
                        transactions.append(tx)

                except Exception as e:
                    logger.warning(f"Error processing row: {row}. Error: {e}")
                    continue

        return transactions

    def _process_row(self, row: Dict[str, str]) -> Optional[StandardTransaction]:
        """Process a single row."""

        # 1. Parse Transaction Type
        raw_type = row.get('Transaction Type', '').strip()
        tx_type = self._parse_transaction_type(raw_type)

        if not tx_type:
            return None

        # 2. Parse Date
        date_str = row.get('Date', '').strip()
        try:
            # HL usually uses DD/MM/YYYY
            date = datetime.strptime(date_str, '%d/%m/%Y')
        except ValueError:
            logger.warning(f"Could not parse date: {date_str}")
            return None

        # 3. Parse Amounts
        try:
            quantity_str = row.get('Quantity', '').strip()
            quantity = Decimal(quantity_str) if quantity_str else Decimal('0')

            price_str = row.get('Price', '').strip()
            price = Decimal(price_str) if price_str else Decimal('0')

            value_str = row.get('Value', '').strip()
            value = Decimal(value_str) if value_str else Decimal('0')

        except Exception:
            logger.warning(f"Error parsing numeric fields in row: {row}")
            return None

        # 4. Handle Price/Value Currency Mismatch (Pence vs Pounds)
        # HL Value is usually in GBP. Price might be in Pence.
        # Check if Price * Qty is approx Value * 100
        is_pence = False
        if quantity != 0 and price != 0:
            calculated_value = abs(quantity * price)
            abs_value = abs(value)

            # If calculated value is ~100x the stated value, price is in pence
            if abs(calculated_value - (abs_value * 100)) < abs(calculated_value - abs_value):
                is_pence = True
                price = price / 100

        # 5. Determine Signs
        # HL Quantity is usually positive. Value sign depends on type?
        # Usually Value is negative for Purchase (money out), positive for Sale (money in).
        # But sometimes CSV has absolute values.
        # Let's enforce standard signs based on type.

        if tx_type == TransactionType.BUY:
            quantity = abs(quantity)
            # Value should be negative (cost), but we store gross_amount as positive usually?
            # StandardTransaction: gross_amount is usually positive magnitude.
            # But let's check the model.
        elif tx_type == TransactionType.SELL:
            quantity = -abs(quantity)

        # 6. Account Type (ISA/SIPP)
        account_type = row.get('Account Type', '').lower()
        is_isa = 'isa' in account_type
        is_sipp = 'sipp' in account_type or 'pension' in account_type

        # 7. Symbol / ISIN
        isin = row.get('ISIN', '').strip()
        security_name = row.get('Security', '').strip()

        # HL doesn't provide ticker. Use ISIN as symbol if available, else Name.
        symbol = isin if isin else security_name

        # 8. Currency
        # HL CSV is almost always GBP.
        currency = "GBP"
        fx_rate = Decimal('1.0')

        # If it's a foreign stock, HL converts to GBP.
        # We treat it as a GBP transaction for simplicity unless we have more data.

        return StandardTransaction(
            date=date,
            symbol=symbol,
            transaction_type=tx_type,
            quantity=quantity,
            price=price,
            transaction_currency=currency,
            name=security_name,
            isin=isin,
            broker=self.broker_name,

            # HL specific
            is_isa=is_isa,
            is_sipp=is_sipp,

            # Amounts
            # Value in CSV is usually the net amount (inc fees)
            # We don't have commission breakdown.
            # We'll set net_amount to Value (absolute)
            net_amount=abs(value),

            # FX
            fx_rate_to_base=fx_rate,
            base_currency="GBP"
        )

    def _parse_transaction_type(self, raw_type: str) -> Optional[TransactionType]:
        """Parse HL transaction type."""
        raw = raw_type.lower()

        if 'purchase' in raw or 'bought' in raw or 'buy' in raw:
            return TransactionType.BUY
        elif 'sale' in raw or 'sold' in raw or 'sell' in raw:
            return TransactionType.SELL
        elif 'dividend' in raw:
            return TransactionType.DIVIDEND
        elif 'equalisation' in raw:
            return TransactionType.DIVIDEND # Treat as dividend for now
        elif 'rights' in raw:
            return TransactionType.RIGHTS_ISSUE
        elif 'merger' in raw:
            return TransactionType.MERGER
        elif 'spin' in raw:
            return TransactionType.SPIN_OFF

        return None
