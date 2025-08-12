#!/usr/bin/env python3
"""Test multipart form submission to the Lambda function."""

import requests
import tempfile
import os

# Test data - sample CSV content
SAMPLE_CSV_CONTENT = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
2024-01-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,BUY,100,150.00,10.00,0.00,150.00,0.75,0.00,0.00
2024-02-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,SELL,50,160.00,5.00,0.00,160.00,0.75,500.00,500.00
2024-03-15,MSFT,Microsoft Corp,STK,COMMON,NASDAQ,NASDAQ,BUY,50,300.00,7.50,0.00,300.00,0.75,0.00,0.00"""

def test_multipart_submission():
    """Test multipart form submission."""
    
    # Create a temporary CSV file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
        temp_file.write(SAMPLE_CSV_CONTENT)
        csv_file_path = temp_file.name
    
    try:
        print("🧪 Testing multipart form submission...")
        
        # Prepare the multipart form data
        with open(csv_file_path, 'rb') as f:
            files = {
                'file': ('test.csv', f, 'text/csv')
            }
            data = {
                'tax_year': '2024-2025',
                'analysis_type': 'both'
            }
            
            # Submit to the Lambda function
            url = "https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/calculate"
            print(f"📡 Submitting to: {url}")
            
            response = requests.post(url, files=files, data=data, timeout=30)
            
            print(f"📊 Response status: {response.status_code}")
            print(f"📋 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                content = response.text
                if "Tax Calculation Results" in content:
                    print("✅ SUCCESS: Got results page!")
                    print(f"📄 Response length: {len(content)} characters")
                elif "Error" in content or "error" in content:
                    print("❌ ERROR: Got error response")
                    print(f"📄 Error content: {content[:500]}...")
                else:
                    print("⚠️ UNEXPECTED: Got unexpected response")
                    print(f"📄 Content preview: {content[:200]}...")
            else:
                print(f"❌ HTTP ERROR: {response.status_code}")
                print(f"📄 Error content: {response.text[:500]}...")
                
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        
    finally:
        # Clean up
        os.unlink(csv_file_path)

if __name__ == "__main__":
    test_multipart_submission()
