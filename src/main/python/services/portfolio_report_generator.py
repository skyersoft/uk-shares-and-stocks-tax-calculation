"""Portfolio report generator for comprehensive portfolio reporting."""
import logging
import csv
import json
from datetime import datetime
from typing import List, Dict, Union, Any, Optional
from io import StringIO

from ..models.domain_models import (
    PortfolioSummary, MarketSummary, Holding, ComprehensiveTaxSummary
)


class PortfolioReportGenerator:
    """Service for generating portfolio reports in multiple formats."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_market_grouped_report(
        self, 
        portfolio_summary: PortfolioSummary,
        as_of_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate market-grouped portfolio report matching desired format."""
        
        if as_of_date is None:
            as_of_date = datetime.now()
        
        report = {
            'title': 'Your investments grouped by market',
            'as_of_date': as_of_date,
            'markets': {},
            'grand_total': {
                'total_value': portfolio_summary.total_portfolio_value,
                'total_cost': portfolio_summary.total_portfolio_cost,
                'total_return_pct': portfolio_summary.total_return_pct,
                'number_of_holdings': portfolio_summary.number_of_holdings
            }
        }
        
        for market_name, market_summary in portfolio_summary.market_summaries.items():
            market_data = {
                'market_name': market_name,
                'holdings': [],
                'totals': {
                    'total_value': market_summary.total_value,
                    'total_cost': market_summary.total_cost,
                    'total_return_pct': self._calculate_market_return_pct(market_summary),
                    'weight_in_portfolio': market_summary.weight_in_portfolio
                }
            }
            
            for holding in market_summary.holdings:
                holding_data = {
                    'symbol': holding.security.symbol,
                    'name': holding.security.name or holding.security.symbol,
                    'price': holding.current_price,
                    'quantity': holding.quantity,
                    'value': holding.current_value_gbp,
                    'capital_gains_pct': holding.capital_gains_pct,
                    'dividend_yield_pct': holding.dividend_yield_pct,
                    'currency_effect_pct': holding.currency_effect_pct,
                    'total_return_pct': holding.total_return_pct,
                    'market': holding.market
                }
                market_data['holdings'].append(holding_data)
            
            # Sort holdings by value (descending)
            market_data['holdings'].sort(key=lambda x: x['value'], reverse=True)
            
            report['markets'][market_name] = market_data
        
        return report
    
    def _calculate_market_return_pct(self, market_summary: MarketSummary) -> float:
        """Calculate market-level return percentage."""
        if market_summary.total_cost > 0:
            return (market_summary.total_unrealized_gain_loss / market_summary.total_cost) * 100
        return 0.0
    
    def generate_csv_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary,
        output_path: str = None
    ) -> str:
        """Generate CSV portfolio report."""
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Market', 'Symbol', 'Name', 'Price', 'Quantity', 'Value (GBP)',
            'Capital Gains %', 'Dividend Yield %', 'Currency Effect %', 'Total Return %'
        ])
        
        # Market sections
        for market_name, market_summary in portfolio_summary.market_summaries.items():
            # Market header
            writer.writerow([f"=== {market_name} ===", "", "", "", "", "", "", "", "", ""])
            
            # Holdings
            for holding in market_summary.holdings:
                writer.writerow([
                    market_name,
                    holding.security.symbol,
                    holding.security.name or holding.security.symbol,
                    f"{holding.current_price:.2f}",
                    f"{holding.quantity:.2f}",
                    f"{holding.current_value_gbp:.2f}",
                    f"{holding.capital_gains_pct:.2f}%",
                    f"{holding.dividend_yield_pct:.2f}%",
                    f"{holding.currency_effect_pct:.2f}%",
                    f"{holding.total_return_pct:.2f}%"
                ])
            
            # Market subtotal
            writer.writerow([
                f"{market_name} Total",
                "", "", "", "",
                f"{market_summary.total_value:.2f}",
                f"{self._calculate_market_return_pct(market_summary):.2f}%",
                "", "", ""
            ])
            writer.writerow([])  # Empty row
        
        # Grand total
        writer.writerow([
            "Grand Total",
            "", "", "", "",
            f"{portfolio_summary.total_portfolio_value:.2f}",
            f"{portfolio_summary.total_return_pct:.2f}%",
            "", "", ""
        ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Save to file if path provided
        if output_path:
            if not output_path.lower().endswith('.csv'):
                output_path += '.csv'
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                f.write(csv_content)
            self.logger.info(f"CSV portfolio report saved to {output_path}")
        
        return csv_content
    
    def generate_json_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary,
        as_of_date: Optional[datetime] = None
    ) -> str:
        """Generate JSON portfolio report."""
        report = self.generate_market_grouped_report(portfolio_summary, as_of_date)
        
        # Convert datetime objects to strings for JSON serialization
        if isinstance(report['as_of_date'], datetime):
            report['as_of_date'] = report['as_of_date'].isoformat()
        
        return json.dumps(report, indent=2, default=str)
    
    def generate_html_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary,
        as_of_date: Optional[datetime] = None,
        template_path: str = None
    ) -> str:
        """Generate HTML portfolio report."""
        report_data = self.generate_market_grouped_report(portfolio_summary, as_of_date)
        
        # Basic HTML template if no template provided
        if not template_path:
            return self._generate_basic_html_report(report_data)
        
        # Use provided template
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()
            
            # Simple template substitution (in real implementation, use Jinja2)
            return template.format(**report_data)
        except Exception as e:
            self.logger.warning(f"Could not load template {template_path}: {e}")
            return self._generate_basic_html_report(report_data)
    
    def _generate_basic_html_report(self, report_data: Dict[str, Any]) -> str:
        """Generate basic HTML report."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{report_data['title']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: right; }}
                th {{ background-color: #f2f2f2; }}
                .market-header {{ background-color: #e6f3ff; font-weight: bold; }}
                .positive {{ color: green; }}
                .negative {{ color: red; }}
                .total-row {{ background-color: #f9f9f9; font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>{report_data['title']}</h1>
            <p>As of: {report_data['as_of_date']}</p>
        """
        
        for market_name, market_data in report_data['markets'].items():
            html += f"""
            <h2>{market_name}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Value (GBP)</th>
                        <th>Capital Gains %</th>
                        <th>Dividend Yield %</th>
                        <th>Currency Effect %</th>
                        <th>Total Return %</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for holding in market_data['holdings']:
                return_class = 'positive' if holding['total_return_pct'] >= 0 else 'negative'
                html += f"""
                    <tr>
                        <td>{holding['symbol']}</td>
                        <td style="text-align: left;">{holding['name']}</td>
                        <td>£{holding['price']:.2f}</td>
                        <td>{holding['quantity']:.2f}</td>
                        <td>£{holding['value']:.2f}</td>
                        <td class="{return_class}">{holding['capital_gains_pct']:.2f}%</td>
                        <td>{holding['dividend_yield_pct']:.2f}%</td>
                        <td>{holding['currency_effect_pct']:.2f}%</td>
                        <td class="{return_class}">{holding['total_return_pct']:.2f}%</td>
                    </tr>
                """
            
            market_return_class = 'positive' if market_data['totals']['total_return_pct'] >= 0 else 'negative'
            html += f"""
                    <tr class="total-row">
                        <td colspan="4">{market_name} Total</td>
                        <td>£{market_data['totals']['total_value']:.2f}</td>
                        <td class="{market_return_class}" colspan="3">{market_data['totals']['total_return_pct']:.2f}%</td>
                        <td>{market_data['totals']['weight_in_portfolio']:.1f}%</td>
                    </tr>
                </tbody>
            </table>
            """
        
        grand_total_class = 'positive' if report_data['grand_total']['total_return_pct'] >= 0 else 'negative'
        html += f"""
            <h2>Portfolio Summary</h2>
            <table>
                <tr class="total-row">
                    <td>Total Portfolio Value</td>
                    <td>£{report_data['grand_total']['total_value']:.2f}</td>
                </tr>
                <tr class="total-row">
                    <td>Total Return</td>
                    <td class="{grand_total_class}">{report_data['grand_total']['total_return_pct']:.2f}%</td>
                </tr>
                <tr class="total-row">
                    <td>Number of Holdings</td>
                    <td>{report_data['grand_total']['number_of_holdings']}</td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        return html
    
    def generate_comprehensive_report(
        self, 
        portfolio_summary: PortfolioSummary,
        tax_summary: ComprehensiveTaxSummary = None,
        output_format: str = "json",
        as_of_date: Optional[datetime] = None
    ) -> Union[str, Dict[str, Any]]:
        """Generate comprehensive report including portfolio and tax data."""
        
        portfolio_report = self.generate_market_grouped_report(portfolio_summary, as_of_date)
        
        # Add tax summary if provided
        if tax_summary:
            portfolio_report['tax_summary'] = {
                'tax_year': tax_summary.tax_year,
                'total_taxable_income': tax_summary.total_taxable_income,
                'capital_gains_allowance_used': tax_summary.capital_gains_allowance_used,
                'dividend_allowance_used': tax_summary.dividend_allowance_used
            }
        
        if output_format.lower() == "json":
            return self.generate_json_portfolio_report(portfolio_summary, as_of_date)
        elif output_format.lower() == "html":
            return self.generate_html_portfolio_report(portfolio_summary, as_of_date)
        elif output_format.lower() == "csv":
            return self.generate_csv_portfolio_report(portfolio_summary)
        else:
            return portfolio_report
