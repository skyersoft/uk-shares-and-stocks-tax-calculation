"""Tests for QFX dividend parsing."""
import pytest
from datetime import datetime
from src.main.python.parsers.qfx_parser import QfxParser
from src.main.python.models.domain_models import TransactionType


def test_parse_dividend_transaction():
    """Test parsing a dividend transaction with withholding tax."""
    parser = QfxParser()
    transactions = parser.parse('tests/fixtures/ofx_samples/dividend_transaction.ofx')
    
    assert len(transactions) == 1
    dividend = transactions[0]
    
    assert dividend.transaction_type == TransactionType.DIVIDEND
    assert dividend.transaction_id == '20240926.U11075163.e.USD.29277764804'
    assert dividend.security.isin == 'CUSIP:747525103'
    assert dividend.quantity == 1
    assert dividend.price_per_unit == 44.35249
    assert dividend.taxes == 6.6566006
    assert dividend.currency.code == 'USD'
    assert dividend.currency.rate_to_base == 0.7454
    assert dividend.date == datetime(2024, 9, 26, 20, 20)
