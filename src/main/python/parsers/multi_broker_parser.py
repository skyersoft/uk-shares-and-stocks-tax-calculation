"""
Adapter to expose multi-broker converters as a FileParserInterface.

This module adapts the new ConverterFactory and BrokerConverterInterface system
to the existing FileParserInterface expected by the CapitalGainsTaxCalculator.
"""

import logging
from typing import List
from datetime import datetime
from uuid import uuid4

from ..interfaces.calculator_interfaces import FileParserInterface
from ..models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    AssetClass
)
from ..converters.converter_factory import ConverterFactory, get_factory
from ..models.standard_transaction import (
    StandardTransaction, 
    TransactionType as StandardTransactionType,
    AssetClass as StandardAssetClass
)

logger = logging.getLogger(__name__)


class MultiBrokerParser(FileParserInterface):
    """
    Adapter that uses ConverterFactory to parse files.
    
    This allows the existing CapitalGainsTaxCalculator to use the new
    multi-broker conversion system transparently.
    """
    
    def __init__(self, factory: ConverterFactory = None, base_currency: str = "GBP"):
        """
        Initialize the parser.
        
        Args:
            factory: ConverterFactory instance (defaults to global singleton)
            base_currency: Base currency for calculations
        """
        self.factory = factory or get_factory()
        self.base_currency = base_currency
    
    def supports_file_type(self, file_type: str) -> bool:
        """
        Check if this parser supports the given file type.
        
        The new system supports CSV files from various brokers.
        """
        return file_type.lower() == "csv"
    
    def parse(self, file_path: str) -> List[Transaction]:
        """
        Parse a file using the detected broker converter.
        
        Args:
            file_path: Path to the file
            
        Returns:
            List of domain model Transaction objects
        """
        logger.info(f"MultiBrokerParser parsing: {file_path}")
        
        # 1. Convert using the new system
        standard_transactions = self.factory.convert_file(
            file_path=file_path,
            base_currency=self.base_currency
        )
        
        # 2. Map to domain models
        domain_transactions = []
        for st in standard_transactions:
            try:
                dt = self._map_to_domain_transaction(st)
                domain_transactions.append(dt)
            except Exception as e:
                logger.error(f"Failed to map transaction {st}: {e}")
        
        return domain_transactions
    
    def _map_to_domain_transaction(self, st: StandardTransaction) -> Transaction:
        """Map StandardTransaction to domain Transaction."""
        
        # Map Transaction Type
        tx_type = self._map_transaction_type(st.transaction_type)
        
        # Map Asset Class
        asset_class = self._map_asset_class(st.asset_class)
        
        # Create Security
        security = Security(
            symbol=st.symbol,
            name=st.name,
            isin=st.isin or "",
            asset_class=asset_class,
            # Use ISIN as ID if available, otherwise generate new or use symbol
            security_type="ISIN" if st.isin else "TICKER"
        )
        
        # Create Currency
        currency = Currency(
            code=st.transaction_currency,
            rate_to_base=float(st.fx_rate_to_base) if st.fx_rate_to_base else 1.0
        )
        
        # Create Transaction
        # Note: StandardTransaction uses Decimal, Domain uses float
        #
        # For DIVIDEND transactions, normalise to the convention used by QFX parser
        # and expected by DividendProcessor: quantity=1, price_per_unit=total_amount.
        # Freetrade CSV stores per-share dividend in Price and share count in Quantity,
        # so gross_amount (= abs(quantity) * price) holds the correct total.
        if tx_type == TransactionType.DIVIDEND:
            quantity = 1
            price_per_unit = float(st.gross_amount) if st.gross_amount else float(abs(st.quantity) * st.price)
        else:
            quantity = float(st.quantity)
            price_per_unit = float(st.price)

        return Transaction(
            transaction_id=st.transaction_id or str(uuid4()),
            transaction_type=tx_type,
            security=security,
            date=st.date,
            quantity=quantity,
            price_per_unit=price_per_unit,
            commission=float(st.commission),
            taxes=float(st.other_fees), # Map other fees to taxes for now
            currency=currency,
            withholding_tax=float(st.withholding_tax)
        )
    
    def _map_transaction_type(self, st_type: StandardTransactionType) -> TransactionType:
        """Map standard transaction type to domain type."""
        mapping = {
            StandardTransactionType.BUY: TransactionType.BUY,
            StandardTransactionType.SELL: TransactionType.SELL,
            StandardTransactionType.DIVIDEND: TransactionType.DIVIDEND,
            StandardTransactionType.INTEREST: TransactionType.INTEREST,
            StandardTransactionType.TAX_WITHHOLDING: TransactionType.TAX_WITHHOLDING,
            StandardTransactionType.FEE: TransactionType.FEE,
            StandardTransactionType.STOCK_SPLIT: TransactionType.SPLIT,
            StandardTransactionType.MERGER: TransactionType.MERGER,
            StandardTransactionType.SPIN_OFF: TransactionType.MERGER, # Closest match
            StandardTransactionType.TRANSFER_IN: TransactionType.TRANSFER_IN,
            StandardTransactionType.TRANSFER_OUT: TransactionType.TRANSFER_OUT,
            # StandardTransactionType.FX_CONVERSION: TransactionType.CURRENCY_EXCHANGE, # Not in StandardTransactionType yet
            # StandardTransactionType.DEPOSIT: TransactionType.CASH_ADJUSTMENT, # Not in StandardTransactionType yet
            # StandardTransactionType.WITHDRAWAL: TransactionType.CASH_ADJUSTMENT, # Not in StandardTransactionType yet
        }
        return mapping.get(st_type, TransactionType.BUY) # Default to BUY if unknown
    
    def _map_asset_class(self, st_class: StandardAssetClass) -> AssetClass:
        """Map standard asset class to domain asset class."""
        mapping = {
            StandardAssetClass.STOCK: AssetClass.STOCK,
            StandardAssetClass.ETF: AssetClass.ETF,
            StandardAssetClass.BOND: AssetClass.BOND,
            StandardAssetClass.OPTION: AssetClass.OPTION,
            StandardAssetClass.FUTURE: AssetClass.FUTURE,
            StandardAssetClass.FUND: AssetClass.ETF, # Closest match
            StandardAssetClass.FOREX: AssetClass.CASH,
            # StandardAssetClass.CASH: AssetClass.CASH, # Not in StandardAssetClass
            StandardAssetClass.CRYPTO: AssetClass.STOCK, # Treat crypto as stock for now
        }
        return mapping.get(st_class, AssetClass.STOCK)
