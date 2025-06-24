"""Interfaces for the capital gains tax calculator."""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Optional, Tuple

from ..models.domain_models import (
    Transaction,
    Security,
    SharePool,
    Disposal,
    TaxYearSummary,
)


class FileParserInterface(ABC):
    """Interface for parsing financial files."""
    
    @abstractmethod
    def parse(self, file_path: str) -> List[Transaction]:
        """Parse a file and return a list of transactions."""
        pass
    
    @abstractmethod
    def supports_file_type(self, file_type: str) -> bool:
        """Check if this parser supports the given file type."""
        pass


class TransactionMatcherInterface(ABC):
    """Interface for matching transactions according to tax rules."""
    
    @abstractmethod
    def match_disposals(self, transactions: List[Transaction]) -> List[Tuple[Transaction, List[Transaction]]]:
        """
        Match sell transactions with corresponding buy transactions.
        
        Args:
            transactions: List of all transactions
            
        Returns:
            List of tuples containing (sell transaction, matched buy transactions)
        """
        pass


class SharePoolManagerInterface(ABC):
    """Interface for managing share pools."""
    
    @abstractmethod
    def process_transaction(self, transaction: Transaction) -> None:
        """Process a transaction and update the relevant share pools."""
        pass
    
    @abstractmethod
    def get_pool(self, security: Security) -> Optional[SharePool]:
        """Get the share pool for a specific security."""
        pass
    
    @abstractmethod
    def get_all_pools(self) -> Dict[str, SharePool]:
        """Get all share pools."""
        pass


class DisposalCalculatorInterface(ABC):
    """Interface for calculating disposals."""
    
    @abstractmethod
    def calculate_disposal(
        self, 
        sell_transaction: Transaction, 
        matched_buys: List[Transaction]
    ) -> Disposal:
        """
        Calculate the disposal details for a sell transaction.
        
        Args:
            sell_transaction: The sell transaction
            matched_buys: List of matched buy transactions
            
        Returns:
            Disposal object with gain/loss calculation
        """
        pass


class TaxYearCalculatorInterface(ABC):
    """Interface for calculating tax year summaries."""
    
    @abstractmethod
    def calculate_tax_year_summary(
        self, 
        disposals: List[Disposal], 
        tax_year: str
    ) -> TaxYearSummary:
        """
        Calculate the tax summary for a specific tax year.
        
        Args:
            disposals: List of disposals
            tax_year: The tax year (e.g., "2024-2025")
            
        Returns:
            Tax year summary
        """
        pass


class ReportGeneratorInterface(ABC):
    """Interface for generating tax reports."""
    
    @abstractmethod
    def generate_report(
        self, 
        tax_year_summary: TaxYearSummary,
        output_path: str
    ) -> None:
        """
        Generate a tax report for a specific tax year.
        
        Args:
            tax_year_summary: The tax year summary
            output_path: Path to save the report
        """
        pass
