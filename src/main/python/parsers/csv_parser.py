"""CSV file parser implementation."""
import logging
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..interfaces.calculator_interfaces import FileParserInterface
from ..models.domain_models import Transaction, TransactionType, Security, Currency


class CsvParser(FileParserInterface):
    """Parser for CSV (Comma-Separated Values) files from trading platforms.
    
    This parser is specifically designed to handle CSV files exported from
    trading platforms like Interactive Brokers (Sharesight format).
    """
    
    def __init__(self, base_currency: str = "GBP"):
        """Initialize the CSV parser.
        
        Args:
            base_currency: The base currency for calculations (default: GBP)
        """
        self.base_currency = base_currency
        self.logger = logging.getLogger(__name__)
    
    def supports_file_type(self, file_type: str) -> bool:
        """Check if this parser supports the given file type."""
        return file_type.lower() == "csv"
    
    def parse(self, file_path: str) -> List[Transaction]:
        """Parse a CSV file and extract transactions.
        
        Args:
            file_path: Path to the CSV file
            
        Returns:
            List of Transaction objects
        """
        self.logger.info(f"Parsing CSV file: {file_path}")
        
        transactions = []
        
        try:
            # Read the CSV file
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Skip currency exchange transactions for now
                    if self._is_currency_transaction(row):
                        self.logger.debug(f"Skipping currency transaction: {row.get('Symbol')}")
                        continue
                    
                    # Skip rows that don't have required fields
                    if not self._has_required_fields(row):
                        self.logger.warning(f"Skipping row with missing required fields: {row}")
                        continue
                    
                    # Create transaction
                    transaction = self._create_transaction_from_row(row)
                    if transaction:
                        transactions.append(transaction)
            
            return transactions
            
        except Exception as e:
            self.logger.error(f"Error parsing CSV file: {e}")
            return transactions
    
    def _is_currency_transaction(self, row: Dict[str, Any]) -> bool:
        """Check if a row represents a currency exchange transaction.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            True if the row is a currency transaction, False otherwise
        """
        symbol = row.get('Symbol', '')
        asset_class = row.get('AssetClass', '')
        
        # Currency transactions have 'CASH' as AssetClass and currency pairs as Symbol
        return (asset_class == 'CASH' and 
                ('.' in symbol or symbol in ['EUR/GBP', 'GBP/USD', 'USD/EUR']))
    
    def _has_required_fields(self, row: Dict[str, Any]) -> bool:
        """Check if a row has all required fields for transaction creation.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            True if the row has all required fields, False otherwise
        """
        required_fields = [
            'Buy/Sell', 'TradeDate', 'Symbol', 'Quantity'
        ]
        
        # Check for price field (can be TradePrice or UnitPrice)
        has_price = 'TradePrice' in row or 'UnitPrice' in row
        
        # Check for currency field (can be CurrencyPrimary or Currency)
        has_currency = 'CurrencyPrimary' in row or 'Currency' in row
        
        # Check for FX rate field (can be FXRateToBase or CurrencyRate)
        has_fx_rate = 'FXRateToBase' in row or 'CurrencyRate' in row
        
        return (all(field in row and row[field] for field in required_fields) and
                has_price and has_currency and has_fx_rate)
    
    def _create_transaction_from_row(self, row: Dict[str, Any]) -> Optional[Transaction]:
        """Create a Transaction object from a CSV row.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            A Transaction object or None if creation fails
        """
        try:
            # Determine transaction type
            transaction_type = self._get_transaction_type(row)
            
            # Create security
            security = self._create_security_from_row(row)
            
            # Parse date
            date = self._parse_date(row.get('TradeDate', ''))
            
            # Parse quantity (ensure it's positive for buys, negative for sells)
            quantity = float(row.get('Quantity', '0'))
            if transaction_type == TransactionType.SELL and quantity > 0:
                quantity = -quantity
            elif transaction_type == TransactionType.BUY and quantity < 0:
                quantity = abs(quantity)
            
            # Parse price and fees (handle alternative field names)
            price_per_unit = float(row.get('TradePrice') or row.get('UnitPrice', '0'))
            commission = abs(float(row.get('IBCommission') or row.get('Commission', '0')))
            taxes = abs(float(row.get('Taxes', '0')))
            
            # Create currency (handle alternative field names)
            currency_code = row.get('CurrencyPrimary') or row.get('Currency', self.base_currency)
            fx_rate = float(row.get('FXRateToBase') or row.get('CurrencyRate', '1.0'))
            currency = Currency(code=currency_code, rate_to_base=fx_rate)
            
            # Create transaction
            return Transaction(
                transaction_id=row.get('TradeID', ''),
                transaction_type=transaction_type,
                security=security,
                date=date,
                quantity=quantity,
                price_per_unit=price_per_unit,
                commission=commission,
                taxes=taxes,
                currency=currency
            )
            
        except (ValueError, TypeError) as e:
            self.logger.error(f"Error creating transaction from row: {e}")
            return None
    
    def _get_transaction_type(self, row: Dict[str, Any]) -> TransactionType:
        """Determine the transaction type from a CSV row.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            A TransactionType enum value
        """
        buy_sell = row.get('Buy/Sell', '')
        
        if buy_sell == 'BUY':
            return TransactionType.BUY
        elif buy_sell == 'SELL':
            return TransactionType.SELL
        else:
            # Default to BUY if unknown
            self.logger.warning(f"Unknown transaction type: {buy_sell}, defaulting to BUY")
            return TransactionType.BUY
    
    def _create_security_from_row(self, row: Dict[str, Any]) -> Security:
        """Create a Security object from a CSV row.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            A Security object
        """
        symbol = row.get('Symbol', '')
        name = row.get('Description', '')
        
        # Determine security ID and type
        security_id = row.get('SecurityID', '')
        security_id_type = row.get('SecurityIDType', '')
        
        # If SecurityID is empty but ISIN is present, use ISIN
        if not security_id and row.get('ISIN'):
            security_id = row.get('ISIN')
            security_id_type = 'ISIN'
        
        # Create security based on ID type
        if security_id_type == 'ISIN':
            return Security.create_with_isin(
                isin=security_id,
                symbol=symbol,
                name=name
            )
        elif security_id_type == 'CUSIP':
            return Security.create_with_cusip(
                cusip=security_id,
                symbol=symbol,
                name=name
            )
        else:
            # Default to using symbol as ticker if no recognized ID
            return Security.create_with_ticker(
                ticker=symbol,
                symbol=symbol,
                name=name
            )
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse a date string from the CSV file.
        
        Args:
            date_str: Date string in YYYY-MM-DD format
            
        Returns:
            A datetime object
        """
        try:
            # Try YYYY-MM-DD format first
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            try:
                # Fallback to MM/DD/YYYY format
                return datetime.strptime(date_str, '%m/%d/%Y')
            except ValueError:
                self.logger.error(f"Error parsing date: {date_str}")
                # Return current date as fallback
                return datetime.now()
