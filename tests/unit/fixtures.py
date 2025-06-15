"""Test fixtures for unit tests."""
import pytest
from datetime import datetime
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency
)


@pytest.fixture
def test_security():
    """Create a test security."""
    return Security(isin="GB00B16KPT44", symbol="HSBA")


@pytest.fixture
def test_buy_transaction(test_security):
    """Create a test buy transaction."""
    return Transaction(
        transaction_id="buy1",
        transaction_type=TransactionType.BUY,
        security=test_security,
        date=datetime(2024, 6, 1),  # In the 2024-2025 tax year
        quantity=100.0,
        price_per_unit=5.0,
        commission=10.0,
        taxes=0.0,
        currency=Currency(code="GBP", rate_to_base=1.0)
    )


@pytest.fixture
def test_sell_transaction(test_security):
    """Create a test sell transaction."""
    return Transaction(
        transaction_id="sell1",
        transaction_type=TransactionType.SELL,
        security=test_security,
        date=datetime(2024, 12, 1),  # In the 2024-2025 tax year
        quantity=-100.0,
        price_per_unit=7.0,
        commission=10.0,
        taxes=0.0,
        currency=Currency(code="GBP", rate_to_base=1.0)
    )


@pytest.fixture
def test_transactions(test_buy_transaction, test_sell_transaction):
    """Create a list of test transactions."""
    return [test_buy_transaction, test_sell_transaction]
