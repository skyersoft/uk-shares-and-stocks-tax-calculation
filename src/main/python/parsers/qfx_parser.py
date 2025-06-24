"""QFX file parser implementation."""
import logging
from datetime import datetime
from typing import List, Optional
from ofxparse import OfxParser
import xml.etree.ElementTree as ET


from ..interfaces.calculator_interfaces import FileParserInterface
from ..models.domain_models import Transaction, TransactionType, Security, Currency


class QfxParser(FileParserInterface):
    """Parser for QFX (Quicken Exchange Format) files."""
    
    def __init__(self, base_currency: str = "GBP"):
        """Initialize the QFX parser.
        
        Args:
            base_currency: The base currency for calculations (default: GBP)
        """
        self.base_currency = base_currency
        self.logger = logging.getLogger(__name__)
    
    def supports_file_type(self, file_type: str) -> bool:
        """Check if this parser supports the given file type."""
        return file_type.lower() == "qfx"
    
    def parse(self, file_path: str) -> List[Transaction]:
        """Parse a QFX file and extract transactions.
        
        Args:
            file_path: Path to the QFX file
            
        Returns:
            List of Transaction objects
        """
        self.logger.info(f"Parsing QFX file: {file_path}")
        
        transactions = []
        
        try:
            # Try manual XML parsing first for better handling of security IDs
            transactions = self._parse_manually(file_path)
            
            # If manual parsing fails, try OFXParser as fallback
            if not transactions:
                with open(file_path, 'rb') as file:
                    try:
                        ofx = OfxParser.parse(file)
                        
                        # Process investment transactions
                        for account in ofx.accounts:
                            if hasattr(account, 'statement'):
                                stmt = account.statement
                                if hasattr(stmt, 'transactions'):
                                    for tx in stmt.transactions:
                                        txn = self._convert_ofx_transaction(tx)
                                        if txn:
                                            transactions.append(txn)
                        
                        # Process transactions from investment accounts
                        if hasattr(ofx, 'investmentAccounts'):
                            for account in ofx.investmentAccounts:
                                if hasattr(account, 'statement'):
                                    stmt = account.statement
                                    if hasattr(stmt, 'transactions'):
                                        for tx in stmt.transactions:
                                            converter = self._convert_inv_tx
                                            txn = converter(tx)
                                            if txn:
                                                transactions.append(txn)
                    except Exception as e:
                        self.logger.warning(
                            'OFXParser failed: {}'.format(e))
                        # If OFXParser failed, we already have manual results
            
            return transactions
            
        except Exception as e:
            self.logger.error(f"Error parsing QFX file: {e}")
            return transactions
            
    def _convert_inv_tx(self, tx):
        """Shorthand for _convert_investment_transaction.
        Used to avoid line length issues."""
        return self._convert_investment_transaction(tx)

    def _convert_ofx_transaction(self, ofx_tx) -> Optional[Transaction]:
        """Convert an OFX transaction to our domain model."""
        try:
            # Skip non-stock transactions
            is_stock = (
                hasattr(ofx_tx, 'type') and
                ofx_tx.type in ['buystock', 'sellstock']
            )
            if not is_stock:
                return None
            
            is_buy = ofx_tx.type == 'buystock'
            tx_type = (
                TransactionType.BUY if is_buy else TransactionType.SELL
            )
            
            # Handle security identifiers with type prefixes
            isin = ''
            symbol = ''
            secid = None
            
            # First try SECID element
            if hasattr(ofx_tx, 'secid'):
                secid = ofx_tx.secid
            
            # Try accessing uniqueid/type through SECID
            if secid is not None:
                unique_id = getattr(secid, 'uniqueid', '')
                id_type = getattr(secid, 'uniqueidtype', '').upper()
                if id_type == 'CUSIP':
                    isin = f'CUSIP:{unique_id}'
                    symbol = unique_id  # Use full CUSIP as symbol
                else:
                    isin = unique_id
                    symbol = getattr(ofx_tx, 'ticker', '')
            
            security = Security(
                isin=isin,
                symbol=symbol
            )
            
            # Handle currency
            currency_code = getattr(ofx_tx, 'currency', self.base_currency)
            currency_rate = 1.0  # Default to 1:1 if no rate provided
            
            if hasattr(ofx_tx, 'currate'):
                currency_rate = float(ofx_tx.currate)
            
            currency = Currency(code=currency_code, rate_to_base=currency_rate)
            
            # Handle quantity
            quantity = float(getattr(ofx_tx, 'units', 0))
            if tx_type == TransactionType.SELL:
                quantity = -abs(quantity)  # Mark sell quantities negative
            
            # Handle price and fees
            price_per_unit = float(getattr(ofx_tx, 'unitprice', 0))
            commission = float(getattr(ofx_tx, 'commission', 0))
            taxes = float(getattr(ofx_tx, 'taxes', 0))
            
            # Calculate price if missing
            if price_per_unit == 0 and quantity != 0:
                total = getattr(ofx_tx, 'total', None)
                if total is not None:
                    try:
                        total = abs(float(total))
                        # Use total divided by quantity
                        price_per_unit = total / abs(quantity)
                        tx_id = getattr(ofx_tx, 'id', '')
                        msg = 'Unit price calc for tx {}: {}'
                        self.logger.warning(msg.format(tx_id, price_per_unit))
                    except (ValueError, ZeroDivisionError) as e:
                        tx_id = getattr(ofx_tx, 'id', '')
                        msg = 'Price calc error for tx {}: {}'
                        self.logger.error(msg.format(tx_id, e))
            
            return Transaction(
                transaction_id=getattr(ofx_tx, 'id', ''),
                transaction_type=tx_type,
                security=security,
                date=getattr(ofx_tx, 'tradeDate', datetime.now()),
                quantity=quantity,
                price_per_unit=price_per_unit,
                commission=commission,
                taxes=taxes,
                currency=currency
            )
        except Exception as e:
            self.logger.error(f"Error converting OFX transaction: {e}")
            return None

    def _convert_investment_transaction(self, inv_tx) -> Optional[Transaction]:
        """Convert an OFX investment transaction to our domain model."""
        try:
            # Determine transaction type
            tx_type = None
            if hasattr(inv_tx, 'type'):
                if inv_tx.type.lower() == 'buy':
                    tx_type = TransactionType.BUY
                elif inv_tx.type.lower() == 'sell':
                    tx_type = TransactionType.SELL
            
            if not tx_type:
                return None
                
            # Handle security identifiers with type prefixes
            isin = ''
            symbol = ''
            has_sec_type = hasattr(inv_tx, 'security_id_type')
            has_sec_id = hasattr(inv_tx, 'security')
            if has_sec_type and has_sec_id:
                id_type = getattr(inv_tx, 'security_id_type', '').upper()
                id_value = getattr(inv_tx, 'security', '')
                if id_type == 'CUSIP':
                    isin = f'CUSIP:{id_value}'
                    symbol = id_value  # Use full CUSIP as symbol
                else:
                    isin = id_value
                    symbol = getattr(inv_tx, 'ticker', '')
            
            security = Security(
                isin=isin,
                symbol=symbol
            )
            
            currency_code = getattr(inv_tx, 'currency', self.base_currency)
            currency_rate = 1.0
            
            if hasattr(inv_tx, 'currency_rate'):
                currency_rate = float(inv_tx.currency_rate)
                
            currency = Currency(code=currency_code, rate_to_base=currency_rate)
            
            quantity = float(getattr(inv_tx, 'units', 0))
            if tx_type == TransactionType.SELL:
                quantity = -abs(quantity)  # Mark sell quantities negative
            
            # Get price per unit, commission and taxes
            price_per_unit = float(getattr(inv_tx, 'unit_price', 0))
            commission = float(getattr(inv_tx, 'commission', 0))
            taxes = float(getattr(inv_tx, 'taxes', 0))
            
            # Try to calculate price_per_unit from total if it's zero
            if price_per_unit == 0 and quantity != 0:
                total = getattr(inv_tx, 'total', None)
                if total is not None:
                    try:
                        total = abs(float(total))
                        # Use total divided by quantity (don't subtract fees)
                        price_per_unit = total / abs(quantity)
                        tx_id = getattr(inv_tx, 'id', '')
                        self.logger.warning(
                            'Calculated unit price for tx {}: {}'.format(
                                tx_id, price_per_unit))
                    except (ValueError, ZeroDivisionError) as e:
                        tx_id = getattr(inv_tx, 'id', '')
                        self.logger.error(
                            'Error calc price for tx {}: {}'.format(tx_id, e))
                
            return Transaction(
                transaction_id=getattr(inv_tx, 'id', ''),
                transaction_type=tx_type,
                security=security,
                date=getattr(inv_tx, 'tradeDate', datetime.now()),
                quantity=quantity,
                price_per_unit=price_per_unit,
                commission=commission,
                taxes=taxes,
                currency=currency
            )
        except Exception as e:
            self.logger.error(f"Error converting investment transaction: {e}")
            return None
    
    def _parse_manually(self, file_path: str) -> List[Transaction]:
        """Manually parse the QFX file using XML parsing.
        
        This is a fallback method when the OFXParser doesn't handle investment 
        transactions properly.
        """
        transactions = []
        try:
            # QFX files are not strictly XML, so clean up the file first
            with open(file_path, 'r', encoding='latin-1') as file:
                content = file.read()
            
            # Find the OFX content (remove header)
            ofx_start = content.find('<OFX>')
            if ofx_start == -1:
                return transactions
                
            ofx_content = content[ofx_start:]
            
            # Parse as XML
            root = ET.fromstring(ofx_content)
            
            # Find buy stock transactions
            for buy_node in root.findall('.//BUYSTOCK'):
                tx = self._parse_buy_transaction(buy_node)
                if tx:
                    transactions.append(tx)
            
            # Find sell stock transactions
            for sell_node in root.findall('.//SELLSTOCK'):
                tx = self._parse_sell_transaction(sell_node)
                if tx:
                    transactions.append(tx)
                    
            return transactions
            
        except Exception as e:
            self.logger.error(f"Error in manual QFX parsing: {e}")
            return transactions
    
    def _parse_buy_transaction(self, node) -> Optional[Transaction]:
        """Parse a buy stock transaction node."""
        try:
            invbuy = node.find('./INVBUY')
            if invbuy is None:
                return None

            invtran = invbuy.find('./INVTRAN')
            if invtran is None:
                return None

            fitid = invtran.findtext('./FITID', '')
            date_str = invtran.findtext('./DTTRADE', '')

            if date_str:
                date_str = date_str.split('.')[0]
                if len(date_str) > 8:
                    fmt = '%Y%m%d%H%M%S'
                else:
                    fmt = '%Y%m%d'
                trade_date = datetime.strptime(date_str, fmt)
            else:
                trade_date = datetime.now()

            secid = invbuy.find('./SECID')
            if secid is None:
                return None

            uniqueid = secid.findtext('./UNIQUEID', '')
            uniqueidtype = secid.findtext('./UNIQUEIDTYPE', '')
            if not uniqueid:
                return None

            if uniqueidtype and uniqueidtype != 'ISIN':
                isin = f"{uniqueidtype}:{uniqueid}"
                security_type = uniqueidtype
            else:
                isin = uniqueid
                security_type = 'ISIN'

            symbol = uniqueid[-6:] if len(uniqueid) > 6 else uniqueid
            security = Security(isin=isin, symbol=symbol, security_type=security_type)

            units = float(invbuy.findtext('./UNITS', '0'))
            if units == 0:
                return None

            unit_price = float(invbuy.findtext('./UNITPRICE', '0'))
            # Handle missing price by total/units
            if unit_price == 0 and units != 0:
                total_str = invbuy.findtext('./TOTAL', '')
                if total_str:
                    try:
                        total = abs(float(total_str))
                        unit_price = total / units
                    except (ValueError, ZeroDivisionError):
                        return None

            commission = float(invbuy.findtext('./COMMISSION', '0'))
            taxes = float(invbuy.findtext('./TAXES', '0'))

            currency_node = invbuy.find('./CURRENCY')
            currency_code = self.base_currency
            currency_rate = 1.0

            if currency_node is not None:
                cur_sym = currency_node.findtext('./CURSYM')
                if cur_sym:
                    currency_code = cur_sym
                rate_str = currency_node.findtext('./CURRATE', '1.0')
                try:
                    currency_rate = float(rate_str)
                except ValueError:
                    currency_rate = 1.0

            currency = Currency(
                code=currency_code,
                rate_to_base=currency_rate
            )

            return Transaction(
                transaction_id=fitid,
                transaction_type=TransactionType.BUY,
                security=security,
                date=trade_date,
                quantity=units,
                price_per_unit=unit_price,
                commission=commission,
                taxes=taxes,
                currency=currency
            )
        except Exception as e:
            self.logger.error(f"Error parsing buy transaction: {e}")
            return None

    def _parse_sell_transaction(self, node) -> Optional[Transaction]:
        """Parse a sell stock transaction node."""
        try:
            invsell = node.find('./INVSELL')
            if invsell is None:
                return None

            invtran = invsell.find('./INVTRAN')
            if invtran is None:
                return None

            fitid = invtran.findtext('./FITID', '')
            date_str = invtran.findtext('./DTTRADE', '')

            if date_str:
                date_str = date_str.split('.')[0]
                if len(date_str) > 8:
                    fmt = '%Y%m%d%H%M%S'
                else:
                    fmt = '%Y%m%d'
                trade_date = datetime.strptime(date_str, fmt)
            else:
                trade_date = datetime.now()

            secid = invsell.find('./SECID')
            if secid is None:
                return None

            uniqueid = secid.findtext('./UNIQUEID', '')
            uniqueidtype = secid.findtext('./UNIQUEIDTYPE', '')
            if not uniqueid:
                return None

            if uniqueidtype and uniqueidtype != 'ISIN':
                isin = f"{uniqueidtype}:{uniqueid}"
                security_type = uniqueidtype
            else:
                isin = uniqueid
                security_type = 'ISIN'

            symbol = uniqueid[-6:] if len(uniqueid) > 6 else uniqueid
            security = Security(isin=isin, symbol=symbol, security_type=security_type)

            units = float(invsell.findtext('./UNITS', '0'))
            if units == 0:
                return None

            # Ensure sell quantities are negative
            if units > 0:
                units = -units

            unit_price = float(invsell.findtext('./UNITPRICE', '0'))
            # Handle missing price by total/units
            if unit_price == 0 and units != 0:
                total_str = invsell.findtext('./TOTAL', '')
                if total_str:
                    try:
                        total = abs(float(total_str))
                        unit_price = total / abs(units)
                    except (ValueError, ZeroDivisionError):
                        return None

            commission = float(invsell.findtext('./COMMISSION', '0'))
            taxes = float(invsell.findtext('./TAXES', '0'))

            currency_node = invsell.find('./CURRENCY')
            currency_code = self.base_currency
            currency_rate = 1.0

            if currency_node is not None:
                cur_sym = currency_node.findtext('./CURSYM')
                if cur_sym:
                    currency_code = cur_sym
                rate_str = currency_node.findtext('./CURRATE', '1.0')
                try:
                    currency_rate = float(rate_str)
                except ValueError:
                    currency_rate = 1.0

            currency = Currency(
                code=currency_code,
                rate_to_base=currency_rate
            )

            return Transaction(
                transaction_id=fitid,
                transaction_type=TransactionType.SELL,
                security=security,
                date=trade_date,
                quantity=units,
                price_per_unit=unit_price,
                commission=commission,
                taxes=taxes,
                currency=currency
            )
        except Exception as e:
            self.logger.error(f"Error parsing sell transaction: {e}")
            return None
