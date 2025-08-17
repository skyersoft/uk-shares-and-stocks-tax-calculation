#!/usr/bin/env python3
"""
Specific test for table implementation in results.html
Focus on disposal and portfolio tables as requested
"""

import json
import time
from playwright.sync_api import sync_playwright

def test_tables_with_mock_data():
    """Test specifically the disposal and portfolio tables with mock data"""
    
    mock_data = {
        "tax_year": "2024-2025",
        "tax_report": {
            "capital_gains": {
                "total_gains": 15000.50,
                "total_losses": 2500.75,
                "total_gain": 12499.75,
                "annual_exemption_used": 6000.00,
                "taxable_gain": 6499.75
            },
            "dividend_income": {
                "total_gross": 3500.25,
                "total_net": 3150.22,
                "dividend_allowance_used": 1000.00,
                "taxable_dividend_income": 2500.25,
                "withholding_tax": 350.03
            },
            "summary": {
                "estimated_tax_liability": {
                    "capital_gains_tax": 649.98,
                    "dividend_tax": 218.77,
                    "total_estimated_tax": 868.75
                }
            }
        },
        "portfolio_report": {
            "grand_total": {
                "total_value": 125000.50,
                "total_cost": 110000.25,
                "total_unrealized_gain_loss": 15000.25,
                "total_return_pct": 13.64,
                "number_of_holdings": 15
            },
            "market_summaries": {
                "NASDAQ": {
                    "number_of_holdings": 8,
                    "total_value": 75000.30,
                    "total_cost": 68000.15,
                    "total_unrealized_gain_loss": 7000.15,
                    "weight_in_portfolio": 60.0
                },
                "LSE": {
                    "number_of_holdings": 5,
                    "total_value": 35000.20,
                    "total_cost": 30000.10,
                    "total_unrealized_gain_loss": 5000.10,
                    "weight_in_portfolio": 28.0
                }
            }
        },
        "disposals": [
            {
                "disposal_date": "2024-11-15",
                "symbol": "AAPL",
                "description": "Apple Inc.",
                "quantity": 50,
                "proceeds": 8750.00,
                "cost_basis": 7500.00
            },
            {
                "disposal_date": "2024-10-20",
                "symbol": "TSLA", 
                "description": "Tesla Inc.",
                "quantity": 25,
                "proceeds": 6250.50,
                "cost_basis": 7000.75
            }
        ],
        "dividends": [
            {
                "payment_date": "2024-12-01",
                "symbol": "AAPL",
                "description": "Apple Inc.",
                "amount_gbp": 125.50,
                "withholding_tax_gbp": 18.83
            },
            {
                "payment_date": "2024-11-15",
                "symbol": "MSFT",
                "description": "Microsoft Corporation", 
                "amount_gbp": 89.25,
                "withholding_tax_gbp": 13.39
            }
        ],
        "top_holdings": [
            {
                "symbol": "AAPL",
                "quantity": 150,
                "average_cost": 125.50,
                "current_value": 22500.00,
                "total_cost": 18825.00,
                "unrealized_gain_loss": 3675.00
            },
            {
                "symbol": "MSFT",
                "quantity": 75,
                "average_cost": 280.25,
                "current_value": 22500.00,
                "total_cost": 21018.75,
                "unrealized_gain_loss": 1481.25
            }
        ],
        "commission_summary": {
            "total_commissions": 125.50,
            "total_fees": 89.25,
            "total_costs": 214.75
        }
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for debugging
        page = browser.new_page()
        
        # Load the results page
        page.goto('file:///Users/myuser/development/ibkr-tax-calculator/static/results.html')
        
        # Inject mock data
        page.evaluate(f"""
            sessionStorage.setItem('calculationResults', JSON.stringify({json.dumps(mock_data)}));
        """)
        
        # Reload to trigger data loading
        page.reload()
        
        # Wait for content to load
        page.wait_for_selector('#resultsContent', state='visible', timeout=10000)
        
        print("🔍 Checking disposal table...")
        
        # Check if disposal table exists and has data
        disposal_heading = page.locator('h5:has-text("Recent Disposals")')
        if disposal_heading.count() > 0:
            print("✅ Found 'Recent Disposals' heading")
            
            # Check table structure
            disposal_table = page.locator('h5:has-text("Recent Disposals")').locator('..').locator('table')
            if disposal_table.count() > 0:
                print("✅ Found disposal table")
                
                # Check headers
                headers = disposal_table.locator('thead th')
                header_count = headers.count()
                print(f"📊 Table has {header_count} headers")
                
                for i in range(header_count):
                    header_text = headers.nth(i).inner_text()
                    print(f"  Header {i+1}: {header_text}")
                
                # Check data rows
                rows = disposal_table.locator('tbody tr')
                row_count = rows.count()
                print(f"📊 Table has {row_count} data rows")
                
                for i in range(min(row_count, 2)):  # Check first 2 rows
                    row = rows.nth(i)
                    cells = row.locator('td')
                    cell_count = cells.count()
                    print(f"  Row {i+1} has {cell_count} cells:")
                    for j in range(cell_count):
                        cell_text = cells.nth(j).inner_text()
                        print(f"    Cell {j+1}: {cell_text}")
            else:
                print("❌ Disposal table not found")
        else:
            print("❌ 'Recent Disposals' heading not found")
        
        print("\n🔍 Checking dividend table...")
        
        # Check dividend table
        dividend_heading = page.locator('h5:has-text("Recent Dividends")')
        if dividend_heading.count() > 0:
            print("✅ Found 'Recent Dividends' heading")
            
            dividend_table = page.locator('h5:has-text("Recent Dividends")').locator('..').locator('table')
            if dividend_table.count() > 0:
                print("✅ Found dividend table")
                
                # Check headers
                headers = dividend_table.locator('thead th')
                header_count = headers.count()
                print(f"📊 Table has {header_count} headers")
                
                for i in range(header_count):
                    header_text = headers.nth(i).inner_text()
                    print(f"  Header {i+1}: {header_text}")
                
                # Check data rows
                rows = dividend_table.locator('tbody tr')
                row_count = rows.count()
                print(f"📊 Table has {row_count} data rows")
            else:
                print("❌ Dividend table not found")
        else:
            print("❌ 'Recent Dividends' heading not found")
        
        print("\n🔍 Checking portfolio tables...")
        
        # Check market holdings table
        market_heading = page.locator('h5:has-text("Holdings by Market")')
        if market_heading.count() > 0:
            print("✅ Found 'Holdings by Market' heading")
            
            market_table = page.locator('h5:has-text("Holdings by Market")').locator('..').locator('table')
            if market_table.count() > 0:
                print("✅ Found market holdings table")
                
                rows = market_table.locator('tbody tr')
                row_count = rows.count()
                print(f"📊 Market table has {row_count} data rows")
            else:
                print("❌ Market holdings table not found")
        else:
            print("❌ 'Holdings by Market' heading not found")
        
        # Check top holdings table
        holdings_heading = page.locator('h5:has-text("Top Holdings")')
        if holdings_heading.count() > 0:
            print("✅ Found 'Top Holdings' heading")
            
            holdings_table = page.locator('h5:has-text("Top Holdings")').locator('..').locator('table')
            if holdings_table.count() > 0:
                print("✅ Found top holdings table")
                
                rows = holdings_table.locator('tbody tr')
                row_count = rows.count()
                print(f"📊 Top holdings table has {row_count} data rows")
            else:
                print("❌ Top holdings table not found")
        else:
            print("❌ 'Top Holdings' heading not found")
        
        # Take screenshot
        page.screenshot(path='tables_test_screenshot.png', full_page=True)
        print("\n📸 Screenshot saved as 'tables_test_screenshot.png'")
        
        # Keep browser open for manual inspection
        input("\nPress Enter to close browser...")
        
        browser.close()

if __name__ == "__main__":
    print("🧪 Testing Table Implementation in Results Page")
    print("=" * 50)
    test_tables_with_mock_data()
    print("=" * 50)
    print("✅ Test completed!")
