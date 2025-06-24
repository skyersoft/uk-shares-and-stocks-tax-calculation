"""
Tests for CSV sample loading utilities.
"""
import os
import pytest
from tests.fixtures.csv_samples import (
    get_sample_path, 
    load_sample_content, 
    load_sample_as_dicts,
    list_available_samples,
    BASIC_TRANSACTIONS,
    BUY_TRANSACTIONS,
    SELL_TRANSACTIONS,
    MIXED_TRANSACTIONS,
    CURRENCY_TRANSACTIONS
)

def test_sample_path_exists():
    """Test that sample paths are valid and files exist."""
    path = get_sample_path(BASIC_TRANSACTIONS)
    assert os.path.exists(path), f"Sample file {BASIC_TRANSACTIONS} should exist"

def test_load_sample_content():
    """Test loading sample content as string."""
    content = load_sample_content(BASIC_TRANSACTIONS)
    assert content.startswith('ClientAccountID'), "CSV should start with header"
    assert "BUY" in content, "CSV should contain BUY transactions"
    assert "SELL" in content, "CSV should contain SELL transactions"

def test_load_sample_as_dicts():
    """Test loading sample as list of dictionaries."""
    rows = load_sample_as_dicts(BASIC_TRANSACTIONS)
    assert len(rows) > 0, "CSV should have at least one data row"
    
    # Check for expected columns
    first_row = rows[0]
    assert "Symbol" in first_row, "CSV should have Symbol column"
    assert "Buy/Sell" in first_row, "CSV should have Buy/Sell column"
    assert "SecurityIDType" in first_row, "CSV should have SecurityIDType column"
    assert "TradeDate" in first_row, "CSV should have TradeDate column"
    
    # Check transaction types
    buy_transactions = [row for row in rows if row["Buy/Sell"] == "BUY"]
    sell_transactions = [row for row in rows if row["Buy/Sell"] == "SELL"]
    assert len(buy_transactions) > 0, "CSV should have BUY transactions"
    assert len(sell_transactions) > 0, "CSV should have SELL transactions"
    
    # Check currency transactions
    currency_transactions = [row for row in rows if "EUR.GBP" in row["Symbol"] or "GBP.USD" in row["Symbol"]]
    assert len(currency_transactions) > 0, "CSV should have currency exchange transactions"

def test_list_available_samples():
    """Test listing available samples."""
    samples = list_available_samples()
    assert BASIC_TRANSACTIONS in samples, f"{BASIC_TRANSACTIONS} should be in available samples"
    assert BUY_TRANSACTIONS in samples, f"{BUY_TRANSACTIONS} should be in available samples"
    assert SELL_TRANSACTIONS in samples, f"{SELL_TRANSACTIONS} should be in available samples"
    assert MIXED_TRANSACTIONS in samples, f"{MIXED_TRANSACTIONS} should be in available samples"
    assert CURRENCY_TRANSACTIONS in samples, f"{CURRENCY_TRANSACTIONS} should be in available samples"

def test_buy_transactions():
    """Test buy transactions sample."""
    rows = load_sample_as_dicts(BUY_TRANSACTIONS)
    assert len(rows) > 0, "CSV should have at least one data row"
    
    # Check that all transactions are BUY
    for row in rows:
        assert row["Buy/Sell"] == "BUY", "All transactions in buy_transactions.csv should be BUY"

def test_sell_transactions():
    """Test sell transactions sample."""
    rows = load_sample_as_dicts(SELL_TRANSACTIONS)
    assert len(rows) > 0, "CSV should have at least one data row"
    
    # Check that all transactions are SELL
    for row in rows:
        assert row["Buy/Sell"] == "SELL", "All transactions in sell_transactions.csv should be SELL"

def test_mixed_transactions():
    """Test mixed transactions sample."""
    rows = load_sample_as_dicts(MIXED_TRANSACTIONS)
    assert len(rows) > 0, "CSV should have at least one data row"
    
    # Check for both BUY and SELL transactions
    buy_count = sum(1 for row in rows if row["Buy/Sell"] == "BUY")
    sell_count = sum(1 for row in rows if row["Buy/Sell"] == "SELL")
    
    assert buy_count > 0, "mixed_transactions.csv should have BUY transactions"
    assert sell_count > 0, "mixed_transactions.csv should have SELL transactions"

def test_currency_transactions():
    """Test currency transactions sample."""
    rows = load_sample_as_dicts(CURRENCY_TRANSACTIONS)
    assert len(rows) > 0, "CSV should have at least one data row"
    
    # Check that all transactions are currency exchanges
    for row in rows:
        assert "CASH" in row["AssetClass"], f"All transactions in currency_transactions.csv should have AssetClass=CASH, found {row['AssetClass']}"
        assert ".GBP" in row["Symbol"] or ".USD" in row["Symbol"], f"All symbols should be currency pairs, found {row['Symbol']}"
