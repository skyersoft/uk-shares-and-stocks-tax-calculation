#!/usr/bin/env python3
"""
Test script to compare browser vs curl API requests
"""

import os
import hashlib
import json
import requests
import pytest

def get_file_hash(filepath):
    """Get MD5 hash of file"""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

@pytest.mark.integration  
@pytest.mark.skipif(os.getenv('SKIP_LIVE_API_TESTS'), reason="Skipping live API tests")
def test_api_direct_request():
    """Test API with requests library (similar to curl)"""
    test_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "U14657426_20240408_20250404.qfx")
    url = "https://cgttaxtool.uk/prod/calculate"
    
    if not os.path.exists(test_file):
        pytest.skip(f"Test file not found: {test_file}")
        
    print("=== REQUESTS LIBRARY TEST ===")
    print(f"File: {test_file}")
    print(f"File size: {os.path.getsize(test_file)} bytes")
    print(f"File hash: {get_file_hash(test_file)}")
    
    print("=== REQUESTS LIBRARY TEST ===")
    print(f"File: {test_file}")
    print(f"File size: {os.path.getsize(test_file)} bytes")
    print(f"File hash: {get_file_hash(test_file)}")
    
    # Make request
    with open(test_file, 'rb') as f:
        files = {'file': f}
        data = {'tax_year': '2024-2025'}
        
        response = requests.post(url, files=files, data=data)
        
    print(f"Response status: {response.status_code}")
    print(f"Response size: {len(response.content)} bytes")
    
    if response.status_code == 200:
        result = response.json()
        
        # Analyze portfolio
        portfolio = result.get('portfolio_analysis', {})
        markets = portfolio.get('market_summaries', {})
        
        total_holdings = 0
        for market_key, market_data in markets.items():
            holdings = market_data.get('holdings', [])
            total_holdings += len(holdings)
            print(f"Market {market_key}: {len(holdings)} holdings")
            
            for i, holding in enumerate(holdings[:3]):
                security = holding.get('security', {})
                symbol = security.get('symbol', 'N/A')
                quantity = holding.get('quantity', 0)
                print(f"  {i}: {symbol} qty={quantity}")
                
        print(f"Total holdings: {total_holdings}")
        
        # Save response
        with open('requests_api_response.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("Response saved to requests_api_response.json")
        
    else:
        print(f"Error: {response.text}")

# Remove the main execution block since this is now a pytest function