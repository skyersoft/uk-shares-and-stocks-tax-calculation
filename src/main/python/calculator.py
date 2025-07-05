"""Main calculator module."""
import logging
import os
import logging
import os
from typing import List, Dict, Optional

from .interfaces.calculator_interfaces import (
    FileParserInterface,
    TransactionMatcherInterface,
    DisposalCalculatorInterface,
    TaxYearCalculatorInterface,
    ReportGeneratorInterface
)
from .parsers.qfx_parser import QfxParser
from .parsers.csv_parser import CsvParser # This is used in the default file_parser, so keep it.
from .services.transaction_matcher import UKTransactionMatcher
from .services.disposal_calculator import UKDisposalCalculator
from .services.tax_year_calculator import EnhancedTaxYearCalculator
from .services.dividend_processor import DividendProcessor
from .services.currency_processor import CurrencyExchangeProcessor
from .services.report_generator import CSVReportGenerator, JSONReportGenerator
from .models.domain_models import ComprehensiveTaxSummary, Transaction # Keep Transaction as it's used in calculate method
from .config.tax_config import TAX_YEARS, BASE_CURRENCY


class CapitalGainsTaxCalculator:
    """Main class for calculating capital gains tax."""
    
    def __init__(
        self,
        file_parser: FileParserInterface = None,
        transaction_matcher: TransactionMatcherInterface = None,
        disposal_calculator: DisposalCalculatorInterface = None,
        tax_year_calculator: TaxYearCalculatorInterface = None, # This will now be EnhancedTaxYearCalculator
        report_generator: ReportGeneratorInterface = None,
        dividend_processor: DividendProcessor = None,
        currency_processor: CurrencyExchangeProcessor = None,
        base_currency: str = BASE_CURRENCY
    ):
        """
        Initialize the calculator with the required components.
        
        Args:
            file_parser: Parser for transaction files
            transaction_matcher: Matcher for buy and sell transactions
            disposal_calculator: Calculator for disposals
            tax_year_calculator: Calculator for tax year summaries (now comprehensive)
            report_generator: Generator for tax reports
            dividend_processor: Processor for dividend transactions
            currency_processor: Processor for currency exchange transactions
            base_currency: Base currency for calculations
        """
        self.logger = logging.getLogger(__name__)
        
        # Set up default components if not provided
        self.file_parser = file_parser or QfxParser(base_currency=base_currency)
        self.transaction_matcher = transaction_matcher or UKTransactionMatcher()
        self.disposal_calculator = disposal_calculator or UKDisposalCalculator()
        
        # Initialize dividend and currency processors
        self.dividend_processor = dividend_processor or DividendProcessor()
        self.currency_processor = currency_processor or CurrencyExchangeProcessor()
        
        # The tax_year_calculator now requires other processors
        self.tax_year_calculator = tax_year_calculator or EnhancedTaxYearCalculator(
            disposal_calculator=self.disposal_calculator,
            dividend_processor=self.dividend_processor,
            currency_processor=self.currency_processor,
            transaction_matcher=self.transaction_matcher
        )
        
        self.report_generator = report_generator or CSVReportGenerator() # This will need to be updated to handle ComprehensiveTaxSummary
        self.base_currency = base_currency
        
    def calculate(
        self,
        file_path: str,
        tax_year: str,
        output_path: str,
        report_format: str = "csv",
        file_type: str = "qfx"
    ) -> ComprehensiveTaxSummary: # Changed return type
        """
        Calculate comprehensive tax summary for a tax year from a transaction file.
        
        Args:
            file_path: Path to the transaction file
            tax_year: The tax year to calculate for
            output_path: Path to save the report
            report_format: Format of the report ("csv" or "json")
            file_type: Type of the input file ("qfx" or "csv")
            
        Returns:
            Comprehensive tax summary
        """
        self.logger.info(f"Calculating comprehensive tax for {tax_year} from {file_path} (file type: {file_type})")
        
        # Validate tax year
        if tax_year not in TAX_YEARS:
            raise ValueError(f"Invalid tax year: {tax_year}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Validate that the injected parser supports the requested file type
        if not self.file_parser.supports_file_type(file_type):
            raise ValueError(f"The configured parser does not support file type: {file_type}")
        
        self.logger.info(f"Using injected parser for file: {file_path}")
        
        # Parse the transaction file
        transactions = self.file_parser.parse(file_path)
        self.logger.info(f"Parsed {len(transactions)} transactions")
        
        # Check if any transactions were found
        if not transactions:
            raise ValueError("No transactions found in the file")
        
        # Calculate comprehensive tax summary using the new calculator
        comprehensive_summary = self.tax_year_calculator.calculate_comprehensive_tax_summary(
            transactions=transactions,
            tax_year=tax_year
        )
        
        # Generate report
        # The report generator needs to be updated to handle ComprehensiveTaxSummary
        # For now, we'll just pass the comprehensive_summary
        if self.report_generator:
            report_generator = self.report_generator
        elif report_format.lower() == "json":
            report_generator = JSONReportGenerator()
        else:
            report_generator = CSVReportGenerator()
            
        # The generate_report method of ReportGeneratorInterface might need to be updated
        # to accept ComprehensiveTaxSummary instead of TaxYearSummary.
        # For now, we'll assume it can handle it or will be updated later.
        report_generator.generate_report(
            tax_year_summary=comprehensive_summary, # Changed to comprehensive_summary
            output_path=output_path
        )
        
        return comprehensive_summary
