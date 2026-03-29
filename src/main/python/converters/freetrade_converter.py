from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
import csv

from ..interfaces.broker_converter import BaseBrokerConverter
from ..models.standard_transaction import StandardTransaction, TransactionType

class FreetradeConverter(BaseBrokerConverter):
    """
    Converter for Freetrade CSV exports.
    
    Format:
    Date,Type,Ticker,Name,Quantity,Price,Total,Currency,Fee
    """
    
    @property
    def broker_name(self) -> str:
        return "Freetrade"
        
    @property
    def supported_file_extensions(self) -> List[str]:
        return [".csv"]
        
    def detect_confidence(self, file_path: str) -> float:
        """
        Detect if the file is a Freetrade CSV.
        """
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                header = f.readline().strip()
                
            # Check for key columns
            # Required: Date, Type, Quantity, Price, Currency
            # One of: Ticker/Symbol
            # One of: Fee/Fees
            
            has_basics = all(col in header for col in ["Date", "Type", "Quantity", "Price", "Currency"])
            has_symbol = "Ticker" in header or "Symbol" in header
            
            if has_basics and has_symbol:
                if "Freetrade" in header:
                    return 1.0
                return 0.9 if "Total" in header else 0.8
            
            return 0.0
        except Exception:
            return 0.0
            
    def convert(self, file_path: str, base_currency: str = "GBP", **kwargs) -> List[StandardTransaction]:
        """
        Convert Freetrade CSV to StandardTransaction objects.
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
        raw_type = row.get('Type', '').upper()
        tx_type = self._parse_transaction_type(raw_type)
        
        if not tx_type:
            return None
            
        # Skip non-trade types if necessary (e.g. Top Up, Withdrawal)
        # But we might want to track them? For now, skip if not mapped.
        
        # Parse Date
        date_str = row.get('Date')
        try:
            # Try ISO format first (YYYY-MM-DD)
            date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            try:
                # Try UK format (DD/MM/YYYY)
                date = datetime.strptime(date_str, "%d/%m/%Y")
            except ValueError:
                # Try with time
                try:
                    date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return None
        
        # Parse amounts
        quantity = Decimal(row.get('Quantity', '0') or '0')
        price = Decimal(row.get('Price', '0') or '0')
        
        total_str = row.get('Total')
        total = Decimal(total_str) if total_str else None
        
        fee = Decimal(row.get('Fee') or row.get('Fees') or '0')
        currency = row.get('Currency', 'GBP')
        
        # Adjust quantity sign for Sells
        if tx_type == TransactionType.SELL:
            quantity = -abs(quantity)
        
        # Create transaction
        tx = StandardTransaction(
            date=date,
            symbol=row.get('Ticker', '') or row.get('Symbol', ''),
            transaction_type=tx_type,
            quantity=quantity,
            price=price,
            transaction_currency=currency,
            name=row.get('Name', ''),
            gross_amount=total, # Can be None, StandardTransaction will calculate
            commission=fee,
            broker="Freetrade"
        )
        
        return tx
        
    def _parse_transaction_type(self, raw_type: str) -> Optional[TransactionType]:
        """Map raw transaction type to StandardTransactionType."""
        raw = raw_type.upper()
        
        if raw in ['BUY', 'BOUGHT', 'MARKET BUY', 'LIMIT BUY']:
            return TransactionType.BUY
        elif raw in ['SELL', 'SOLD', 'MARKET SELL', 'LIMIT SELL']:
            return TransactionType.SELL
        elif raw in ['DIVIDEND', 'DIVIDEND (ORDINARY)']:
            return TransactionType.DIVIDEND
        elif raw in ['INTEREST']:
            return TransactionType.INTEREST
            
        return None
