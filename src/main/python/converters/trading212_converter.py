"""
Trading 212 Converter implementation.

Parses Trading 212 CSV exports into StandardTransaction format.
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


class Trading212Converter(BaseBrokerConverter):
    """
    Converter for Trading 212 CSV files.

    Handles standard Trading 212 export format including:
    - Market/Limit orders
    - Dividends
    - Interest
    - Corporate actions
    """

    # Expected columns in Trading 212 CSV
    REQUIRED_COLUMNS = {
        'Action', 'Time', 'ISIN', 'Ticker', 'Name',
        'No. of shares', 'Price / share', 'Total',
        'Currency (Price / share)'
    }

    @property
    def broker_name(self) -> str:
        return "Trading 212"

    def detect_confidence(self, file_path: str) -> float:
        """
        Detect if the file is a Trading 212 CSV.

        Look for specific T212 headers.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                header = f.readline().strip()

            # Check for T212 specific column combination
            if "Action" in header and "Time" in header and "No. of shares" in header:
                # Check for other T212 columns to be sure
                if "Price / share" in header and "Result" in header:
                    return 1.0
                return 0.8

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
        """Convert Trading 212 CSV to StandardTransaction objects."""
        transactions = []

        with open(file_path, 'r', encoding='utf-8') as f:
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
        """
        Process a single row from the CSV.

        Args:
            row: Dictionary mapping header to value

        Returns:
            StandardTransaction or None if row should be skipped
        """
        action = row.get('Action', '').strip()

        # Skip empty actions or header repetitions
        if not action or action == 'Action':
            return None

        # Parse transaction type
        tx_type = self._parse_transaction_type(action)

        # Skip unsupported types
        if tx_type is None:
            return None

        # Parse date
        date_str = row.get('Time', '')
        try:
            # T212 format: YYYY-MM-DD HH:MM:SS
            date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                # Fallback for just date
                date = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                logger.warning(f"Could not parse date: {date_str}")
                return None

        # Parse amounts
        try:
            quantity_str = row.get('No. of shares', '').strip()
            quantity = Decimal(quantity_str) if quantity_str else Decimal('0')

            price_str = row.get('Price / share', '').strip()
            price = Decimal(price_str) if price_str else Decimal('0')

            total_str = row.get('Total', '').strip()
            total_amount = Decimal(total_str) if total_str else Decimal('0')

            # Currency
            currency = row.get('Currency (Price / share)', '') or row.get('Currency (Withholding tax)', '') or 'GBP'

            # FX Rate
            fx_rate_str = row.get('Exchange rate', '').strip()
            # T212 provides rate to account currency (usually GBP for UK users)
            # If empty, assume 1.0 (same currency)
            fx_rate = Decimal(fx_rate_str) if fx_rate_str and fx_rate_str != 'Not available' else Decimal('1.0')

            # Fees and Taxes
            wht_str = row.get('Withholding tax', '').strip()
            wht = Decimal(wht_str) if wht_str else Decimal('0')

            stamp_duty_str = row.get('Stamp duty reserve tax', '').strip()
            stamp_duty = Decimal(stamp_duty_str) if stamp_duty_str else Decimal('0')

            conversion_fee_str = row.get('Currency conversion fee', '').strip()
            conversion_fee = Decimal(conversion_fee_str) if conversion_fee_str else Decimal('0')

            charge_amount_str = row.get('Charge amount', '').strip()  # Usually other fees
            other_fees = Decimal(charge_amount_str) if charge_amount_str else Decimal('0')

        except Exception as e:
            logger.warning(f"Error parsing numeric fields in row: {row} - {e}")
            return None

        # Adjust quantity sign for Sells
        if tx_type == TransactionType.SELL:
            quantity = -abs(quantity)
        elif tx_type == TransactionType.BUY:
            quantity = abs(quantity)

        # Handle Dividends
        if tx_type == TransactionType.DIVIDEND:
            # T212 puts dividend amount in Total (Net)
            # We need Gross Amount
            # Gross = Total + Withholding Tax
            # Price might be per share dividend, or 0
            if quantity == 0 and price > 0 and total_amount > 0:
                # Infer quantity if missing but price and total exist?
                # No, total is amount. Price is per share.
                # quantity = Total / Price?
                # Usually for dividends we just care about the amount.
                # StandardTransaction requires quantity. We can set it to 0 or 1.
                pass

            # Calculate Gross Amount
            gross_amount = total_amount + wht

            # If price is 0, we can't calculate gross from qty * price.
            # We should set gross_amount explicitly.
        else:
            # For Buys/Sells, Total is usually (Price * Qty) +/- Fees
            # We'll let StandardTransaction calculate gross from Price * Qty
            gross_amount = None

        # Symbol
        symbol = row.get('Ticker', '').strip()
        name = row.get('Name', '').strip()
        isin = row.get('ISIN', '').strip()

        if not symbol and tx_type == TransactionType.INTEREST:
            symbol = "CASH"  # Interest on cash
            name = "Interest on Cash"

        return StandardTransaction(
            date=date,
            symbol=symbol,
            transaction_type=tx_type,
            quantity=quantity,
            price=price,
            transaction_currency=currency,
            name=name,
            isin=isin,
            broker=self.broker_name,
            transaction_id=row.get('ID'),
            notes=row.get('Notes'),

            # Fees
            withholding_tax=wht,
            stamp_duty=stamp_duty,
            currency_conversion_fee=conversion_fee,
            other_fees=other_fees,

            # FX
            fx_rate_to_base=fx_rate,
            base_currency="GBP",  # Assuming T212 UK account

            # Explicit amounts if needed
            gross_amount=gross_amount if tx_type == TransactionType.DIVIDEND else None
        )

    def _parse_transaction_type(self, action: str) -> Optional[TransactionType]:
        """Parse Trading 212 action string to TransactionType."""
        action = action.lower()

        if 'buy' in action:
            return TransactionType.BUY
        elif 'sell' in action:
            return TransactionType.SELL
        elif 'dividend' in action:
            return TransactionType.DIVIDEND
        elif 'interest' in action:
            return TransactionType.INTEREST
        elif 'deposit' in action:
            return None  # Ignore cash deposits for now
        elif 'withdrawal' in action:
            return None  # Ignore cash withdrawals for now
        elif 'split' in action:
            return TransactionType.STOCK_SPLIT

        return TransactionType.BUY  # Default/Fallback? Or maybe raise error?
        # Better to log and return a safe default or specific UNKNOWN type
