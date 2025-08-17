#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import json
import os

# Mock data that should create 4 distinct tables
mock_data = {
    "tax_year": "2024",
    "disposals": [
        {"disposal_date": "2024-01-15", "symbol": "AAPL", "quantity": 50, "proceeds": 8500, "cost": 7000, "gain_loss": 1500},
        {"disposal_date": "2024-02-20", "symbol": "MSFT", "quantity": 30, "proceeds": 9000, "cost": 8200, "gain_loss": 800},
        {"disposal_date": "2024-03-10", "symbol": "GOOGL", "quantity": 20, "proceeds": 12000, "cost": 11000, "gain_loss": 1000}
    ],
    "dividends": [
        {"payment_date": "2024-01-15", "symbol": "AAPL", "dividend_amount": 150, "tax_withheld": 15},
        {"payment_date": "2024-02-15", "symbol": "MSFT", "dividend_amount": 200, "tax_withheld": 20}
    ],
    "processing_summary": {
        "tax_analysis": {
            "disposals": [
                {"disposal_date": "2024-01-15", "symbol": "AAPL", "quantity": 50, "proceeds": 8500, "cost": 7000, "gain_loss": 1500},
                {"disposal_date": "2024-02-20", "symbol": "MSFT", "quantity": 30, "proceeds": 9000, "cost": 8200, "gain_loss": 800},
                {"disposal_date": "2024-03-10", "symbol": "GOOGL", "quantity": 20, "proceeds": 12000, "cost": 11000, "gain_loss": 1000}
            ],
            "dividends": [
                {"payment_date": "2024-01-15", "symbol": "AAPL", "dividend_amount": 150, "tax_withheld": 15},
                {"payment_date": "2024-02-15", "symbol": "MSFT", "dividend_amount": 200, "tax_withheld": 20}
            ]
        }
    },
    "top_holdings": [
        {"symbol": "NVDA", "quantity": 100, "average_cost": 250, "current_value": 35000, "unrealized_gain_loss": 10000, "total_cost": 25000},
        {"symbol": "AMD", "quantity": 200, "average_cost": 120, "current_value": 28000, "unrealized_gain_loss": 4000, "total_cost": 24000}
    ],
    "portfolio_report": {
        "market_summaries": {
            "NASDAQ": {
                "number_of_holdings": 5,
                "total_value": 50000,
                "weight_in_portfolio": 60.0,
                "total_cost": 45000,
                "total_unrealized_gain_loss": 5000
            },
            "NYSE": {
                "number_of_holdings": 3,
                "total_value": 33000,
                "weight_in_portfolio": 40.0,
                "total_cost": 30000,
                "total_unrealized_gain_loss": 3000
            }
        }
    }
}

async def test_table_structure():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Load the results page
        file_path = f"file://{os.path.abspath('static/results.html')}"
        await page.goto(file_path)
        
        # Inject mock data
        await page.evaluate(f"""
            sessionStorage.setItem('calculationResults', JSON.stringify({json.dumps(mock_data)}));
        """)
        
        # Call loadResults to load the content
        await page.evaluate("loadResults()")
        
        # Wait for content to load
        await page.wait_for_timeout(1000)
        
        # Check if the content was generated
        tax_content = await page.text_content('#taxAnalysisContent')
        portfolio_content = await page.text_content('#portfolioAnalysisContent')
        
        print(f"Tax content length: {len(tax_content) if tax_content else 0}")
        print(f"Portfolio content length: {len(portfolio_content) if portfolio_content else 0}")
        
        # Print sample of tax content to debug
        if tax_content:
            print(f"Tax content sample: {tax_content[:200]}...")
        
        # Check the innerHTML to see actual tables
        tax_html = await page.inner_html('#taxAnalysisContent')
        print(f"Tax HTML length: {len(tax_html) if tax_html else 0}")
        if tax_html and len(tax_html) > 0:
            print("Found disposal table classes in tax HTML:", "disposal-table" in tax_html)
            print("Found dividend table classes in tax HTML:", "dividend-table" in tax_html)
        
        # Count tables with specific class names
        disposal_tables = await page.locator('table.disposal-table').count()
        dividend_tables = await page.locator('table.dividend-table').count()
        market_tables = await page.locator('table.market-table').count()
        holdings_tables = await page.locator('table.holdings-table').count()
        
        print(f"Disposal tables: {disposal_tables}")
        print(f"Dividend tables: {dividend_tables}")
        print(f"Market tables: {market_tables}")
        print(f"Holdings tables: {holdings_tables}")
        
        # Check table headers
        if disposal_tables > 0:
            disposal_headers = await page.locator('table.disposal-table thead th').count()
            print(f"Disposal table headers: {disposal_headers}")
            
        if dividend_tables > 0:
            dividend_headers = await page.locator('table.dividend-table thead th').count()
            print(f"Dividend table headers: {dividend_headers}")
            
        if market_tables > 0:
            market_headers = await page.locator('table.market-table thead th').count()
            print(f"Market table headers: {market_headers}")
            
        if holdings_tables > 0:
            holdings_headers = await page.locator('table.holdings-table thead th').count()
            print(f"Holdings table headers: {holdings_headers}")
            
        # Check table rows
        if disposal_tables > 0:
            disposal_rows = await page.locator('table.disposal-table tbody tr').count()
            print(f"Disposal table rows: {disposal_rows}")
            
        if dividend_tables > 0:
            dividend_rows = await page.locator('table.dividend-table tbody tr').count()
            print(f"Dividend table rows: {dividend_rows}")
            
        if market_tables > 0:
            market_rows = await page.locator('table.market-table tbody tr').count()
            print(f"Market table rows: {market_rows}")
            
        if holdings_tables > 0:
            holdings_rows = await page.locator('table.holdings-table tbody tr').count()
            print(f"Holdings table rows: {holdings_rows}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_table_structure())
