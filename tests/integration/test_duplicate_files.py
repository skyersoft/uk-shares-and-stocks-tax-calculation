#!/usr/bin/env python3
"""
Test script to simulate duplicate form fields issue
"""

import requests
import os

def test_duplicate_files():
    """Test what happens when we send duplicate 'file' fields"""
    test_file = "data/U14657426_20240408_20250404.qfx" 
    url = "https://cgttaxtool.uk/prod/calculate"
    
    print("=== TESTING DUPLICATE FILE FIELDS ===")
    
    # Test 1: Normal single file upload
    print("\n--- Test 1: Single file upload ---")
    with open(test_file, 'rb') as f:
        files = {'file': f}
        data = {'tax_year': '2024-2025'}
        response = requests.post(url, files=files, data=data)
        
    if response.status_code == 200:
        result = response.json()
        portfolio = result.get('portfolio_analysis', {})
        markets = portfolio.get('market_summaries', {})
        total_holdings = sum(len(market.get('holdings', [])) for market in markets.values())
        print(f"Single file upload: {total_holdings} holdings")
    else:
        print(f"Single file upload failed: {response.status_code}")
    
    # Test 2: Duplicate file fields (simulating the JavaScript bug)
    print("\n--- Test 2: Duplicate file fields ---")
    with open(test_file, 'rb') as f1, open(test_file, 'rb') as f2:
        # This simulates having both the HTML form file input AND the JavaScript append
        files = [
            ('file', f1),    # From HTML form input
            ('file', f2),    # From JavaScript formData.append()
        ]
        data = {'tax_year': '2024-2025'}
        
        # Use requests with multiple files having same name
        response = requests.post(url, files=files, data=data)
        
    if response.status_code == 200:
        result = response.json()
        portfolio = result.get('portfolio_analysis', {})
        markets = portfolio.get('market_summaries', {})
        total_holdings = sum(len(market.get('holdings', [])) for market in markets.values())
        print(f"Duplicate file upload: {total_holdings} holdings")
        
        # Save response for comparison
        with open('duplicate_file_response.json', 'w') as f:
            import json
            json.dump(result, f, indent=2)
        print("Response saved to duplicate_file_response.json")
    else:
        print(f"Duplicate file upload failed: {response.status_code}")

if __name__ == "__main__":
    os.chdir('/Users/myuser/development/ibkr-tax-calculator')
    test_duplicate_files()