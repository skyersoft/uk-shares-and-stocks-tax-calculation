"""CSV file parser implementation."""
import logging
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..interfaces.calculator_interfaces import FileParserInterface
from ..models.domain_models import Transaction, TransactionType, Security, Currency, AssetClass


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
                    # Create transaction
                    transaction = self._create_transaction_from_row(row)
                    if transaction: # Only add if transaction creation was successful
                        transactions.append(transaction)
            
            return transactions
            
        except Exception as e:
            self.logger.error(f"Error parsing CSV file: {e}")
            return transactions
    
    def _create_transaction_from_row(self, row: Dict[str, Any]) -> Optional[Transaction]:
        """Create a Transaction object from a CSV row.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            A Transaction object or None if creation fails
        """
        try:
            # Determine transaction type
            transaction_type = self._map_transaction_type(row)
            
            # Create security
            security = self._create_security_from_row(row)
            
            # Parse date (handle alternative field names)
            date_str = row.get('TradeDate') or row.get('Date', '')
            date = self._parse_date(date_str)
            if not date: # If date parsing failed, skip this row
                self.logger.warning(f"Skipping row due to invalid date: {row}")
                return None
            
            # Parse quantity (ensure it's positive for buys, negative for sells)
            quantity_str = row.get('Quantity', '0')
            if not quantity_str:
                self.logger.warning(f"Skipping row due to missing quantity: {row}")
                return None
            quantity = float(quantity_str)
            
            # Sharesight CSV has quantity as positive for both buy/sell, adjust for internal model
            if transaction_type == TransactionType.SELL and quantity > 0:
                quantity = -quantity
            
            # Parse price and fees (handle alternative field names)
            price_per_unit_str = row.get('TradePrice') or row.get('UnitPrice', '0')
            if not price_per_unit_str:
                self.logger.warning(f"Skipping row due to missing price: {row}")
                return None
            price_per_unit = float(price_per_unit_str)
            
            commission = abs(float(row.get('IBCommission') or row.get('Commission', '0')))
            taxes = abs(float(row.get('Taxes', '0')))
            
            # Extract additional fields (these are not critical for basic transaction creation)
            close_price = float(row.get('ClosePrice', '0'))
            mtm_pnl = float(row.get('MtmPnl', '0'))
            fifo_pnl_realized = float(row.get('FifoPnlRealized', '0'))
            
            # Create currency (handle alternative field names)
            currency_code = row.get('CurrencyPrimary') or row.get('Currency', self.base_currency)
            fx_rate_str = row.get('FXRateToBase') or row.get('CurrencyRate', '1.0')
            if not fx_rate_str:
                self.logger.warning(f"Skipping row due to missing FX rate: {row}")
                return None
            fx_rate = float(fx_rate_str)
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
            self.logger.error(f"Error creating transaction from row: {row}. Error: {e}")
            return None
    
    def _map_transaction_type(self, row: Dict[str, Any]) -> TransactionType:
        """Map Sharesight transaction data to internal transaction types."""
        asset_class = row.get('AssetClass', '')
        buy_sell = row.get('Buy/Sell', '')
        transaction_type_str = row.get('TransactionType', '')

        if asset_class == 'CASH':
            return TransactionType.CURRENCY_EXCHANGE
        elif buy_sell == 'BUY':
            return TransactionType.BUY
        elif buy_sell == 'SELL':
            return TransactionType.SELL
        elif 'DIV' in transaction_type_str:
            return TransactionType.DIVIDEND
        elif 'INT' in transaction_type_str:
            return TransactionType.INTEREST
        elif 'COMM' in transaction_type_str:
            return TransactionType.COMMISSION
        elif 'TAX' in transaction_type_str:
            return TransactionType.TAX_WITHHOLDING
        elif 'SPLIT' in transaction_type_str:
            return TransactionType.SPLIT
        elif 'MERGER' in transaction_type_str:
            return TransactionType.MERGER
        elif 'TRANSFER_IN' in transaction_type_str:
            return TransactionType.TRANSFER_IN
        elif 'TRANSFER_OUT' in transaction_type_str:
            return TransactionType.TRANSFER_OUT
        elif 'CASH_ADJ' in transaction_type_str:
            return TransactionType.CASH_ADJUSTMENT
        elif 'FEE' in transaction_type_str:
            return TransactionType.FEE
        
        self.logger.warning(f"Unknown transaction type in row: {row}, defaulting to BUY")
        return TransactionType.BUY
    
    def _create_security_from_row(self, row: Dict[str, Any]) -> Security:
        """Create a Security object from a CSV row.
        
        Args:
            row: A dictionary representing a row from the CSV
            
        Returns:
            A Security object
        """
        symbol = row.get('Symbol', '')
        name = row.get('Name', '') or row.get('Description', '')
        
        # Get asset class information if available
        asset_class_str = row.get('AssetClass', '')
        sub_category = row.get('SubCategory', '')
        listing_exchange = row.get('ListingExchange', '')
        trading_exchange = row.get('Exchange', '')
        
        # Determine security ID and type
        security_id = row.get('SecurityID', '')
        security_id_type = row.get('SecurityIDType', '')
        
        # If SecurityID is empty but ISIN is present, use ISIN
        if not security_id and row.get('ISIN'):
            security_id = row.get('ISIN')
            security_id_type = 'ISIN'
        
        # Create security based on ID type
        if security_id_type == 'ISIN':
            security = Security.create_with_isin(
                isin=security_id,
                symbol=symbol,
                name=name
            )
        elif security_id_type == 'CUSIP':
            security = Security.create_with_cusip(
                cusip=security_id,
                symbol=symbol,
                name=name
            )
        else:
            # Default to using symbol as ticker if no recognized ID
            security = Security.create_with_ticker(
                ticker=symbol,
                symbol=symbol,
                name=name
            )
        
        # Set asset class if available and the security has the attribute
        if asset_class_str:
            try:
                # Map CSV asset class strings to AssetClass enum
                asset_class_map = {
                    'STK': AssetClass.STOCK,
                    'ETF': AssetClass.ETF,
                    'CLOSED-END FUND': AssetClass.CLOSED_END_FUND,
                    'CASH': AssetClass.CASH,
                    'BOND': AssetClass.BOND,
                    'OPT': AssetClass.OPTION,
                    'FUT': AssetClass.FUTURE
                }
                
                if asset_class_str in asset_class_map:
                    security.asset_class = asset_class_map[asset_class_str]
            except (AttributeError, ValueError) as e:
                self.logger.warning(f"Could not set asset class: {e}")
        
        # Set exchange information if available and the security has the attributes
        if listing_exchange:
            security.listing_exchange = listing_exchange
        
        if trading_exchange:
            security.trading_exchange = trading_exchange
        
        if sub_category:
            security.sub_category = sub_category
        
        return security
    
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
                try:
                    # Try DD/MM/YYYY format
                    return datetime.strptime(date_str, '%d/%m/%Y')
                except ValueError:
                    self.logger.error(f"Error parsing date: {date_str}")
                    return None # Return None on parsing failure
