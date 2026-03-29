from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
import csv

from ..interfaces.broker_converter import BaseBrokerConverter
from ..models.standard_transaction import StandardTransaction, TransactionType


class FidelityConverter(BaseBrokerConverter):
    """
    Converter for Fidelity UK CSV exports.

    Format:
    Trade Date,Settlement Date,Action,Symbol,Security Description,Quantity,Price,Amount,Commission,Fees,Settlement Currency
    """

    @property
    def broker_name(self) -> str:
        return "Fidelity"

    @property
    def supported_file_extensions(self) -> List[str]:
        return [".csv"]

    def detect_confidence(self, file_path: str) -> float:
        """
        Detect if the file is a Fidelity CSV.
        """
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                header = f.readline().strip()

            # Check for key columns
            required_cols = ["Trade Date", "Settlement Date", "Action", "Symbol", "Security Description", "Settlement Currency"]
            if all(col in header for col in required_cols):
                return 1.0

            # Partial match
            if "Fidelity" in header or ("Trade Date" in header and "Settlement Date" in header and "Action" in header):
                return 0.5

            return 0.0
        except Exception:
            return 0.0

    def convert(self, file_path: str, base_currency: str = "GBP", **kwargs) -> List[StandardTransaction]:
        """
        Convert Fidelity CSV to StandardTransaction objects.
        """
        transactions = []

        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    tx = self._process_row(row)
                    if tx:
                        # Set base currency
                        tx.base_currency = base_currency
                        transactions.append(tx)
                except Exception as e:
                    print(f"Error processing row: {row}. Error: {e}")
                    continue

        return transactions

    def _process_row(self, row: Dict[str, str]) -> Optional[StandardTransaction]:
        """Process a single row."""

        # Parse transaction type
        raw_action = row.get('Action', '').upper()
        tx_type = self._parse_transaction_type(raw_action)

        if not tx_type:
            return None

        # Parse Date (prefer Settlement Date, fallback to Trade Date)
        date_str = row.get('Settlement Date') or row.get('Trade Date')
        try:
            # Try UK format (DD/MM/YYYY)
            date = datetime.strptime(date_str, "%d/%m/%Y")
        except ValueError:
            try:
                # Try ISO format (YYYY-MM-DD)
                date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                return None

        # Parse amounts
        quantity = Decimal(row.get('Quantity', '0') or '0')
        price = Decimal(row.get('Price', '0') or '0')
        amount = Decimal(row.get('Amount', '0') or '0')
        commission = Decimal(row.get('Commission', '0') or '0')
        fees = Decimal(row.get('Fees', '0') or '0')
        currency = row.get('Settlement Currency', 'GBP')

        # Adjust quantity sign for Sells
        if tx_type == TransactionType.SELL:
            quantity = -abs(quantity)

        # Create transaction
        tx = StandardTransaction(
            date=date,
            symbol=row.get('Symbol', ''),
            transaction_type=tx_type,
            quantity=quantity,
            price=price,
            transaction_currency=currency,
            name=row.get('Security Description', ''),
            gross_amount=abs(amount),
            commission=commission,
            other_fees=fees,
            broker="Fidelity"
        )

        return tx

    def _parse_transaction_type(self, raw_action: str) -> Optional[TransactionType]:
        """Map raw transaction type to StandardTransactionType."""
        raw = raw_action.upper()

        if 'YOU BOUGHT' in raw or 'BOUGHT' in raw:
            return TransactionType.BUY
        elif 'YOU SOLD' in raw or 'SOLD' in raw:
            return TransactionType.SELL
        elif 'DIVIDEND' in raw:
            return TransactionType.DIVIDEND
        elif 'INTEREST' in raw:
            return TransactionType.INTEREST

        return None
