#!/usr/bin/env python
"""
Script to run tests and verify the web application fix.
"""
import os
import sys
import importlib.util

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Test import of the calculator class
def test_calculator_import():
    print("Testing import of CapitalGainsTaxCalculator...")
    try:
        from src.main.python.calculator import CapitalGainsTaxCalculator
        print("✅ Successfully imported CapitalGainsTaxCalculator")
        return True
    except Exception as e:
        print(f"❌ Failed to import CapitalGainsTaxCalculator: {e}")
        return False

# Test import of the web app
def test_webapp_import():
    print("Testing import of web application...")
    try:
        from web_app.app import app
        print("✅ Successfully imported web application")
        return True
    except Exception as e:
        print(f"❌ Failed to import web application: {e}")
        return False

# Test initialization of calculator
def test_calculator_init():
    print("Testing initialization of CapitalGainsTaxCalculator...")
    try:
        from src.main.python.calculator import CapitalGainsTaxCalculator
        calculator = CapitalGainsTaxCalculator()
        print("✅ Successfully initialized CapitalGainsTaxCalculator")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize CapitalGainsTaxCalculator: {e}")
        return False

if __name__ == "__main__":
    print("Running tests to verify fix...")
    
    tests_passed = 0
    total_tests = 3
    
    if test_calculator_import():
        tests_passed += 1
        
    if test_webapp_import():
        tests_passed += 1
        
    if test_calculator_init():
        tests_passed += 1
    
    print(f"\nTests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✅ All tests passed! The fix is working correctly.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. The fix may not be complete.")
        sys.exit(1)
