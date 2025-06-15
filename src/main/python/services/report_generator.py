"""Report generator implementation."""
import logging
import csv
import json
from typing import List, Dict
from datetime import datetime

from ..interfaces.calculator_interfaces import ReportGeneratorInterface
from ..models.domain_models import Disposal, TaxYearSummary


class CSVReportGenerator(ReportGeneratorInterface):
    """CSV implementation of report generator."""
    
    def __init__(self):
        """Initialize the CSV report generator."""
        self.logger = logging.getLogger(__name__)
    
    def generate_report(
        self, 
        tax_year_summary: TaxYearSummary,
        output_path: str
    ) -> None:
        """
        Generate a CSV tax report for a specific tax year.
        
        Args:
            tax_year_summary: The tax year summary
            output_path: Path to save the report
        """
        self.logger.info(f"Generating CSV report for {tax_year_summary.tax_year} to {output_path}")
        
        # Ensure the output path has a .csv extension
        if not output_path.lower().endswith('.csv'):
            output_path += '.csv'
        
        try:
            with open(output_path, 'w', newline='') as csvfile:
                # Create a writer for the disposal details
                writer = csv.writer(csvfile)
                
                # Write the header
                writer.writerow([
                    'Disposal Date', 
                    'Security', 
                    'Quantity', 
                    'Proceeds (GBP)', 
                    'Cost (GBP)', 
                    'Expenses (GBP)', 
                    'Gain/Loss (GBP)', 
                    'Matching Rule'
                ])
                
                # Write each disposal
                for disposal in tax_year_summary.disposals:
                    writer.writerow([
                        disposal.sell_date.strftime('%Y-%m-%d'),
                        disposal.security.isin,
                        disposal.quantity,
                        f"{disposal.proceeds:.2f}",
                        f"{disposal.cost_basis:.2f}",
                        f"{disposal.expenses:.2f}",
                        f"{disposal.gain_or_loss:.2f}",
                        disposal.matching_rule
                    ])
                
                # Add a blank row
                writer.writerow([])
                
                # Write the summary
                writer.writerow(['Tax Year Summary'])
                writer.writerow(['Tax Year', tax_year_summary.tax_year])
                writer.writerow(['Total Proceeds', f"{tax_year_summary.total_proceeds:.2f}"])
                writer.writerow(['Total Gains', f"{tax_year_summary.total_gains:.2f}"])
                writer.writerow(['Total Losses', f"{tax_year_summary.total_losses:.2f}"])
                writer.writerow(['Net Gain/Loss', f"{tax_year_summary.net_gain:.2f}"])
                writer.writerow(['Annual Exemption Used', f"{tax_year_summary.annual_exemption_used:.2f}"])
                writer.writerow(['Taxable Gain', f"{tax_year_summary.taxable_gain:.2f}"])
                
                self.logger.info(f"CSV report successfully generated at {output_path}")
                
        except Exception as e:
            self.logger.error(f"Error generating CSV report: {e}")
            raise


class JSONReportGenerator(ReportGeneratorInterface):
    """JSON implementation of report generator."""
    
    def __init__(self):
        """Initialize the JSON report generator."""
        self.logger = logging.getLogger(__name__)
    
    def generate_report(
        self, 
        tax_year_summary: TaxYearSummary,
        output_path: str
    ) -> None:
        """
        Generate a JSON tax report for a specific tax year.
        
        Args:
            tax_year_summary: The tax year summary
            output_path: Path to save the report
        """
        self.logger.info(f"Generating JSON report for {tax_year_summary.tax_year} to {output_path}")
        
        # Ensure the output path has a .json extension
        if not output_path.lower().endswith('.json'):
            output_path += '.json'
        
        try:
            # Convert the tax year summary to a dictionary
            summary_dict = {
                'tax_year': tax_year_summary.tax_year,
                'disposals': [
                    {
                        'date': disposal.sell_date.strftime('%Y-%m-%d'),
                        'security': disposal.security.isin,
                        'quantity': disposal.quantity,
                        'proceeds': round(disposal.proceeds, 2),
                        'cost_basis': round(disposal.cost_basis, 2),
                        'expenses': round(disposal.expenses, 2),
                        'gain_or_loss': round(disposal.gain_or_loss, 2),
                        'matching_rule': disposal.matching_rule
                    }
                    for disposal in tax_year_summary.disposals
                ],
                'summary': {
                    'total_proceeds': round(tax_year_summary.total_proceeds, 2),
                    'total_gains': round(tax_year_summary.total_gains, 2),
                    'total_losses': round(tax_year_summary.total_losses, 2),
                    'net_gain': round(tax_year_summary.net_gain, 2),
                    'annual_exemption_used': round(tax_year_summary.annual_exemption_used, 2),
                    'taxable_gain': round(tax_year_summary.taxable_gain, 2)
                }
            }
            
            # Write the dictionary to a JSON file
            with open(output_path, 'w') as jsonfile:
                json.dump(summary_dict, jsonfile, indent=2)
                
            self.logger.info(f"JSON report successfully generated at {output_path}")
                
        except Exception as e:
            self.logger.error(f"Error generating JSON report: {e}")
            raise
