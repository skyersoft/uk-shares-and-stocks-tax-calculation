#!/usr/bin/env python3
"""
Simple test script for the IBKR Tax Calculator API.
Tests the API endpoints with a sample file.
"""
import requests
import json
import os

# Configuration
API_BASE_URL = "http://localhost:5001"
TEST_FILE_PATH = "data/U14657426_20240408_20250404.qfx"

def test_health_endpoint():
    """Test the health endpoint."""
    print("🔍 Testing health endpoint...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
        return False

def test_calculate_endpoint():
    """Test the calculate endpoint with a sample file."""
    print("\n🧮 Testing calculate endpoint...")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        return False
    
    try:
        # Read the test file
        with open(TEST_FILE_PATH, 'r', encoding='utf-8') as f:
            file_content = f.read()
        
        # Prepare multipart form data
        files = {
            'file': ('test.qfx', file_content, 'application/x-ofx')
        }
        data = {
            'tax_year': '2024-2025',
            'analysis_type': 'both'
        }
        
        print(f"📤 Uploading file: {TEST_FILE_PATH}")
        print(f"📊 Tax year: {data['tax_year']}")
        print(f"🔍 Analysis type: {data['analysis_type']}")
        
        response = requests.post(f"{API_BASE_URL}/calculate", files=files, data=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Calculation successful!")
            print(f"Response keys: {list(result.keys())}")
            
            # Print some basic results if available
            if 'capital_gains_summary' in result:
                cg = result['capital_gains_summary']
                print(f"💰 Total Gains: £{cg.get('total_gains', 'N/A')}")
                print(f"💸 Total Losses: £{cg.get('total_losses', 'N/A')}")
                print(f"🧾 Net Gains: £{cg.get('net_gains', 'N/A')}")
            
            return True
        else:
            print(f"❌ Calculation failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Calculate endpoint failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 IBKR Tax Calculator API Test Suite")
    print("=" * 50)
    
    # Test health endpoint
    health_ok = test_health_endpoint()
    
    # Test calculate endpoint
    calc_ok = test_calculate_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Health Endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Calculate Endpoint: {'✅ PASS' if calc_ok else '❌ FAIL'}")
    
    if health_ok and calc_ok:
        print("\n🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Check the API server.")
        return 1

if __name__ == "__main__":
    exit(main())
