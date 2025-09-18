#!/usr/bin/env python3
"""
Test the complete workflow after the duplicate file fix
"""

import requests
import json
import os

def test_complete_workflow():
    """Test the complete calculation workflow"""
    test_file = "data/U14657426_20240408_20250404.qfx"
    url = "https://cgttaxtool.uk/prod/calculate"
    
    print("=== TESTING COMPLETE WORKFLOW ===")
    print(f"File: {test_file}")
    print(f"Size: {os.path.getsize(test_file)} bytes")
    
    # Make API call (using single file to ensure we get the correct response)
    with open(test_file, 'rb') as f:
        files = {'file': f}
        data = {'tax_year': '2024-2025'}
        response = requests.post(url, files=files, data=data)
    
    if response.status_code != 200:
        print(f"API call failed: {response.status_code}")
        return
        
    result = response.json()
    print(f"Response size: {len(response.content)} bytes")
    
    # Test portfolio holdings
    portfolio = result.get('portfolio_analysis', {})
    markets = portfolio.get('market_summaries', {})
    total_holdings = 0
    
    print("\n=== PORTFOLIO HOLDINGS ===")
    for market_key, market_data in markets.items():
        holdings = market_data.get('holdings', [])
        total_holdings += len(holdings)
        print(f"Market {market_key}: {len(holdings)} holdings")
        
        for i, holding in enumerate(holdings[:3]):
            security = holding.get('security', {})
            symbol = security.get('symbol', 'EMPTY')
            quantity = holding.get('quantity', 0)
            print(f"  {i}: {symbol} qty={quantity}")
    
    print(f"Total portfolio holdings: {total_holdings}")
    
    # Test disposals
    tax_analysis = result.get('tax_analysis', {})
    capital_gains = tax_analysis.get('capital_gains', {})
    disposals = capital_gains.get('disposals', [])
    
    print(f"\n=== DISPOSALS ===")
    print(f"Total disposals: {len(disposals)}")
    
    for i, disposal in enumerate(disposals[:3]):
        security = disposal.get('security', {})
        symbol = security.get('symbol', 'EMPTY')
        sell_date = disposal.get('sell_date', 'N/A')
        quantity = disposal.get('quantity', 0)
        proceeds = disposal.get('proceeds', 0)
        print(f"  {i}: {symbol} - {quantity} shares on {sell_date[:10]} for £{proceeds:.2f}")
    
    # Test dividends  
    dividend_income = tax_analysis.get('dividend_income', {})
    dividends = dividend_income.get('dividends', [])
    
    print(f"\n=== DIVIDENDS ===")
    print(f"Total dividends: {len(dividends)}")
    
    for i, dividend in enumerate(dividends[:3]):
        security = dividend.get('security', {})
        symbol = security.get('symbol', 'EMPTY')
        payment_date = dividend.get('payment_date', 'N/A')
        amount = dividend.get('amount_gbp', 0)
        print(f"  {i}: {symbol} - £{amount:.4f} on {payment_date[:10]}")
    
    # Summary
    print(f"\n=== SUMMARY ===")
    print(f"✅ Portfolio holdings: {total_holdings} (should be 6)")
    print(f"✅ Disposals: {len(disposals)} (should be 3)")  
    print(f"✅ Dividends: {len(dividends)} (should be 7)")
    
    symbols_have_data = all(
        holding.get('security', {}).get('symbol') 
        for market in markets.values() 
        for holding in market.get('holdings', [])
    )
    print(f"✅ Symbols populated: {symbols_have_data}")
    
    disposal_symbols_have_data = all(
        disposal.get('security', {}).get('symbol')
        for disposal in disposals
    )
    print(f"✅ Disposal symbols populated: {disposal_symbols_have_data}")
    
    # Save for manual inspection
    with open('workflow_test_response.json', 'w') as f:
        json.dump(result, f, indent=2)
    print("\nResponse saved to workflow_test_response.json")
    
    return {
        'holdings': total_holdings,
        'disposals': len(disposals),
        'dividends': len(dividends),
        'symbols_ok': symbols_have_data,
        'disposal_symbols_ok': disposal_symbols_have_data
    }

if __name__ == "__main__":
    os.chdir('/Users/myuser/development/ibkr-tax-calculator')
    test_complete_workflow()