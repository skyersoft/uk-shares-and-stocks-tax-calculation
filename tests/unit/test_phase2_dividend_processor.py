"""Tests for Phase 2 Task 2.2: Dividend Processing Service."""
import pytest
from datetime import datetime
from src.main.python.services.dividend_processor import DividendProcessor
from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, DividendIncome, DividendSummary, AssetClass
)


@pytest.fixture
def dividend_processor():
    """Fixture for DividendProcessor instance."""
    return DividendProcessor()

@pytest.fixture
def mock_security_aapl():
    """Mock Security object for Apple Inc."""
    return Security(isin="US0378331005", symbol="AAPL", name="Apple Inc", asset_class=AssetClass.STOCK)

@pytest.fixture
def mock_security_msft():
    """Mock Security object for Microsoft Corp."""
    return Security(isin="US5949181045", symbol="MSFT", name="Microsoft Corp", asset_class=AssetClass.STOCK)

@pytest.fixture
def mock_currency_usd():
    """Mock USD Currency object."""
    return Currency(code="USD", rate_to_base=0.75)

@pytest.fixture
def mock_currency_gbp():
    """Mock GBP Currency object."""
    return Currency(code="GBP", rate_to_base=1.0)

@pytest.fixture
def mock_dividend_transaction_usd(mock_security_aapl, mock_currency_usd):
    """Mock dividend Transaction in USD."""
    return Transaction(
        transaction_type=TransactionType.DIVIDEND,
        security=mock_security_aapl,
        date=datetime(2023, 10, 10),
        quantity=100,  # Represents shares held
        price_per_unit=0.92,  # Dividend per share
        commission=0.0,
        taxes=9.20,  # Withholding tax
        currency=mock_currency_usd,
        transaction_id="DIV123USD"
    )

@pytest.fixture
def mock_dividend_transaction_gbp(mock_security_msft, mock_currency_gbp):
    """Mock dividend Transaction in GBP."""
    return Transaction(
        transaction_type=TransactionType.DIVIDEND,
        security=mock_security_msft,
        date=datetime(2023, 11, 15),
        quantity=50,
        price_per_unit=0.30,
        commission=0.0,
        taxes=0.0,
        currency=mock_currency_gbp,
        transaction_id="DIV124GBP"
    )

@pytest.fixture
def mock_buy_transaction(mock_security_aapl, mock_currency_usd):
    """Mock a BUY transaction."""
    return Transaction(
        transaction_type=TransactionType.BUY,
        security=mock_security_aapl,
        date=datetime(2023, 9, 1),
        quantity=100,
        price_per_unit=150.0,
        currency=mock_currency_usd,
        transaction_id="BUY123"
    )

class TestDividendProcessor:
    """Test cases for the DividendProcessor service."""

    def test_process_dividend_transactions_single(self, dividend_processor, mock_dividend_transaction_usd):
        """Test processing a single dividend transaction."""
        transactions = [mock_dividend_transaction_usd]
        dividends = dividend_processor.process_dividend_transactions(transactions)

        assert len(dividends) == 1
        dividend = dividends[0]
        assert dividend.security == mock_dividend_transaction_usd.security
        assert dividend.payment_date == mock_dividend_transaction_usd.date
        assert dividend.foreign_currency == mock_dividend_transaction_usd.currency
        
        # Expected amounts should now directly reflect price_per_unit and taxes from the transaction
        # as the DividendProcessor now treats price_per_unit as the total dividend amount.
        expected_amount_foreign = mock_dividend_transaction_usd.price_per_unit
        expected_amount_gbp = expected_amount_foreign * mock_dividend_transaction_usd.currency.rate_to_base
        expected_withholding_tax_gbp = mock_dividend_transaction_usd.taxes * mock_dividend_transaction_usd.currency.rate_to_base

        assert dividend.amount_foreign_currency == expected_amount_foreign
        assert dividend.amount_gbp == expected_amount_gbp
        assert dividend.withholding_tax_gbp == expected_withholding_tax_gbp
        assert dividend.dividend_type == "ORDINARY"

    def test_process_dividend_transactions_multiple(
        self, dividend_processor, mock_dividend_transaction_usd, mock_dividend_transaction_gbp, mock_buy_transaction
    ):
        """Test processing multiple dividend transactions mixed with other types."""
        transactions = [
            mock_buy_transaction,
            mock_dividend_transaction_usd,
            mock_dividend_transaction_gbp
        ]
        dividends = dividend_processor.process_dividend_transactions(transactions)

        assert len(dividends) == 2
        assert all(isinstance(d, DividendIncome) for d in dividends)
        assert any(d.security.symbol == "AAPL" for d in dividends)
        assert any(d.security.symbol == "MSFT" for d in dividends)

    def test_process_dividend_transactions_no_dividends(self, dividend_processor, mock_buy_transaction):
        """Test processing transactions with no dividends."""
        transactions = [mock_buy_transaction]
        dividends = dividend_processor.process_dividend_transactions(transactions)
        assert len(dividends) == 0

    def test_calculate_dividend_summary_single_year(
        self, dividend_processor, mock_security_aapl, mock_currency_usd, mock_currency_gbp
    ):
        """Test calculating dividend summary for a single tax year."""
        dividend1 = DividendIncome(
            security=mock_security_aapl,
            payment_date=datetime(2023, 7, 1), # In 2023-2024 tax year
            amount_foreign_currency=100.0,
            foreign_currency=mock_currency_usd,
            amount_gbp=75.0,
            withholding_tax_gbp=7.5
        )
        dividend2 = DividendIncome(
            security=mock_security_aapl,
            payment_date=datetime(2024, 3, 1), # Also in 2023-2024 tax year
            amount_foreign_currency=50.0,
            foreign_currency=mock_currency_usd,
            amount_gbp=37.5,
            withholding_tax_gbp=3.75
        )
        dividends = [dividend1, dividend2]
        summary = dividend_processor.calculate_dividend_summary(dividends, "2023-2024")

        assert summary.tax_year == "2023-2024"
        assert len(summary.dividends) == 2
        assert summary.total_gross_gbp == (75.0 + 37.5)
        assert summary.total_withholding_tax_gbp == (7.5 + 3.75)
        assert summary.total_net_gbp == (75.0 - 7.5) + (37.5 - 3.75)

    def test_calculate_dividend_summary_multiple_years(
        self, dividend_processor, mock_security_aapl, mock_currency_usd
    ):
        """Test calculating dividend summary across multiple tax years."""
        dividend1 = DividendIncome(
            security=mock_security_aapl,
            payment_date=datetime(2023, 7, 1), # 2023-2024 tax year
            amount_gbp=75.0,
            withholding_tax_gbp=7.5,
            foreign_currency=mock_currency_usd
        )
        dividend2 = DividendIncome(
            security=mock_security_aapl,
            payment_date=datetime(2024, 5, 1), # 2024-2025 tax year
            amount_gbp=80.0,
            withholding_tax_gbp=8.0,
            foreign_currency=mock_currency_usd
        )
        dividends = [dividend1, dividend2]

        summary_2023 = dividend_processor.calculate_dividend_summary(dividends, "2023-2024")
        assert len(summary_2023.dividends) == 1
        assert summary_2023.total_gross_gbp == 75.0

        summary_2024 = dividend_processor.calculate_dividend_summary(dividends, "2024-2025")
        assert len(summary_2024.dividends) == 1
        assert summary_2024.total_gross_gbp == 80.0

    def test_is_in_tax_year(self, dividend_processor):
        """Test _is_in_tax_year helper method."""
        # Dates within 2023-2024 tax year (April 6, 2023 - April 5, 2024)
        assert dividend_processor._is_in_tax_year(datetime(2023, 4, 6), "2023-2024")
        assert dividend_processor._is_in_tax_year(datetime(2023, 12, 31), "2023-2024")
        assert dividend_processor._is_in_tax_year(datetime(2024, 4, 5), "2023-2024")

        # Dates outside 2023-2024 tax year
        assert not dividend_processor._is_in_tax_year(datetime(2023, 4, 5), "2023-2024") # Day before start
        assert not dividend_processor._is_in_tax_year(datetime(2024, 4, 6), "2023-2024") # Day after end
        assert not dividend_processor._is_in_tax_year(datetime(2022, 10, 1), "2023-2024")
        assert not dividend_processor._is_in_tax_year(datetime(2025, 1, 1), "2023-2024")

        # Test with different tax year
        assert dividend_processor._is_in_tax_year(datetime(2024, 4, 6), "2024-2025")
        assert not dividend_processor._is_in_tax_year(datetime(2024, 4, 5), "2024-2025")
