#!/usr/bin/env python3
"""
Test to verify that disposal details and dividend details are properly displayed
"""

import json
from playwright.sync_api import sync_playwright

def test_detailed_content():
    """Test that detailed disposal and dividend information is displayed"""
    
    # Create comprehensive test data similar to what the API would return
    test_data = {
        "tax_report": {
            "summary": {"estimated_tax_liability": {"total_estimated_tax": 2500.00}},
            "capital_gains": {
                "total_gains": 8000.00,
                "total_losses": 1500.00,
                "total_gain": 6500.00,
                "taxable_gain": 3500.00,
                "annual_exemption_used": 3000.00
            },
            "dividend_income": {
                "total_gross": 1200.00,
                "total_net": 1050.00,
                "dividend_allowance_used": 500.00,
                "taxable_dividend_income": 550.00,
                "withholding_tax": 150.00
            }
        },
        "portfolio_report": {
            "grand_total": {"total_value": 75000, "total_return_pct": 15.2}
        },
        "tax_year": "2024-2025",
        # Add sample disposal data
        "disposals": [
            {
                "disposal_date": "2024-03-15",
                "symbol": "AAPL",
                "quantity": 100,
                "proceeds": 15000.00,
                "cost_basis": 12000.00
            },
            {
                "disposal_date": "2024-02-10",
                "symbol": "GOOGL", 
                "quantity": 50,
                "proceeds": 8500.00,
                "cost_basis": 9200.00
            },
            {
                "disposal_date": "2024-01-20",
                "symbol": "MSFT",
                "quantity": 75,
                "proceeds": 25000.00,
                "cost_basis": 22000.00
            }
        ],
        # Add sample dividend data
        "dividends": [
            {
                "payment_date": "2024-03-01",
                "symbol": "AAPL",
                "amount_gbp": 45.50,
                "withholding_tax_gbp": 6.83
            },
            {
                "payment_date": "2024-02-15", 
                "symbol": "MSFT",
                "amount_gbp": 32.20,
                "withholding_tax_gbp": 4.83
            },
            {
                "payment_date": "2024-01-10",
                "symbol": "GOOGL", 
                "amount_gbp": 0.00,
                "withholding_tax_gbp": 0.00
            }
        ]
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            print("🔄 Loading results page...")
            page.goto("https://cgttaxtool.uk/results.html")
            page.wait_for_load_state('networkidle')
            
            print("🔄 Injecting comprehensive test data...")
            page.evaluate(f"""
                window.resultsData = {json.dumps(test_data)};
                displayResults(window.resultsData);
            """)
            
            # Wait for content to load
            page.wait_for_timeout(2000)
            
            print("🔄 Checking for detailed content...")
            
            # Check for disposal table
            disposal_table = page.query_selector('table:has-text("Recent Disposals")')
            if disposal_table or page.query_selector('h5:has-text("Recent Disposals")'):
                print("✅ Disposal details table found")
                
                # Count disposal rows
                disposal_rows = page.query_selector_all('table:has-text("Date") tbody tr')
                print(f"✅ Found {len(disposal_rows)} disposal rows")
                
                # Check for specific disposal data
                if page.query_selector('td:has-text("AAPL")'):
                    print("✅ AAPL disposal found")
                if page.query_selector('td:has-text("2024-03-15")'):
                    print("✅ Disposal dates found")
                if page.query_selector('td:has-text("£15,000.00")'):
                    print("✅ Disposal proceeds found")
            else:
                print("❌ Disposal details table NOT found")
            
            # Check for dividend table
            dividend_table = page.query_selector('table:has-text("Recent Dividends")')
            if dividend_table or page.query_selector('h5:has-text("Recent Dividends")'):
                print("✅ Dividend details table found")
                
                # Count dividend rows
                dividend_rows = page.query_selector_all('table:has-text("Payment Date") tbody tr')
                print(f"✅ Found {len(dividend_rows)} dividend rows")
                
                # Check for specific dividend data
                if page.query_selector('td:has-text("2024-03-01")'):
                    print("✅ Dividend payment dates found")
                if page.query_selector('td:has-text("£45.50")'):
                    print("✅ Dividend amounts found")
            else:
                print("❌ Dividend details table NOT found")
            
            # Check for tax analysis details
            if page.query_selector('h5:has-text("Capital Gains Summary")'):
                print("✅ Capital Gains Summary found")
            else:
                print("❌ Capital Gains Summary NOT found")
                
            if page.query_selector('h5:has-text("Dividend Income Summary")'):
                print("✅ Dividend Income Summary found")
            else:
                print("❌ Dividend Income Summary NOT found")
                
            if page.query_selector('h5:has-text("Tax Breakdown")'):
                print("✅ Tax Breakdown found")
            else:
                print("❌ Tax Breakdown NOT found")
            
            # Take screenshot
            page.screenshot(path="detailed_content_test.png", full_page=True)
            print("📸 Screenshot saved as detailed_content_test.png")
            
            # Wait for inspection
            input("Press Enter to continue after inspecting the page...")
            
        except Exception as e:
            print(f"❌ Error during test: {e}")
            page.screenshot(path="detailed_content_error.png", full_page=True)
            
        finally:
            browser.close()

if __name__ == "__main__":
    print("🧪 Testing Detailed Content Display")
    print("=" * 50)
    test_detailed_content()
    print("=" * 50)
