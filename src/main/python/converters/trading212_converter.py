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
            with open(file_path, 'r', encoding='utf-8-sig') as f:
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

    # Pence-quoted currency codes used for London-listed securities
    PENCE_CODES = {'GBX', 'GBp', 'GBPENCE'}

    DATE_FORMATS = (
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S.%fZ',
        '%Y-%m-%d',
    )

    @classmethod
    def _parse_date(cls, value: str) -> Optional[datetime]:
        value = (value or '').strip()
        if not value:
            return None
        for fmt in cls.DATE_FORMATS:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return None

    @staticmethod
    def _resolve_fx_rate(
        currency: str,
        raw_rate: str,
        quantity: Decimal,
        price: Decimal,
        total: Decimal,
        total_currency: str,
    ) -> Decimal:
        """
        Return the GBP-per-unit rate for the transaction currency.

        Trading 212 exports an "Exchange rate" column, but the quoting direction
        (GBP per unit vs units per GBP) is not stated. When the row's Total is in
        GBP we can tell which direction was used: Total / (price * quantity) is
        the effective GBP-per-unit rate, so we pick whichever of ``rate`` or
        ``1 / rate`` is clearly closer to it. If the evidence is not clear we keep
        the rate exactly as exported.
        """
        if currency == 'GBP':
            return Decimal('1.0')

        raw = (raw_rate or '').strip()
        if not raw or raw.lower() in ('not available', 'n/a'):
            return Decimal('1.0')
        rate = Decimal(raw)
        if rate <= 0:
            return Decimal('1.0')

        gross = abs(quantity * price)
        if (total_currency or 'GBP').strip().upper() == 'GBP' and gross > 0 and total != 0:
            implied = abs(total) / gross
            inverse = Decimal('1') / rate
            err_rate = abs(rate - implied) / implied
            err_inverse = abs(inverse - implied) / implied
            if err_inverse < Decimal('0.10') and err_rate > Decimal('0.20'):
                return inverse
        return rate

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

        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            skipped_dates = 0
            failed_rows = 0

            for row in reader:
                try:
                    # Skip empty rows
                    if not any(row.values()):
                        continue

                    tx = self._process_row(row)
                    if tx:
                        transactions.append(tx)

                except Exception as e:
                    failed_rows += 1
                    logger.debug(f"Error processing row: {row}. Error: {e}")
                    continue

        if failed_rows:
            logger.warning(f"Trading 212: {failed_rows} rows could not be processed")

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
        date = self._parse_date(row.get('Time', ''))
        if date is None:
            logger.debug(f"Could not parse date: {row.get('Time', '')!r}")
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
            currency = (row.get('Currency (Price / share)', '') or row.get('Currency (Withholding tax)', '') or 'GBP').strip()

            # London-listed shares are quoted in pence (GBX / GBp): convert to pounds
            if currency in self.PENCE_CODES:
                price = price / 100
                currency = 'GBP'

            fx_rate = self._resolve_fx_rate(
                currency=currency,
                raw_rate=row.get('Exchange rate', ''),
                quantity=quantity,
                price=price,
                total=total_amount,
                total_currency=row.get('Currency (Total)', ''),
            )

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

        if 'dividend' in action:
            return TransactionType.DIVIDEND
        elif 'interest' in action:
            return TransactionType.INTEREST
        elif 'split' in action:
            return TransactionType.STOCK_SPLIT
        elif 'buy' in action:
            return TransactionType.BUY
        elif 'sell' in action:
            return TransactionType.SELL

        # Deposits, withdrawals, currency conversions, card transactions, cashback etc.
        # are cash movements, not securities transactions: never treat them as trades.
        return None
