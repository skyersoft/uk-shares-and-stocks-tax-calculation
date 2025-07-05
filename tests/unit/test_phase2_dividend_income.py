"""Tests for Phase 2 Task 2.1: Dividend Income Domain Models."""
import pytest
from datetime import datetime
from uuid import UUID
from src.main.python.models.domain_models import (
    DividendIncome, Security, Currency, DividendSummary, AssetClass
)


@pytest.fixture
def mock_security():
    """Mock Security object for testing."""
    return Security(
        isin="US0378331005",
        symbol="AAPL",
        name="Apple Inc",
        asset_class=AssetClass.STOCK
    )

@pytest.fixture
def mock_currency_usd():
    """Mock USD Currency object."""
    return Currency(code="USD", rate_to_base=0.75)

@pytest.fixture
def mock_currency_gbp():
    """Mock GBP Currency object."""
    return Currency(code="GBP", rate_to_base=1.0)

class TestDividendIncome:
    """Test cases for the DividendIncome domain model."""

    def test_dividend_income_creation(self, mock_security, mock_currency_usd):
        """Test successful creation of a DividendIncome object."""
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 3, 15),
            record_date=datetime(2023, 3, 1),
            amount_foreign_currency=100.0,
            foreign_currency=mock_currency_usd,
            amount_gbp=75.0,
            withholding_tax_foreign=10.0,
            withholding_tax_gbp=7.5
        )

        assert isinstance(dividend.id, UUID)
        assert dividend.security == mock_security
        assert dividend.payment_date == datetime(2023, 3, 15)
        assert dividend.record_date == datetime(2023, 3, 1)
        assert dividend.amount_foreign_currency == 100.0
        assert dividend.foreign_currency == mock_currency_usd
        assert dividend.amount_gbp == 75.0
        assert dividend.withholding_tax_foreign == 10.0
        assert dividend.withholding_tax_gbp == 7.5
        assert dividend.dividend_type == "ORDINARY"

    def test_dividend_income_defaults(self, mock_security, mock_currency_gbp):
        """Test DividendIncome with default values."""
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 6, 1),
            foreign_currency=mock_currency_gbp,
            amount_gbp=50.0
        )

        assert isinstance(dividend.id, UUID)
        assert dividend.record_date is None
        assert dividend.amount_foreign_currency == 0.0
        assert dividend.withholding_tax_foreign == 0.0
        assert dividend.withholding_tax_gbp == 0.0
        assert dividend.dividend_type == "ORDINARY"

    def test_net_dividend_gbp_property(self, mock_security, mock_currency_usd):
        """Test the net_dividend_gbp property calculation."""
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 3, 15),
            amount_gbp=75.0,
            withholding_tax_gbp=7.5,
            foreign_currency=mock_currency_usd
        )
        assert dividend.net_dividend_gbp == 67.5

    def test_gross_dividend_gbp_property(self, mock_security, mock_currency_usd):
        """Test the gross_dividend_gbp property."""
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 3, 15),
            amount_gbp=75.0,
            withholding_tax_gbp=7.5,
            foreign_currency=mock_currency_usd
        )
        assert dividend.gross_dividend_gbp == 75.0

    def test_dividend_type_custom(self, mock_security, mock_currency_gbp):
        """Test setting a custom dividend type."""
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 9, 1),
            foreign_currency=mock_currency_gbp,
            amount_gbp=25.0,
            dividend_type="SPECIAL"
        )
        assert dividend.dividend_type == "SPECIAL"

class TestDividendSummary:
    """Test cases for the DividendSummary domain model."""

    def test_dividend_summary_creation(self):
        """Test successful creation of a DividendSummary object."""
        summary = DividendSummary(tax_year="2023-2024")
        assert summary.tax_year == "2023-2024"
        assert summary.dividends == []
        assert summary.total_gross_gbp == 0.0
        assert summary.total_withholding_tax_gbp == 0.0
        assert summary.total_net_gbp == 0.0

    def test_add_dividend(self, mock_security, mock_currency_usd, mock_currency_gbp):
        """Test adding dividends to the summary and aggregation."""
        summary = DividendSummary(tax_year="2023-2024")

        dividend1 = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 7, 1),
            amount_gbp=100.0,
            withholding_tax_gbp=10.0,
            foreign_currency=mock_currency_usd
        )
        summary.add_dividend(dividend1)

        assert len(summary.dividends) == 1
        assert summary.total_gross_gbp == 100.0
        assert summary.total_withholding_tax_gbp == 10.0
        assert summary.total_net_gbp == 90.0

        dividend2 = DividendIncome(
            security=mock_security,
            payment_date=datetime(2024, 1, 15),
            amount_gbp=50.0,
            withholding_tax_gbp=5.0,
            foreign_currency=mock_currency_gbp
        )
        summary.add_dividend(dividend2)

        assert len(summary.dividends) == 2
        assert summary.total_gross_gbp == 150.0
        assert summary.total_withholding_tax_gbp == 15.0
        assert summary.total_net_gbp == 135.0

    def test_add_dividend_empty_values(self, mock_security, mock_currency_gbp):
        """Test adding a dividend with zero amounts."""
        summary = DividendSummary(tax_year="2023-2024")
        dividend = DividendIncome(
            security=mock_security,
            payment_date=datetime(2023, 10, 1),
            amount_gbp=0.0,
            withholding_tax_gbp=0.0,
            foreign_currency=mock_currency_gbp
        )
        summary.add_dividend(dividend)

        assert len(summary.dividends) == 1
        assert summary.total_gross_gbp == 0.0
        assert summary.total_withholding_tax_gbp == 0.0
        assert summary.total_net_gbp == 0.0
