#!/usr/bin/env python
"""
Runner script for the UK Capital Gains Tax Calculator.

Run with:
    python run_calculator.py --input data/U11075163_20240408_20250404.qfx --tax-year 2024-2025 --output report
"""
import sys
import os
import logging
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="calculator_debug.log",
    filemode="w"
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from src.main.python.capital_gains_calculator import main
    
    if __name__ == "__main__":
        main()
except Exception as e:
    logging.error(f"Error running calculator: {e}")
    traceback.print_exc()
    print(f"ERROR: {e}. Check calculator_debug.log for details.")
