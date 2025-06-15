"""Example usage of OFX sample files in tests.

This file demonstrates how to use the extracted OFX samples in test cases.
"""

import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from tests.fixtures.ofx_samples import (  # noqa: E402
    get_sample_path,
    load_sample_content,
    list_available_samples,
    BASIC_BUY,
    MALFORMED_XML,
    EMPTY_FILE
)


def test_using_sample_files():
    """Example test showing how to use OFX sample files."""
    # Get path to a sample file
    sample_path = get_sample_path(BASIC_BUY)
    assert sample_path.endswith('basic_buy_transaction.ofx')
    
    # Load sample content directly
    content = load_sample_content(BASIC_BUY)
    assert '<OFX>' in content
    assert 'BUYSTOCK' in content
    assert 'GB00B16KPT44' in content
    
    # Use in parser tests (example)
    # parser = QfxParser()
    # transactions = parser.parse(sample_path)
    # assert len(transactions) == 1


def test_error_handling_samples():
    """Example test for error handling using sample files."""
    # Test with malformed XML
    malformed_content = load_sample_content(MALFORMED_XML)
    assert '<OFX>' in malformed_content
    assert 'Missing closing tags' in malformed_content
    
    # Test with empty file
    empty_content = load_sample_content(EMPTY_FILE)
    assert empty_content == ''


def test_multiple_transaction_sample():
    """Example test using multiple transaction sample."""
    content = load_sample_content('multiple_transactions')
    assert content.count('<BUYSTOCK>') == 2
    assert 'GB00B16KPT44' in content  # ISIN
    assert 'US0378331005' in content  # CUSIP


def test_list_all_samples():
    """Example test showing how to iterate over all samples."""
    samples = list_available_samples()
    assert len(samples) > 0
    assert 'basic_buy_transaction' in samples
    assert 'sell_transaction' in samples
    
    # Could test all samples in a loop
    for sample_name in samples:
        content = load_sample_content(sample_name)
        # Basic validation that it's OFX content or error case
        if sample_name not in ['empty_file', 'malformed_xml']:
            assert '<OFX>' in content


if __name__ == '__main__':
    # Run example usage
    print("Testing OFX sample loader...")
    test_using_sample_files()
    test_error_handling_samples()
    test_multiple_transaction_sample()
    test_list_all_samples()
    print("All tests passed!")
