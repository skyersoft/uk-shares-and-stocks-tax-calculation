# Phase 6: Enhanced Reporting and Web Interface

## Overview

This phase creates the enhanced reporting and web interface to display the portfolio view matching your desired output format. It includes generating market-grouped portfolio reports, creating new web templates, and implementing the routes needed to display the comprehensive portfolio view with performance metrics.

## Goals

1. **Create portfolio report generator** - Generate reports matching the desired output format
2. **Build enhanced web templates** - Portfolio view templates with market grouping
3. **Implement new web routes** - Portfolio-specific routes and APIs
4. **Support multiple output formats** - CSV, JSON, HTML for portfolio reports

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 6.1 | Portfolio Report Generator | 3 days | 🔲 Todo | Phases 4,5 complete |
| 6.2 | Enhanced Web Interface Templates | 2 days | 🔲 Todo | Task 6.1 |
| 6.3 | Enhanced Web Routes for Portfolio View | 2 days | 🔲 Todo | Tasks 6.1, 6.2 |

**Total Phase Duration: 1-2 weeks**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 6.1: Portfolio Report Generator

**File:** `src/main/python/services/portfolio_report_generator.py`

**Estimated Time:** 3 days

### Description
Create a comprehensive report generator for portfolio views matching the desired output format.

### New Service Class

```python
class PortfolioReportGenerator:
    """Service for generating portfolio reports."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_market_grouped_report(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, Any]:
        """Generate market-grouped portfolio report matching desired format."""
        
        report = {
            'title': 'Your investments grouped by market',
            'as_of_date': portfolio_summary.as_of_date,
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
                    'total_return_pct': market_summary.total_return_pct,
                    'weight_in_portfolio': (market_summary.total_value / portfolio_summary.total_portfolio_value) * 100 if portfolio_summary.total_portfolio_value > 0 else 0
                }
            }
            
            for holding in market_summary.holdings:
                holding_data = {
                    'symbol': holding.security.symbol,
                    'name': holding.security.name,
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
            
            report['markets'][market_name] = market_data
        
        return report
    
    def generate_csv_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary, 
        output_path: str
    ) -> None:
        """Generate CSV portfolio report."""
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                'Market', 'Symbol', 'Name', 'Price', 'Quantity', 'Value (GBP)',
                'Capital Gains %', 'Dividends %', 'Currency %', 'Return %'
            ])
            
            # Write holdings by market
            for market_name, market_summary in portfolio_summary.market_summaries.items():
                for holding in market_summary.holdings:
                    writer.writerow([
                        market_name,
                        holding.security.symbol,
                        holding.security.name,
                        f"{holding.current_price:.2f}",
                        f"{holding.quantity:.0f}",
                        f"{holding.current_value_gbp:.2f}",
                        f"{holding.capital_gains_pct:.2f}%",
                        f"{holding.dividend_yield_pct:.2f}%",
                        f"{holding.currency_effect_pct:.2f}%",
                        f"{holding.total_return_pct:.2f}%"
                    ])
                
                # Write market total
                writer.writerow([
                    f"Total ({market_name})",
                    "", "", "", "",
                    f"{market_summary.total_value:.2f}",
                    f"{market_summary.total_return_pct:.2f}%",
                    "", "", ""
                ])
                writer.writerow([])  # Blank line
            
            # Write grand total
            writer.writerow([
                "Grand Total",
                "", "", "", "",
                f"{portfolio_summary.total_portfolio_value:.2f}",
                f"{portfolio_summary.total_return_pct:.2f}%",
                "", "", ""
            ])
    
    def generate_json_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> str:
        """Generate JSON portfolio report."""
        report = self.generate_market_grouped_report(portfolio_summary)
        
        # Convert datetime objects to strings for JSON serialization
        report['as_of_date'] = report['as_of_date'].isoformat()
        
        return json.dumps(report, indent=2, default=str)
    
    def generate_html_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary,
        template_path: str = None
    ) -> str:
        """Generate HTML portfolio report."""
        report_data = self.generate_market_grouped_report(portfolio_summary)
        
        # Basic HTML template if no template provided
        if not template_path:
            return self._generate_basic_html_report(report_data)
        
        # Use provided template
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()
        
        # Simple template substitution (in real implementation, use Jinja2)
        return template.format(**report_data)
    
    def _generate_basic_html_report(self, report_data: Dict[str, Any]) -> str:
        """Generate basic HTML report."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{report_data['title']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: right; }}
                th {{ background-color: #f2f2f2; }}
                .market-header {{ background-color: #e6f3ff; font-weight: bold; }}
                .total-row {{ background-color: #f9f9f9; font-weight: bold; }}
                .positive {{ color: green; }}
                .negative {{ color: red; }}
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
                        <th>Security</th>
                        <th>Price</th>
                        <th>QTY</th>
                        <th>Value</th>
                        <th>Capital Gains</th>
                        <th>Dividends</th>
                        <th>Currency</th>
                        <th>Return</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for holding in market_data['holdings']:
                return_class = 'positive' if holding['total_return_pct'] >= 0 else 'negative'
                html += f"""
                    <tr>
                        <td style="text-align: left;">{holding['symbol']}<br><small>{holding['name']}</small></td>
                        <td>{holding['price']:.2f}</td>
                        <td>{holding['quantity']:.0f}</td>
                        <td>£{holding['value']:.2f}</td>
                        <td class="{'positive' if holding['capital_gains_pct'] >= 0 else 'negative'}">{holding['capital_gains_pct']:.2f}%</td>
                        <td>{holding['dividend_yield_pct']:.2f}%</td>
                        <td class="{'positive' if holding['currency_effect_pct'] >= 0 else 'negative'}">{holding['currency_effect_pct']:.2f}%</td>
                        <td class="{return_class}"><strong>{holding['total_return_pct']:.2f}%</strong></td>
                    </tr>
                """
            
            # Market total row
            total_return_class = 'positive' if market_data['totals']['total_return_pct'] >= 0 else 'negative'
            html += f"""
                    <tr class="total-row">
                        <td style="text-align: left;"><strong>Total ({market_name})</strong></td>
                        <td></td>
                        <td></td>
                        <td><strong>£{market_data['totals']['total_value']:.2f}</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="{total_return_class}"><strong>{market_data['totals']['total_return_pct']:.2f}%</strong></td>
                    </tr>
                </tbody>
            </table>
            """
        
        # Grand total
        grand_total_class = 'positive' if report_data['grand_total']['total_return_pct'] >= 0 else 'negative'
        html += f"""
            <h2>Grand Total</h2>
            <table>
                <tbody>
                    <tr class="total-row">
                        <td style="text-align: left;"><strong>Grand Total since [Date]</strong></td>
                        <td></td>
                        <td></td>
                        <td><strong>£{report_data['grand_total']['total_value']:.2f}</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="{grand_total_class}"><strong>{report_data['grand_total']['total_return_pct']:.2f}%</strong></td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
        """
        
        return html
    
    def generate_comprehensive_report(
        self, 
        portfolio_summary: PortfolioSummary,
        tax_summary: ComprehensiveTaxSummary = None,
        output_format: str = "json"
    ) -> Union[str, Dict[str, Any]]:
        """Generate comprehensive report including portfolio and tax data."""
        
        portfolio_report = self.generate_market_grouped_report(portfolio_summary)
        
        if tax_summary:
            portfolio_report['tax_summary'] = {
                'tax_year': tax_summary.tax_year,
                'total_taxable_income': tax_summary.total_taxable_income,
                'capital_gains_taxable': tax_summary.capital_gains.taxable_gain if tax_summary.capital_gains else 0.0,
                'dividend_income_taxable': tax_summary.dividend_income.taxable_dividend_income if tax_summary.dividend_income else 0.0,
                'currency_gains_taxable': max(0, tax_summary.currency_gains.net_gain_loss) if tax_summary.currency_gains else 0.0,
                'estimated_tax_liability': tax_summary.total_tax_liability
            }
        
        if output_format.lower() == "json":
            return self.generate_json_portfolio_report(portfolio_summary)
        elif output_format.lower() == "html":
            return self.generate_html_portfolio_report(portfolio_summary)
        else:
            return portfolio_report
```

### Implementation Details

1. **Generate market-grouped portfolio reports**
   - Match the exact format from the desired output image
   - Include all performance metrics
   - Support market grouping and totals

2. **Support multiple output formats (JSON, CSV, HTML)**
   - CSV for spreadsheet analysis
   - JSON for API responses
   - HTML for web display

3. **Include all performance metrics**
   - Capital gains %, dividends %, currency %, total return %
   - Market-level aggregations
   - Portfolio-level totals

4. **Match the desired output format from the image**
   - Market headers (EURONEXT, LSE, NASDAQ, NYSE)
   - Security details with performance metrics
   - Market totals and grand total

### Files to Create
- `src/main/python/services/portfolio_report_generator.py` - Main service class

### Test Requirements
- Unit tests for report generation
- Output format validation tests
- Data accuracy verification
- Integration tests with portfolio calculator
- Template rendering tests

### Acceptance Criteria
- [ ] Portfolio reports generated in multiple formats
- [ ] Market grouping matches desired output
- [ ] All performance metrics included correctly
- [ ] CSV, JSON, HTML outputs work properly
- [ ] Report data accuracy verified
- [ ] All tests pass

---

## Task 6.2: Enhanced Web Interface Templates

**File:** `web_app/templates/portfolio_view.html`

**Estimated Time:** 2 days

### Description
Create new web templates to display the portfolio view matching the desired output format.

### New Template

```html
{% extends "base.html" %}

{% block title %}Portfolio Holdings{% endblock %}

{% block extra_css %}
<style>
.market-header {
    background-color: #f8f9fa;
    padding: 10px 15px;
    border-left: 4px solid #007bff;
    margin-bottom: 15px;
    font-weight: bold;
    font-size: 1.1em;
}

.market-section {
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
    background-color: #ffffff;
}

.grand-total-section {
    border-top: 2px solid #007bff;
    padding-top: 15px;
    margin-top: 30px;
    background-color: #f8f9fa;
    border-radius: 5px;
    padding: 20px;
}

.performance-positive {
    color: #28a745;
    font-weight: bold;
}

.performance-negative {
    color: #dc3545;
    font-weight: bold;
}

.performance-neutral {
    color: #6c757d;
}

.table-portfolio {
    font-size: 0.9em;
}

.table-portfolio th {
    background-color: #343a40;
    color: white;
    border: none;
    padding: 12px 8px;
    text-align: center;
}

.table-portfolio td {
    padding: 10px 8px;
    vertical-align: middle;
    border-top: 1px solid #dee2e6;
}

.security-name {
    font-weight: bold;
    color: #007bff;
}

.security-symbol {
    font-size: 0.85em;
    color: #6c757d;
}

.market-total-row {
    background-color: #e9ecef;
    font-weight: bold;
}

.portfolio-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 20px;
    border-radius: 5px 5px 0 0;
}

.action-buttons {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
}
</style>
{% endblock %}

{% block content %}
<div class="card shadow-sm">
    <div class="portfolio-header">
        <h2 class="mb-1">Your investments grouped by market</h2>
        <h5 class="mb-0 opacity-75">As of: {{ portfolio.as_of_date.strftime('%d %B %Y') }}</h5>
    </div>
    
    <div class="card-body">
        {% for market_name, market_data in portfolio.markets.items() %}
        <div class="market-section">
            <div class="market-header">
                {{ market_name }}
                <span class="float-end text-muted">
                    {{ market_data.holdings|length }} holdings • 
                    {{ "%.1f"|format(market_data.totals.weight_in_portfolio) }}% of portfolio
                </span>
            </div>
            
            <div class="table-responsive">
                <table class="table table-portfolio table-hover mb-0">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Security</th>
                            <th>Price</th>
                            <th>QTY</th>
                            <th>Value</th>
                            <th>Capital Gains</th>
                            <th>Dividends</th>
                            <th>Currency</th>
                            <th>Return</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for holding in market_data.holdings %}
                        <tr>
                            <td style="text-align: left;">
                                <div class="security-name">{{ holding.symbol }}</div>
                                <div class="security-symbol">{{ holding.name }}</div>
                            </td>
                            <td class="text-center">{{ "%.2f"|format(holding.price) }}</td>
                            <td class="text-center">{{ "%.0f"|format(holding.quantity) }}</td>
                            <td class="text-end">£{{ "%.2f"|format(holding.value) }}</td>
                            <td class="text-center">
                                <span class="{% if holding.capital_gains_pct < 0 %}performance-negative{% elif holding.capital_gains_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    {{ "%.2f"|format(holding.capital_gains_pct) }}%
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="{% if holding.dividend_yield_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    {{ "%.2f"|format(holding.dividend_yield_pct) }}%
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="{% if holding.currency_effect_pct < 0 %}performance-negative{% elif holding.currency_effect_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    {{ "%.2f"|format(holding.currency_effect_pct) }}%
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="{% if holding.total_return_pct < 0 %}performance-negative{% elif holding.total_return_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    <strong>{{ "%.2f"|format(holding.total_return_pct) }}%</strong>
                                </span>
                            </td>
                        </tr>
                        {% endfor %}
                        
                        <!-- Market Total Row -->
                        <tr class="market-total-row">
                            <td style="text-align: left;"><strong>Total ({{ market_name }})</strong></td>
                            <td></td>
                            <td></td>
                            <td class="text-end"><strong>£{{ "%.2f"|format(market_data.totals.total_value) }}</strong></td>
                            <td class="text-center">
                                <span class="{% if market_data.totals.total_return_pct < 0 %}performance-negative{% elif market_data.totals.total_return_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    <strong>{{ "%.2f"|format(market_data.totals.total_return_pct) }}%</strong>
                                </span>
                            </td>
                            <td></td>
                            <td></td>
                            <td class="text-center">
                                <span class="{% if market_data.totals.total_return_pct < 0 %}performance-negative{% elif market_data.totals.total_return_pct > 0 %}performance-positive{% else %}performance-neutral{% endif %}">
                                    <strong>{{ "%.2f"|format(market_data.totals.total_return_pct) }}%</strong>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        {% endfor %}
        
        <!-- Grand Total Section -->
        <div class="grand-total-section">
            <div class="table-responsive">
                <table class="table table-dark table-portfolio mb-0">
                    <tbody>
                        <tr>
                            <td style="text-align: left;"><strong>Grand Total since 10 May 2024 (GBP)</strong></td>
                            <td></td>
                            <td></td>
                            <td class="text-end"><strong>£{{ "%.2f"|format(portfolio.grand_total.total_value) }}</strong></td>
                            <td class="text-center">
                                <span class="{% if portfolio.grand_total.total_return_pct < 0 %}text-danger{% elif portfolio.grand_total.total_return_pct > 0 %}text-success{% else %}text-muted{% endif %}">
                                    <strong>{{ "%.2f"|format(portfolio.grand_total.total_return_pct) }}%</strong>
                                </span>
                            </td>
                            <td></td>
                            <td></td>
                            <td class="text-center">
                                <span class="{% if portfolio.grand_total.total_return_pct < 0 %}text-danger{% elif portfolio.grand_total.total_return_pct > 0 %}text-success{% else %}text-muted{% endif %}">
                                    <strong>{{ "%.2f"|format(portfolio.grand_total.total_return_pct) }}%</strong>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
            <div class="row">
                <div class="col-md-8">
                    <a href="{{ url_for('portfolio.download_csv') }}" class="btn btn-primary me-2">
                        <i class="bi bi-download"></i> Download Portfolio CSV
                    </a>
                    <a href="{{ url_for('portfolio.download_json') }}" class="btn btn-outline-primary me-2">
                        <i class="bi bi-filetype-json"></i> Download JSON
                    </a>
                    <a href="{{ url_for('main.index') }}" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-repeat"></i> Upload New Data
                    </a>
                </div>
                <div class="col-md-4 text-end">
                    <small class="text-muted">
                        {{ portfolio.grand_total.number_of_holdings }} total holdings across {{ portfolio.markets|length }} markets
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Portfolio Summary Modal -->
<div class="modal fade" id="portfolioSummaryModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Portfolio Summary</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Market Allocation</h6>
                        <canvas id="marketAllocationChart" width="300" height="200"></canvas>
                    </div>
                    <div class="col-md-6">
                        <h6>Performance Breakdown</h6>
                        <canvas id="performanceChart" width="300" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_js %}
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Portfolio analytics charts (optional enhancement)
document.addEventListener('DOMContentLoaded', function() {
    // Market allocation pie chart
    const marketData = {
        labels: [{% for market_name in portfolio.markets.keys() %}'{{ market_name }}'{% if not loop.last %},{% endif %}{% endfor %}],
        datasets: [{
            data: [{% for market_data in portfolio.markets.values() %}{{ market_data.totals.weight_in_portfolio }}{% if not loop.last %},{% endif %}{% endfor %}],
            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1']
        }]
    };
    
    // Performance metrics would be added here
});
</script>
{% endblock %}
```

### Implementation Details

1. **Create portfolio view template matching the desired format**
   - Exact layout matching the provided image
   - Market grouping with headers
   - Performance metrics with color coding
   - Responsive design for mobile devices

2. **Include market grouping with collapsible sections**
   - Clear market headers
   - Holdings grouped by exchange
   - Market-level totals

3. **Display all performance metrics with proper formatting**
   - Capital gains %, dividends %, currency %, total return %
   - Color coding for positive/negative performance
   - Proper number formatting

4. **Add responsive design for mobile devices**
   - Table scrolling on small screens
   - Responsive layout
   - Mobile-friendly buttons

### Files to Create
- `web_app/templates/portfolio_view.html` - Main portfolio template
- `web_app/templates/portfolio_summary.html` - Summary component template

### Test Requirements
- Template rendering tests
- Responsive design verification
- Data display accuracy tests
- Cross-browser compatibility tests
- Performance with large portfolios

### Acceptance Criteria
- [ ] Portfolio template matches desired output format
- [ ] Market grouping displays correctly
- [ ] Performance metrics formatted properly
- [ ] Responsive design works on all devices
- [ ] Color coding for performance works
- [ ] All template tests pass

---

## Task 6.3: Enhanced Web Routes for Portfolio View

**File:** `web_app/routes/portfolio.py`

**Estimated Time:** 2 days

### Description
Create new web routes to handle portfolio view requests and downloads.

### New Routes File

```python
from flask import Blueprint, render_template, request, jsonify, send_file, current_app
from datetime import datetime
import tempfile
import os
from ..services.portfolio_calculator import PortfolioCalculator
from ..services.performance_calculator import PerformanceCalculator
from ..services.portfolio_report_generator import PortfolioReportGenerator
from ..services.storage_service import get_session_data

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/portfolio')

@portfolio_bp.route('/view')
def view_portfolio():
    """Display portfolio holdings view."""
    try:
        # Get session data (transactions, etc.)
        session_data = get_session_data()
        
        if not session_data or 'transactions' not in session_data:
            flash('No transaction data found. Please upload a file first.', 'warning')
            return redirect(url_for('main.index'))
        
        # Calculate portfolio holdings
        portfolio_calc = PortfolioCalculator()
        performance_calc = PerformanceCalculator()
        
        holdings = portfolio_calc.calculate_current_holdings(
            session_data['transactions']
        )
        
        if not holdings:
            flash('No current holdings found in your transaction data.', 'info')
            return redirect(url_for('main.index'))
        
        # Calculate performance metrics
        dividends = session_data.get('dividends', [])
        for holding in holdings:
            performance_calc.calculate_holding_performance(
                holding, 
                session_data['transactions'],
                dividends
            )
        
        # Group by market
        market_holdings = portfolio_calc.group_holdings_by_market(holdings)
        market_summaries = portfolio_calc.calculate_market_totals(market_holdings)
        
        # Create portfolio summary
        portfolio_summary = portfolio_calc.calculate_portfolio_totals(market_summaries)
        
        # Generate report data
        report_gen = PortfolioReportGenerator()
        portfolio_report = report_gen.generate_market_grouped_report(portfolio_summary)
        
        return render_template('portfolio_view.html', portfolio=portfolio_report)
        
    except Exception as e:
        current_app.logger.error(f"Error generating portfolio view: {e}")
        flash('Error generating portfolio view. Please try again.', 'error')
        return redirect(url_for('main.index'))

@portfolio_bp.route('/download/csv')
def download_csv():
    """Download portfolio as CSV file."""
    try:
        # Get portfolio data
        portfolio_summary = _get_portfolio_summary()
        
        if not portfolio_summary:
            flash('No portfolio data available for download.', 'warning')
            return redirect(url_for('portfolio.view_portfolio'))
        
        # Generate CSV
        report_gen = PortfolioReportGenerator()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as tmp_file:
            csv_path = tmp_file.name
        
        report_gen.generate_csv_portfolio_report(portfolio_summary, csv_path)
        
        # Send file
        filename = f"portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
