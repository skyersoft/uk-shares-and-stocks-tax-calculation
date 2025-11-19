#!/usr/bin/env python
"""Debug CSV parsing issue."""
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.abspath(os.path.dirname(__file__)), 'src', 'main', 'python'))

import logging
import traceback

logging.basicConfig(level=logging.DEBUG)

try:
    from src.main.python.parsers.csv_parser import CsvParser
    from src.main.python.models.domain_models import Currency
    
    # Test creating a Currency with "NYSE" - this should fail
    print("Testing Currency creation with 'NYSE'...")
    try:
        bad_currency = Currency(code="NYSE", rate_to_base=1.0)
        print(f"ERROR: Should have failed but created: {bad_currency}")
    except Exception as e:
        print(f"Expected error: {type(e).__name__}: {e}")
    
    print("\n" + "="*80)
    print("Parsing CSV file...")
    print("="*80 + "\n")
    
    parser = CsvParser()
    transactions = parser.parse_file('data/Sharesight.csv')
    
    print(f"Successfully parsed {len(transactions)} transactions")
    
    # Show first few transactions
    for i, t in enumerate(transactions[:5]):
        print(f"\nTransaction {i+1}:")
        print(f"  Symbol: {t.security.symbol}")
        print(f"  Date: {t.date}")
        print(f"  Type: {t.transaction_type}")
        print(f"  Currency: {t.currency.code} (rate: {t.currency.rate_to_base})")
        
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
