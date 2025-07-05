"""Report generator implementation."""
import logging
import csv
import json
from typing import List, Dict, Union
from datetime import datetime

from ..interfaces.calculator_interfaces import ReportGeneratorInterface
from ..models.domain_models import Disposal, TaxYearSummary, ComprehensiveTaxSummary


class CSVReportGenerator(ReportGeneratorInterface):
    """CSV implementation of report generator."""
    
    def __init__(self):
        """Initialize the CSV report generator."""
        self.logger = logging.getLogger(__name__)
    
    def generate_report(
        self, 
        tax_year_summary: Union[TaxYearSummary, ComprehensiveTaxSummary],
        output_path: str
    ) -> None:
        """
        Generate a CSV tax report for a specific tax year.
        
        Args:
            tax_year_summary: The tax year summary (TaxYearSummary or ComprehensiveTaxSummary)
            output_path: Path to save the report
        """
        self.logger.info(f"Generating CSV report for {tax_year_summary.tax_year} to {output_path}")
        
        # Ensure the output path has a .csv extension
        if not output_path.lower().endswith('.csv'):
            output_path += '.csv'
        
        try:
            with open(output_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                
                # Handle both TaxYearSummary and ComprehensiveTaxSummary
                if isinstance(tax_year_summary, ComprehensiveTaxSummary):
                    self._generate_comprehensive_csv_report(writer, tax_year_summary)
                else:
                    self._generate_basic_csv_report(writer, tax_year_summary)
                
                self.logger.info(f"CSV report successfully generated at {output_path}")
                
        except Exception as e:
            self.logger.error(f"Error generating CSV report: {e}")
            raise
    
    def _generate_basic_csv_report(self, writer, tax_year_summary: TaxYearSummary):
        """Generate basic CSV report for TaxYearSummary."""
        # Pre-format all rows to avoid repeated string formatting
        rows = [
            [
                'Disposal Date', 
                'Security', 
                'Quantity', 
                'Proceeds (GBP)', 
                'Cost (GBP)', 
                'Expenses (GBP)', 
                'Gain/Loss (GBP)', 
                'Matching Rule'
            ]
        ]
        
        # Pre-format all disposal rows
        for disposal in tax_year_summary.disposals:
            rows.append([
                disposal.sell_date.strftime('%Y-%m-%d'),
                disposal.security.isin,
                disposal.quantity,
                round(disposal.proceeds, 2),
                round(disposal.cost_basis, 2),
                round(disposal.expenses, 2),
                round(disposal.gain_or_loss, 2),
                disposal.matching_rule
            ])
        
        # Add summary section
        rows.extend([
            [],
            ['Tax Year Summary'],
            ['Tax Year', tax_year_summary.tax_year],
            ['Total Proceeds', round(tax_year_summary.total_proceeds, 2)],
            ['Total Gains', round(tax_year_summary.total_gains, 2)],
            ['Total Losses', round(tax_year_summary.total_losses, 2)],
            ['Net Gain/Loss', round(tax_year_summary.net_gain, 2)],
            ['Annual Exemption Used', round(tax_year_summary.annual_exemption_used, 2)],
            ['Taxable Gain', round(tax_year_summary.taxable_gain, 2)]
        ])
        
        # Write all rows at once
        writer.writerows(rows)
    
    def _generate_comprehensive_csv_report(self, writer, comprehensive_summary: ComprehensiveTaxSummary):
        """Generate comprehensive CSV report for ComprehensiveTaxSummary."""
        # Pre-format all numeric values to avoid repeated string formatting
        rows = []
        
        # Capital Gains Section
        if comprehensive_summary.capital_gains:
            rows.extend([
                ['CAPITAL GAINS'],
                [
                    'Disposal Date', 
                    'Security', 
                    'Quantity', 
                    'Proceeds (GBP)', 
                    'Cost (GBP)', 
                    'Expenses (GBP)', 
                    'Gain/Loss (GBP)', 
                    'Matching Rule'
                ]
            ])
            
            # Pre-format all disposal rows
            for disposal in comprehensive_summary.capital_gains.disposals:
                rows.append([
                    disposal.sell_date.strftime('%Y-%m-%d'),
                    disposal.security.isin,
                    disposal.quantity,
                    round(disposal.proceeds, 2),
                    round(disposal.cost_basis, 2),
                    round(disposal.expenses, 2),
                    round(disposal.gain_or_loss, 2),
                    disposal.matching_rule
                ])
            
            rows.extend([
                [],
                ['Capital Gains Summary'],
                ['Total Gains', round(comprehensive_summary.capital_gains.total_gains, 2)],
                ['Taxable Gain', round(comprehensive_summary.capital_gains.taxable_gain, 2)],
                ['Allowance Used', round(comprehensive_summary.capital_gains_allowance_used, 2)],
                []
            ])
        
        # Dividend Income Section
        if comprehensive_summary.dividend_income:
            rows.extend([
                ['DIVIDEND INCOME'],
                ['Total Gross', round(comprehensive_summary.dividend_income.total_gross_gbp, 2)],
                ['Total Net', round(comprehensive_summary.dividend_income.total_net_gbp, 2)],
                ['Taxable Income', round(comprehensive_summary.dividend_income.taxable_dividend_income, 2)],
                ['Allowance Used', round(comprehensive_summary.dividend_allowance_used, 2)],
                []
            ])
        
        # Currency Gains Section
        if comprehensive_summary.currency_gains:
            rows.extend([
                ['CURRENCY GAINS/LOSSES'],
                ['Total Gains', round(comprehensive_summary.currency_gains.total_gains, 2)],
                ['Total Losses', round(comprehensive_summary.currency_gains.total_losses, 2)],
                ['Net Gain/Loss', round(comprehensive_summary.currency_gains.net_gain_loss, 2)],
                []
            ])
        
        # Overall Summary
        rows.extend([
            ['OVERALL SUMMARY'],
            ['Tax Year', comprehensive_summary.tax_year],
            ['Total Allowable Costs', round(comprehensive_summary.total_allowable_costs, 2)],
            ['Total Taxable Income', round(comprehensive_summary.total_taxable_income, 2)]
        ])
        
        # Write all rows at once
        writer.writerows(rows)


class JSONReportGenerator(ReportGeneratorInterface):
    """JSON implementation of report generator."""
    
    def __init__(self):
        """Initialize the JSON report generator."""
        self.logger = logging.getLogger(__name__)
    
    def generate_report(
        self, 
        tax_year_summary: Union[TaxYearSummary, ComprehensiveTaxSummary],
        output_path: str
    ) -> None:
        """
        Generate a JSON tax report for a specific tax year.
        
        Args:
            tax_year_summary: The tax year summary (TaxYearSummary or ComprehensiveTaxSummary)
            output_path: Path to save the report
        """
        self.logger.info(f"Generating JSON report for {tax_year_summary.tax_year} to {output_path}")
        
        # Ensure the output path has a .json extension
        if not output_path.lower().endswith('.json'):
            output_path += '.json'
        
        try:
            # Handle both TaxYearSummary and ComprehensiveTaxSummary
            if isinstance(tax_year_summary, ComprehensiveTaxSummary):
                summary_dict = self._generate_comprehensive_json_dict(tax_year_summary)
            else:
                summary_dict = self._generate_basic_json_dict(tax_year_summary)
            
            # Write the dictionary to a JSON file
            with open(output_path, 'w') as jsonfile:
                json.dump(summary_dict, jsonfile, indent=2)
                
            self.logger.info(f"JSON report successfully generated at {output_path}")
                
        except Exception as e:
            self.logger.error(f"Error generating JSON report: {e}")
            raise
    
    def _generate_basic_json_dict(self, tax_year_summary: TaxYearSummary):
        """Generate basic JSON dictionary for TaxYearSummary."""
        return {
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
    
    def _generate_comprehensive_json_dict(self, comprehensive_summary: ComprehensiveTaxSummary):
        """Generate comprehensive JSON dictionary for ComprehensiveTaxSummary."""
        # Pre-compute all numeric values to avoid repeated rounding
        result = {
            'tax_year': comprehensive_summary.tax_year,
            'total_allowable_costs': round(comprehensive_summary.total_allowable_costs, 2),
            'total_taxable_income': round(comprehensive_summary.total_taxable_income, 2)
        }
        
        # Capital gains section
        if comprehensive_summary.capital_gains:
            # Pre-compute all disposal values
            disposals = []
            for disposal in comprehensive_summary.capital_gains.disposals:
                disposals.append({
                    'date': disposal.sell_date.strftime('%Y-%m-%d'),
                    'security': disposal.security.isin,
                    'quantity': disposal.quantity,
                    'proceeds': round(disposal.proceeds, 2),
                    'cost_basis': round(disposal.cost_basis, 2),
                    'expenses': round(disposal.expenses, 2),
                    'gain_or_loss': round(disposal.gain_or_loss, 2),
                    'matching_rule': disposal.matching_rule
                })
            
            result['capital_gains'] = {
                'disposals': disposals,
                'summary': {
                    'total_gains': round(comprehensive_summary.capital_gains.total_gains, 2),
                    'taxable_gain': round(comprehensive_summary.capital_gains.taxable_gain, 2),
                    'allowance_used': round(comprehensive_summary.capital_gains_allowance_used, 2)
                }
            }
        
        # Dividend income section
        if comprehensive_summary.dividend_income:
            result['dividend_income'] = {
                'total_gross_gbp': round(comprehensive_summary.dividend_income.total_gross_gbp, 2),
                'total_net_gbp': round(comprehensive_summary.dividend_income.total_net_gbp, 2),
                'taxable_dividend_income': round(comprehensive_summary.dividend_income.taxable_dividend_income, 2),
                'allowance_used': round(comprehensive_summary.dividend_allowance_used, 2)
            }
        
        # Currency gains section
        if comprehensive_summary.currency_gains:
            result['currency_gains'] = {
                'total_gains': round(comprehensive_summary.currency_gains.total_gains, 2),
                'total_losses': round(comprehensive_summary.currency_gains.total_losses, 2),
                'net_gain_loss': round(comprehensive_summary.currency_gains.net_gain_loss, 2)
            }
        
        return result
