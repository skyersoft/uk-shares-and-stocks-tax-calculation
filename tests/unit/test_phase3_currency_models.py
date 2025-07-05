"""Tests for Phase 3 Task 3.1: Currency Exchange Domain Models."""
import pytest
from datetime import datetime
from uuid import UUID
from src.main.python.models.domain_models import (
    Currency, CurrencyExchange, CurrencyGainLoss, CurrencyGainLossSummary
)


@pytest.fixture
def mock_currency_usd():
    """Mock USD Currency object."""
    return Currency(code="USD", rate_to_base=0.75)

@pytest.fixture
def mock_currency_eur():
    """Mock EUR Currency object."""
    return Currency(code="EUR", rate_to_base=0.85)

@pytest.fixture
def mock_currency_gbp():
    """Mock GBP Currency object."""
    return Currency(code="GBP", rate_to_base=1.0)

class TestCurrencyExchange:
    """Test cases for the CurrencyExchange domain model."""

    def test_currency_exchange_creation(self, mock_currency_usd, mock_currency_gbp):
        """Test successful creation of a CurrencyExchange object."""
        exchange = CurrencyExchange(
            transaction_date=datetime(2023, 5, 10),
            from_currency=mock_currency_usd,
            to_currency=mock_currency_gbp,
            amount_from=1000.0,
            amount_to=750.0,
            exchange_rate=0.75,
            gain_loss_gbp=0.0
        )

        assert isinstance(exchange.id, UUID)
        assert exchange.transaction_date == datetime(2023, 5, 10)
        assert exchange.from_currency == mock_currency_usd
        assert exchange.to_currency == mock_currency_gbp
        assert exchange.amount_from == 1000.0
        assert exchange.amount_to == 750.0
        assert exchange.exchange_rate == 0.75
        assert exchange.gain_loss_gbp == 0.0
        assert exchange.currency_pair == "USD.GBP"

    def test_currency_exchange_validation(self, mock_currency_usd, mock_currency_gbp):
        """Test validation rules for CurrencyExchange."""
        with pytest.raises(ValueError, match="Exchange rate must be positive"):
            CurrencyExchange(
                transaction_date=datetime(2023, 5, 10),
                from_currency=mock_currency_usd,
                to_currency=mock_currency_gbp,
                amount_from=1000.0,
                amount_to=750.0,
                exchange_rate=0.0,  # Invalid rate
                gain_loss_gbp=0.0
            )
        
        with pytest.raises(ValueError, match="From amount cannot be negative"):
            CurrencyExchange(
                transaction_date=datetime(2023, 5, 10),
                from_currency=mock_currency_usd,
                to_currency=mock_currency_gbp,
                amount_from=-100.0,  # Invalid amount
                amount_to=750.0,
                exchange_rate=0.75,
                gain_loss_gbp=0.0
            )
        
        with pytest.raises(ValueError, match="Both currencies must be specified"):
            CurrencyExchange(
                transaction_date=datetime(2023, 5, 10),
                from_currency=mock_currency_usd,
                to_currency=None,  # Missing currency
                amount_from=1000.0,
                amount_to=750.0,
                exchange_rate=0.75,
                gain_loss_gbp=0.0
            )

    def test_currency_pair_property(self, mock_currency_eur, mock_currency_usd):
        """Test the currency_pair property."""
        exchange = CurrencyExchange(
            from_currency=mock_currency_eur,
            to_currency=mock_currency_usd,
            exchange_rate=0.9, # Add a valid exchange rate
            amount_from=100,
            amount_to=90
        )
        assert exchange.currency_pair == "EUR.USD"

        # Test with missing currencies
        with pytest.raises(ValueError, match="Both currencies must be specified"):
            CurrencyExchange(exchange_rate=1.0)


class TestCurrencyGainLoss:
    """Test cases for the CurrencyGainLoss domain model."""

    def test_currency_gain_loss_creation(self):
        """Test successful creation of a CurrencyGainLoss object."""
        gain_loss = CurrencyGainLoss(
            currency_pair="USD.GBP",
            transaction_date=datetime(2023, 6, 1),
            amount_gbp=100.0,
            gain_loss_gbp=10.0,
            exchange_rate_used=0.80,
            exchange_rate_original=0.75
        )

        assert isinstance(gain_loss.id, UUID)
        assert gain_loss.currency_pair == "USD.GBP"
        assert gain_loss.transaction_date == datetime(2023, 6, 1)
        assert gain_loss.amount_gbp == 100.0
        assert gain_loss.gain_loss_gbp == 10.0
        assert gain_loss.exchange_rate_used == 0.80
        assert gain_loss.exchange_rate_original == 0.75
        assert gain_loss.is_gain is True
        assert gain_loss.disposal_method == "FIFO"

    def test_is_gain_property(self):
        """Test the is_gain property."""
        gain = CurrencyGainLoss(gain_loss_gbp=15.0, amount_gbp=100.0, exchange_rate_used=1.0, exchange_rate_original=1.0)
        assert gain.is_gain is True
        assert gain.is_loss is False

        loss = CurrencyGainLoss(gain_loss_gbp=-5.0, amount_gbp=100.0, exchange_rate_used=1.0, exchange_rate_original=1.0)
        assert loss.is_gain is False
        assert loss.is_loss is True

        zero = CurrencyGainLoss(gain_loss_gbp=0.0, amount_gbp=100.0, exchange_rate_used=1.0, exchange_rate_original=1.0)
        assert zero.is_gain is False
        assert zero.is_loss is False

    def test_currency_gain_loss_validation(self):
        """Test validation rules for CurrencyGainLoss."""
        with pytest.raises(ValueError, match="Amount in GBP cannot be negative"):
            CurrencyGainLoss(
                amount_gbp=-10.0,  # Invalid amount
                gain_loss_gbp=5.0,
                exchange_rate_used=1.0,
                exchange_rate_original=1.0
            )
        
        with pytest.raises(ValueError, match="Exchange rate used must be positive"):
            CurrencyGainLoss(
                amount_gbp=100.0,
                gain_loss_gbp=5.0,
                exchange_rate_used=0.0,  # Invalid rate
                exchange_rate_original=1.0
            )
        
        with pytest.raises(ValueError, match="Original exchange rate must be positive"):
            CurrencyGainLoss(
                amount_gbp=100.0,
                gain_loss_gbp=5.0,
                exchange_rate_used=1.0,
                exchange_rate_original=0.0  # Invalid rate
            )


class TestCurrencyGainLossSummary:
    """Test cases for the CurrencyGainLossSummary domain model."""

    def test_summary_creation(self):
        """Test successful creation of a CurrencyGainLossSummary object."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        assert summary.tax_year == "2023-2024"
        assert summary.currency_transactions == []
        assert summary.total_gains == 0.0
        assert summary.total_losses == 0.0
        assert summary.net_gain_loss == 0.0
        assert summary.number_of_transactions == 0
        assert summary.number_of_currency_pairs == 0
        assert summary.is_net_gain is False
        assert summary.is_net_loss is False

    def test_add_currency_transaction(self):
        """Test adding currency transactions and aggregation."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")

        gain_txn = CurrencyGainLoss(
            currency_pair="USD.GBP",
            transaction_date=datetime(2023, 7, 1),
            amount_gbp=100.0,
            gain_loss_gbp=10.0,
            exchange_rate_used=0.80, # Added to satisfy validation
            exchange_rate_original=0.75 # Added to satisfy validation
        )
        summary.add_currency_transaction(gain_txn)

        assert len(summary.currency_transactions) == 1
        assert summary.total_gains == 10.0
        assert summary.total_losses == 0.0
        assert summary.net_gain_loss == 10.0
        assert summary.is_net_gain is True
        assert summary.is_net_loss is False

        loss_txn = CurrencyGainLoss(
            currency_pair="EUR.GBP",
            transaction_date=datetime(2024, 1, 15),
            amount_gbp=50.0,
            gain_loss_gbp=-5.0,
            exchange_rate_used=0.90, # Added to satisfy validation
            exchange_rate_original=0.95 # Added to satisfy validation
        )
        summary.add_currency_transaction(loss_txn)

        assert len(summary.currency_transactions) == 2
        assert summary.total_gains == 10.0
        assert summary.total_losses == 5.0
        assert summary.net_gain_loss == 5.0
        assert summary.is_net_gain is True
        assert summary.is_net_loss is False

        # Test net loss
        large_loss_txn = CurrencyGainLoss(
            currency_pair="JPY.GBP",
            transaction_date=datetime(2024, 2, 1),
            amount_gbp=200.0,
            gain_loss_gbp=-20.0,
            exchange_rate_used=0.006,
            exchange_rate_original=0.007
        )
        summary.add_currency_transaction(large_loss_txn)
        assert summary.net_gain_loss == -15.0
        assert summary.is_net_gain is False
        assert summary.is_net_loss is True

    def test_add_currency_transaction_zero_gain_loss(self):
        """Test adding a transaction with zero gain/loss."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        zero_txn = CurrencyGainLoss(
            currency_pair="CAD.GBP",
            transaction_date=datetime(2023, 9, 1),
            amount_gbp=70.0,
            gain_loss_gbp=0.0,
            exchange_rate_used=0.60, # Added to satisfy validation
            exchange_rate_original=0.60 # Added to satisfy validation
        )
        summary.add_currency_transaction(zero_txn)

        assert len(summary.currency_transactions) == 1
        assert summary.total_gains == 0.0
        assert summary.total_losses == 0.0
        assert summary.net_gain_loss == 0.0
        assert summary.is_net_gain is False
        assert summary.is_net_loss is False

    def test_get_transactions_by_currency_pair(self):
        """Test grouping transactions by currency pair."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        txn1 = CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 7, 1), amount_gbp=100.0, gain_loss_gbp=10.0, exchange_rate_used=0.8, exchange_rate_original=0.75)
        txn2 = CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2023, 8, 1), amount_gbp=50.0, gain_loss_gbp=-5.0, exchange_rate_used=0.9, exchange_rate_original=0.95)
        txn3 = CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 9, 1), amount_gbp=120.0, gain_loss_gbp=15.0, exchange_rate_used=0.85, exchange_rate_original=0.8)
        
        summary.add_currency_transaction(txn1)
        summary.add_currency_transaction(txn2)
        summary.add_currency_transaction(txn3)

        grouped = summary.get_transactions_by_currency_pair()
        assert len(grouped) == 2
        assert "USD.GBP" in grouped
        assert "EUR.GBP" in grouped
        assert len(grouped["USD.GBP"]) == 2
        assert len(grouped["EUR.GBP"]) == 1
        assert txn1 in grouped["USD.GBP"]
        assert txn3 in grouped["USD.GBP"]
        assert txn2 in grouped["EUR.GBP"]

    def test_get_gains_only(self):
        """Test filtering for only gain transactions."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        gain_txn1 = CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 7, 1), amount_gbp=100.0, gain_loss_gbp=10.0, exchange_rate_used=0.8, exchange_rate_original=0.75)
        loss_txn1 = CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2023, 8, 1), amount_gbp=50.0, gain_loss_gbp=-5.0, exchange_rate_used=0.9, exchange_rate_original=0.95)
        gain_txn2 = CurrencyGainLoss(currency_pair="JPY.GBP", transaction_date=datetime(2023, 9, 1), amount_gbp=200.0, gain_loss_gbp=20.0, exchange_rate_used=0.006, exchange_rate_original=0.005)
        
        summary.add_currency_transaction(gain_txn1)
        summary.add_currency_transaction(loss_txn1)
        summary.add_currency_transaction(gain_txn2)

        gains = summary.get_gains_only()
        assert len(gains) == 2
        assert gain_txn1 in gains
        assert gain_txn2 in gains
        assert loss_txn1 not in gains

    def test_get_losses_only(self):
        """Test filtering for only loss transactions."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        gain_txn1 = CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 7, 1), amount_gbp=100.0, gain_loss_gbp=10.0, exchange_rate_used=0.8, exchange_rate_original=0.75)
        loss_txn1 = CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2023, 8, 1), amount_gbp=50.0, gain_loss_gbp=-5.0, exchange_rate_used=0.9, exchange_rate_original=0.95)
        loss_txn2 = CurrencyGainLoss(currency_pair="JPY.GBP", transaction_date=datetime(2023, 9, 1), amount_gbp=200.0, gain_loss_gbp=-20.0, exchange_rate_used=0.006, exchange_rate_original=0.007)
        
        summary.add_currency_transaction(gain_txn1)
        summary.add_currency_transaction(loss_txn1)
        summary.add_currency_transaction(loss_txn2)

        losses = summary.get_losses_only()
        assert len(losses) == 2
        assert loss_txn1 in losses
        assert loss_txn2 in losses
        assert gain_txn1 not in losses

    def test_number_of_transactions_property(self):
        """Test the number_of_transactions property."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        assert summary.number_of_transactions == 0
        
        summary.add_currency_transaction(CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 7, 1), amount_gbp=100.0, gain_loss_gbp=10.0, exchange_rate_used=0.8, exchange_rate_original=0.75))
        assert summary.number_of_transactions == 1
        
        summary.add_currency_transaction(CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2023, 8, 1), amount_gbp=50.0, gain_loss_gbp=-5.0, exchange_rate_used=0.9, exchange_rate_original=0.95))
        assert summary.number_of_transactions == 2

    def test_number_of_currency_pairs_property(self):
        """Test the number_of_currency_pairs property."""
        summary = CurrencyGainLossSummary(tax_year="2023-2024")
        assert summary.number_of_currency_pairs == 0
        
        summary.add_currency_transaction(CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 7, 1), amount_gbp=100.0, gain_loss_gbp=10.0, exchange_rate_used=0.8, exchange_rate_original=0.75))
        assert summary.number_of_currency_pairs == 1
        
        summary.add_currency_transaction(CurrencyGainLoss(currency_pair="EUR.GBP", transaction_date=datetime(2023, 8, 1), amount_gbp=50.0, gain_loss_gbp=-5.0, exchange_rate_used=0.9, exchange_rate_original=0.95))
        assert summary.number_of_currency_pairs == 2
        
        summary.add_currency_transaction(CurrencyGainLoss(currency_pair="USD.GBP", transaction_date=datetime(2023, 9, 1), amount_gbp=120.0, gain_loss_gbp=15.0, exchange_rate_used=0.85, exchange_rate_original=0.8))
        assert summary.number_of_currency_pairs == 2 # Still 2 unique pairs
