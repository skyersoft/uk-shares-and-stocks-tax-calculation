"""OFX sample files for testing.

This module provides utilities to load OFX sample files for testing purposes.
All sample files are located in the same directory as this module.
"""

from pathlib import Path
from typing import Dict, List


# Directory containing the OFX sample files
SAMPLES_DIR = Path(__file__).parent


def get_sample_path(filename: str) -> str:
    """Get the full path to an OFX sample file.
    
    Args:
        filename: Name of the OFX sample file (with or without .ofx extension)
        
    Returns:
        Full path to the sample file
        
    Raises:
        FileNotFoundError: If the sample file doesn't exist
    """
    if not filename.endswith('.ofx'):
        filename += '.ofx'
    
    sample_path = SAMPLES_DIR / filename
    if not sample_path.exists():
        raise FileNotFoundError(f"OFX sample file not found: {filename}")
    
    return str(sample_path)


def load_sample_content(filename: str) -> str:
    """Load the content of an OFX sample file.
    
    Args:
        filename: Name of the OFX sample file (with or without .ofx extension)
        
    Returns:
        Content of the OFX sample file as a string
        
    Raises:
        FileNotFoundError: If the sample file doesn't exist
    """
    sample_path = get_sample_path(filename)
    with open(sample_path, 'r', encoding='utf-8') as f:
        return f.read()


def list_available_samples() -> List[str]:
    """List all available OFX sample files.
    
    Returns:
        List of sample file names (without .ofx extension)
    """
    samples = []
    for file_path in SAMPLES_DIR.glob('*.ofx'):
        samples.append(file_path.stem)
    return sorted(samples)


def get_sample_info() -> Dict[str, str]:
    """Get information about available OFX samples.
    
    Returns:
        Dictionary mapping sample names to their descriptions
    """
    return {
        'basic_buy_transaction': 'Simple buy transaction with ISIN security '
                                 'ID',
        'buy_with_commission': 'Buy transaction with commission and currency '
                               'information',
        'sell_transaction': 'Sell transaction with commission and currency',
        'missing_price': 'Transaction with zero unit price (tests price '
                         'calculation)',
        'cusip_security': 'Transaction using CUSIP security identifier',
        'multiple_transactions': 'Multiple transactions in single file',
        'mixed_security_types': 'Mix of buy/sell with different security ID '
                                'types',
        'header_only': 'OFX file with only header information',
        'invalid_structure': 'Invalid OFX structure for error testing',
        'malformed_xml': 'Malformed XML for parser error testing',
        'error_recovery': 'Mix of valid and invalid transactions for error '
                          'recovery testing',
        'empty_file': 'Empty file for empty file handling tests',
    }


# Convenience constants for commonly used samples
BASIC_BUY = 'basic_buy_transaction'
BUY_WITH_COMMISSION = 'buy_with_commission'
SELL_TRANSACTION = 'sell_transaction'
MISSING_PRICE = 'missing_price'
CUSIP_SECURITY = 'cusip_security'
MULTIPLE_TRANSACTIONS = 'multiple_transactions'
MIXED_SECURITY_TYPES = 'mixed_security_types'
HEADER_ONLY = 'header_only'
INVALID_STRUCTURE = 'invalid_structure'
MALFORMED_XML = 'malformed_xml'
ERROR_RECOVERY = 'error_recovery'
EMPTY_FILE = 'empty_file'
