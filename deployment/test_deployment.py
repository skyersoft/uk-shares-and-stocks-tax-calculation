#!/usr/bin/env python3
"""Test script to verify Lambda deployment works correctly."""

import json
import sys
import os

# Add the source directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'python'))
sys.path.insert(0, os.path.dirname(__file__))

# Import the Lambda handler
from lambda_handler import lambda_handler

def test_landing_page():
    """Test the landing page endpoint."""
    event = {
        'httpMethod': 'GET',
        'path': '/',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'text/html' in response['headers']['Content-Type']
        assert 'IBKR Tax Calculator' in response['body']
        print("✅ Landing page test passed")
        return True
    except Exception as e:
        print(f"❌ Landing page test failed: {e}")
        return False

def test_about_page():
    """Test the about page endpoint."""
    event = {
        'httpMethod': 'GET',
        'path': '/about',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'text/html' in response['headers']['Content-Type']
        assert 'About IBKR Tax Calculator' in response['body']
        print("✅ About page test passed")
        return True
    except Exception as e:
        print(f"❌ About page test failed: {e}")
        return False

def test_privacy_page():
    """Test the privacy page endpoint."""
    event = {
        'httpMethod': 'GET',
        'path': '/privacy',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'text/html' in response['headers']['Content-Type']
        assert 'Privacy Policy' in response['body']
        print("✅ Privacy page test passed")
        return True
    except Exception as e:
        print(f"❌ Privacy page test failed: {e}")
        return False

def test_terms_page():
    """Test the terms page endpoint."""
    event = {
        'httpMethod': 'GET',
        'path': '/terms',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'text/html' in response['headers']['Content-Type']
        assert 'Terms of Service' in response['body']
        print("✅ Terms page test passed")
        return True
    except Exception as e:
        print(f"❌ Terms page test failed: {e}")
        return False

def test_cors_options():
    """Test CORS preflight request."""
    event = {
        'httpMethod': 'OPTIONS',
        'path': '/',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'Access-Control-Allow-Origin' in response['headers']
        assert response['headers']['Access-Control-Allow-Origin'] == '*'
        print("✅ CORS test passed")
        return True
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

def test_404_handling():
    """Test 404 error handling."""
    event = {
        'httpMethod': 'GET',
        'path': '/nonexistent',
        'headers': {},
        'queryStringParameters': None,
        'body': None
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 404
        print("✅ 404 handling test passed")
        return True
    except Exception as e:
        print(f"❌ 404 handling test failed: {e}")
        return False

def test_direct_invocation():
    """Test direct Lambda invocation (non-HTTP)."""
    event = {
        'file_content': 'Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized\n2024-01-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,BUY,100,150.00,10.00,0.00,150.00,0.75,0.00,0.00',
        'tax_year': '2024-2025',
        'analysis_type': 'both'
    }
    
    context = {}
    
    try:
        response = lambda_handler(event, context)
        assert response['statusCode'] == 200
        assert 'results' in response['body']
        print("✅ Direct invocation test passed")
        return True
    except Exception as e:
        print(f"❌ Direct invocation test failed: {e}")
        return False

def run_all_tests():
    """Run all tests and report results."""
    print("🧪 Running Lambda deployment tests...\n")
    
    tests = [
        test_landing_page,
        test_about_page,
        test_privacy_page,
        test_terms_page,
        test_cors_options,
        test_404_handling,
        test_direct_invocation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()  # Empty line between tests
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your deployment is ready.")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
