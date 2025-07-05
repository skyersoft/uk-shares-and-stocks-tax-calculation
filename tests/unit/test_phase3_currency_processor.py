"""Tests for Phase 3 Task 3.2: Currency Exchange Processing Service."""
import pytest
from datetime import datetime
import copy # Import the copy module
from src.main.python.services.currency_processor import CurrencyExchangeProcessor
from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency, CurrencyGainLoss, AssetClass
)


@pytest.fixture
def currency_processor():
    """Fixture for CurrencyExchangeProcessor instance."""
    return CurrencyExchangeProcessor()

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

@pytest.fixture
def mock_security_usd_gbp():
    """Mock Security object for USD.GBP currency pair."""
    return Security(symbol="USD.GBP", name="USD to GBP", asset_class=AssetClass.CASH)

@pytest.fixture
def mock_security_eur_gbp():
    """Mock Security object for EUR.GBP currency pair."""
    return Security(symbol="EUR.GBP", name="EUR to GBP", asset_class=AssetClass.CASH)

@pytest.fixture
def mock_fx_buy_usd(mock_security_usd_gbp, mock_currency_usd):
    """Mock FX BUY transaction (buying USD with GBP)."""
    return Transaction(
        transaction_type=TransactionType.CURRENCY_EXCHANGE,
        security=mock_security_usd_gbp,
        date=datetime(2023, 1, 10),
        quantity=1000.0,  # Buying 1000 USD
        price_per_unit=1.0, # Price in USD (not relevant for FX rate)
        commission=0.0,
        taxes=0.0,
        currency=mock_currency_usd, # Transaction is in USD
        transaction_id="FXBUY001"
    )

@pytest.fixture
def mock_fx_sell_usd(mock_security_usd_gbp, mock_currency_usd):
    """Mock FX SELL transaction (selling USD for GBP)."""
    return Transaction(
        transaction_type=TransactionType.CURRENCY_EXCHANGE,
        security=mock_security_usd_gbp,
        date=datetime(2023, 6, 15),
        quantity=-500.0,  # Selling 500 USD
        price_per_unit=1.0, # Price in USD (not relevant for FX rate)
        commission=0.0,
        taxes=0.0,
        currency=mock_currency_usd, # Transaction is in USD
        transaction_id="FXSELL001"
    )

@pytest.fixture
def mock_fx_buy_eur(mock_security_eur_gbp, mock_currency_eur):
    """Mock FX BUY transaction (buying EUR with GBP)."""
    return Transaction(
        transaction_type=TransactionType.CURRENCY_EXCHANGE,
        security=mock_security_eur_gbp,
        date=datetime(2023, 2, 1),
        quantity=200.0,  # Buying 200 EUR
        price_per_unit=1.0,
        commission=0.0,
        taxes=0.0,
        currency=mock_currency_eur,
        transaction_id="FXBUY002"
    )

@pytest.fixture
def mock_fx_sell_eur(mock_security_eur_gbp, mock_currency_eur):
    """Mock FX SELL transaction (selling EUR for GBP)."""
    return Transaction(
        transaction_type=TransactionType.CURRENCY_EXCHANGE,
        security=mock_security_eur_gbp,
        date=datetime(2023, 7, 20),
        quantity=-100.0,  # Selling 100 EUR
        price_per_unit=1.0,
        commission=0.0,
        taxes=0.0,
        currency=mock_currency_eur,
        transaction_id="FXSELL002"
    )

@pytest.fixture
def mock_buy_transaction(mock_security_usd_gbp, mock_currency_usd):
    """Mock a BUY transaction (non-FX)."""
    return Transaction(
        transaction_type=TransactionType.BUY,
        security=mock_security_usd_gbp,
        date=datetime(2023, 9, 1),
        quantity=100,
        price_per_unit=150.0,
        currency=mock_currency_usd,
        transaction_id="BUY123"
    )

class TestCurrencyExchangeProcessor:
    """Test cases for the CurrencyExchangeProcessor service."""

    def test_process_currency_transactions_fifo_gain(
        self, currency_processor, mock_security_usd_gbp
    ):
        """Test processing FX transactions with a gain using FIFO."""
        buy_currency = Currency(code="USD", rate_to_base=0.70) # Bought USD when 1 USD = 0.70 GBP
        sell_currency = Currency(code="USD", rate_to_base=0.80) # Sold USD when 1 USD = 0.80 GBP

        buy_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 10),
            quantity=1000.0,
            price_per_unit=1.0,
            currency=buy_currency,
            transaction_id="FXBUY001"
        )
        sell_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 6, 15),
            quantity=-500.0,
            price_per_unit=1.0,
            currency=sell_currency,
            transaction_id="FXSELL001"
        )

        transactions = [buy_txn, sell_txn]
        gains_losses = currency_processor.process_currency_transactions(transactions)

        assert len(gains_losses) == 1
        fx_gain_loss = gains_losses[0]

        assert fx_gain_loss.currency_pair == "USD.GBP"
        assert fx_gain_loss.transaction_date == datetime(2023, 6, 15)
        assert fx_gain_loss.amount_gbp == pytest.approx(500.0 * 0.80) # Proceeds in GBP
        
        # Cost basis: 500 USD * 0.70 GBP/USD = 350 GBP
        # Proceeds: 500 USD * 0.80 GBP/USD = 400 GBP
        # Gain: 400 - 350 = 50 GBP
        assert fx_gain_loss.gain_loss_gbp == pytest.approx(50.0)
        assert fx_gain_loss.is_gain is True
        assert fx_gain_loss.exchange_rate_used == 0.80
        assert fx_gain_loss.exchange_rate_original == 0.70 # Original rate from the bought lot

    def test_process_currency_transactions_fifo_loss(
        self, currency_processor, mock_security_usd_gbp
    ):
        """Test processing FX transactions with a loss using FIFO."""
        buy_currency = Currency(code="USD", rate_to_base=0.80) # Bought USD when 1 USD = 0.80 GBP
        sell_currency = Currency(code="USD", rate_to_base=0.70) # Sold USD when 1 USD = 0.70 GBP

        buy_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 10),
            quantity=1000.0,
            price_per_unit=1.0,
            currency=buy_currency,
            transaction_id="FXBUY001"
        )
        sell_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 6, 15),
            quantity=-500.0,
            price_per_unit=1.0,
            currency=sell_currency,
            transaction_id="FXSELL001"
        )

        transactions = [buy_txn, sell_txn]
        gains_losses = currency_processor.process_currency_transactions(transactions)

        assert len(gains_losses) == 1
        fx_gain_loss = gains_losses[0]

        assert fx_gain_loss.currency_pair == "USD.GBP"
        assert fx_gain_loss.transaction_date == datetime(2023, 6, 15)
        assert fx_gain_loss.amount_gbp == pytest.approx(500.0 * 0.70) # Proceeds in GBP
        
        # Cost basis: 500 USD * 0.80 GBP/USD = 400 GBP
        # Proceeds: 500 USD * 0.70 GBP/USD = 350 GBP
        # Loss: 350 - 400 = -50 GBP
        assert fx_gain_loss.gain_loss_gbp == pytest.approx(-50.0)
        assert fx_gain_loss.is_gain is False
        assert fx_gain_loss.exchange_rate_used == 0.70
        assert fx_gain_loss.exchange_rate_original == 0.80

    def test_process_currency_transactions_multiple_pairs(
        self, currency_processor, mock_security_usd_gbp, mock_security_eur_gbp
    ):
        """Test processing FX transactions with multiple currency pairs."""
        # Set rates for USD pair
        usd_buy_currency = Currency(code="USD", rate_to_base=0.70)
        usd_sell_currency = Currency(code="USD", rate_to_base=0.80)
        # Set rates for EUR pair
        eur_buy_currency = Currency(code="EUR", rate_to_base=0.85)
        eur_sell_currency = Currency(code="EUR", rate_to_base=0.90)

        buy_usd_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 10),
            quantity=1000.0, price_per_unit=1.0, currency=usd_buy_currency
        )
        sell_usd_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 6, 15),
            quantity=-500.0, price_per_unit=1.0, currency=usd_sell_currency
        )
        buy_eur_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_eur_gbp,
            date=datetime(2023, 2, 1),
            quantity=200.0, price_per_unit=1.0, currency=eur_buy_currency
        )
        sell_eur_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_eur_gbp,
            date=datetime(2023, 7, 20),
            quantity=-100.0, price_per_unit=1.0, currency=eur_sell_currency
        )

        transactions = [
            buy_usd_txn, buy_eur_txn,
            sell_usd_txn, sell_eur_txn
        ]
        gains_losses = currency_processor.process_currency_transactions(transactions)

        assert len(gains_losses) == 2
        usd_gain_loss = next(g for g in gains_losses if g.currency_pair == "USD.GBP")
        eur_gain_loss = next(g for g in gains_losses if g.currency_pair == "EUR.GBP")

        assert usd_gain_loss.gain_loss_gbp == pytest.approx(50.0)
        assert eur_gain_loss.gain_loss_gbp == pytest.approx(5.0) # 100 EUR * (0.90 - 0.85) = 5 GBP

    def test_process_currency_transactions_partial_disposal(
        self, currency_processor, mock_security_usd_gbp
    ):
        """Test partial disposal of a currency pool."""
        buy_currency = Currency(code="USD", rate_to_base=0.75) # Bought 1000 USD @ 0.75
        sell_currency = Currency(code="USD", rate_to_base=0.80) # Sold @ 0.80

        buy_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 10),
            quantity=1000.0, price_per_unit=1.0, currency=buy_currency
        )
        sell_txn = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 6, 15),
            quantity=-200.0, price_per_unit=1.0, currency=sell_currency
        )

        transactions = [buy_txn, sell_txn]
        gains_losses = currency_processor.process_currency_transactions(transactions)

        assert len(gains_losses) == 1
        fx_gain_loss = gains_losses[0]
        
        # Cost basis: 200 USD * 0.75 GBP/USD = 150 GBP
        # Proceeds: 200 USD * 0.80 GBP/USD = 160 GBP
        # Gain: 160 - 150 = 10 GBP
        assert fx_gain_loss.gain_loss_gbp == pytest.approx(10.0)
        assert fx_gain_loss.is_gain is True

    def test_process_currency_transactions_multiple_buys_single_sell(
        self, currency_processor, mock_security_usd_gbp
    ):
        """Test FIFO with multiple buy lots and a single sell."""
        buy1_currency = Currency(code="USD", rate_to_base=0.70) # 100 USD @ 0.70 = 70 GBP
        buy2_currency = Currency(code="USD", rate_to_base=0.72) # 200 USD @ 0.72 = 144 GBP
        sell_currency = Currency(code="USD", rate_to_base=0.78) # Sold @ 0.78

        buy1 = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 1),
            quantity=100, price_per_unit=1.0, currency=buy1_currency
        )

        buy2 = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 5),
            quantity=200, price_per_unit=1.0, currency=buy2_currency
        )

        sell = Transaction(
            transaction_type=TransactionType.CURRENCY_EXCHANGE,
            security=mock_security_usd_gbp,
            date=datetime(2023, 1, 10),
            quantity=-150, price_per_unit=1.0, currency=sell_currency
        )

        transactions = [buy1, buy2, sell]
        gains_losses = currency_processor.process_currency_transactions(transactions)

        assert len(gains_losses) == 1
        fx_gain_loss = gains_losses[0]

        # FIFO: 100 from buy1 (cost 70) + 50 from buy2 (cost 50 * 0.72 = 36)
        # Total cost basis = 70 + 36 = 106 GBP
        # Proceeds = 150 USD * 0.78 GBP/USD = 117 GBP
        # Gain = 117 - 106 = 11 GBP
        assert fx_gain_loss.gain_loss_gbp == pytest.approx(11.0)

    def test_process_currency_transactions_no_fx_transactions(self, currency_processor, mock_buy_transaction):
        """Test processing transactions with no FX transactions."""
        transactions = [mock_buy_transaction]
        gains_losses = currency_processor.process_currency_transactions(transactions)
        assert len(gains_losses) == 0
