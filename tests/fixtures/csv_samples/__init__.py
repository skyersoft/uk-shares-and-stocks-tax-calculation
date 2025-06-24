"""
Utility module for working with CSV test samples.

This module provides functions to access CSV samples for testing the CSV parser.
"""
import os
import csv
from typing import List, Dict, Any

# Constants for commonly used samples
BASIC_TRANSACTIONS = "basic_transactions.csv"
BUY_TRANSACTIONS = "buy_transactions.csv"
SELL_TRANSACTIONS = "sell_transactions.csv"
MIXED_TRANSACTIONS = "mixed_transactions.csv"
CURRENCY_TRANSACTIONS = "currency_transactions.csv"

def get_sample_path(filename: str) -> str:
    """
    Get the absolute path to a sample file.
    
    Args:
        filename: Name of the sample file
        
    Returns:
        Absolute path to the sample file
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, filename)

def load_sample_content(filename: str) -> str:
    """
    Load the content of a sample file as a string.
    
    Args:
        filename: Name of the sample file
        
    Returns:
        Content of the sample file as a string
    """
    with open(get_sample_path(filename), 'r') as file:
        return file.read()

def load_sample_as_dicts(filename: str) -> List[Dict[str, Any]]:
    """
    Load the content of a CSV sample file as a list of dictionaries.
    
    Args:
        filename: Name of the sample file
        
    Returns:
        List of dictionaries, where each dictionary represents a row in the CSV
    """
    rows = []
    with open(get_sample_path(filename), 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            rows.append(row)
    return rows

def list_available_samples() -> List[str]:
    """
    List all available CSV sample files.
    
    Returns:
        List of sample filenames
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return [f for f in os.listdir(current_dir) if f.endswith('.csv')]

def get_sample_info() -> Dict[str, str]:
    """
    Get descriptions of available CSV samples.
    
    Returns:
        Dictionary mapping sample filenames to descriptions
    """
    return {
        BASIC_TRANSACTIONS: "Sample with various transaction types including buys, sells, and currency exchanges",
        BUY_TRANSACTIONS: "Sample containing only buy transactions for different securities",
        SELL_TRANSACTIONS: "Sample containing only sell transactions for different securities",
        MIXED_TRANSACTIONS: "Sample with a mix of buy and sell transactions for the same securities",
        CURRENCY_TRANSACTIONS: "Sample containing only currency exchange transactions (EUR.GBP, GBP.USD)"
    }
