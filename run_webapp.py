#!/usr/bin/env python
"""
Development server runner for the UK Capital Gains Tax Calculator web application.

Run with:
    # Ensure conda environment is activated first
    conda activate ibkr-tax
    python run_webapp.py
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="webapp_debug.log",
    filemode="w"
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from web_app.app import app
    
    if __name__ == "__main__":
        # Run the Flask development server
        app.run(debug=True, host='0.0.0.0', port=5001)
except Exception as e:
    logging.error(f"Error running web application: {e}")
    import traceback
    traceback.print_exc()
    print(f"ERROR: {e}. Check webapp_debug.log for details.")
