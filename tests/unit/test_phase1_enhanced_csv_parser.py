"""Tests for Phase 1 Task 1.3: Enhanced CSV Parser."""
import pytest
from datetime import datetime
from src.main.python.parsers.csv_parser import CsvParser
from src.main.python.models.domain_models import TransactionType, AssetClass, Currency, Security
import pytest_mock


@pytest.fixture
def csv_parser():
    """Fixture for CsvParser instance."""
    return CsvParser()

@pytest.fixture
def mock_sharesight_row_buy():
    """Mock Sharesight CSV row for a BUY transaction."""
    return {
        'TradeDate': '2023-01-10',
        'Symbol': 'MSFT',
        'Name': 'Microsoft Corp',
        'AssetClass': 'STK',
        'SubCategory': 'COMMON',
        'ListingExchange': 'NASDAQ',
        'Exchange': 'XNAS',
        'Buy/Sell': 'BUY',
        'Quantity': '100',
        'TradePrice': '150.00',
        'CurrencyPrimary': 'USD',
        'FXRateToBase': '0.75',
        'IBCommission': '1.50',
        'Taxes': '0.25',
        'TradeID': 'TXN123',
        'ClosePrice': '155.00',
        'MtmPnl': '500.00',
        'FifoPnlRealized': '0.00'
    }

@pytest.fixture
def mock_sharesight_row_sell():
    """Mock Sharesight CSV row for a SELL transaction."""
    return {
        'TradeDate': '2023-02-15',
        'Symbol': 'MSFT',
        'Name': 'Microsoft Corp',
        'AssetClass': 'STK',
        'SubCategory': 'COMMON',
        'ListingExchange': 'NASDAQ',
        'Exchange': 'XNAS',
        'Buy/Sell': 'SELL',
        'Quantity': '50',
        'TradePrice': '160.00',
        'CurrencyPrimary': 'USD',
        'FXRateToBase': '0.76',
        'IBCommission': '0.75',
        'Taxes': '0.10',
        'TradeID': 'TXN124',
        'ClosePrice': '158.00',
        'MtmPnl': '200.00',
        'FifoPnlRealized': '100.00'
    }

@pytest.fixture
def mock_sharesight_row_dividend():
    """Mock Sharesight CSV row for a DIVIDEND transaction."""
    return {
        'TradeDate': '2023-03-01',
        'Symbol': 'MSFT',
        'Name': 'Microsoft Corp',
        'AssetClass': 'STK',
        'TransactionType': 'DIV',
        'Quantity': '100', # Shares held
        'TradePrice': '0.50', # Dividend per share
        'CurrencyPrimary': 'USD',
        'FXRateToBase': '0.74',
        'IBCommission': '0.00',
        'Taxes': '5.00', # Withholding tax
        'TradeID': 'TXN125',
        'Description': 'MSFT Dividend'
    }

@pytest.fixture
def mock_sharesight_row_currency_exchange():
    """Mock Sharesight CSV row for a CURRENCY_EXCHANGE transaction."""
    return {
        'TradeDate': '2023-04-01',
        'Symbol': 'USD.GBP',
        'Name': 'USD to GBP',
        'AssetClass': 'CASH',
        'TransactionType': 'FX',
        'Quantity': '1000', # Amount of USD sold
        'TradePrice': '0.80', # Exchange rate (GBP per USD)
        'CurrencyPrimary': 'USD', # From currency
        'FXRateToBase': '1.00', # Base currency rate (GBP)
        'IBCommission': '0.00',
        'Taxes': '0.00',
        'TradeID': 'TXN126',
        'Description': 'Currency Exchange'
    }

class TestEnhancedCsvParser:
    """Test cases for the enhanced CsvParser."""

    def test_parse_buy_transaction(self, csv_parser, mock_sharesight_row_buy, mocker):
        """Test parsing a BUY transaction with enhanced fields."""
        mocker.patch('csv.DictReader', return_value=[mock_sharesight_row_buy])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.transaction_type == TransactionType.BUY
        assert txn.security.symbol == 'MSFT'
        assert txn.security.name == 'Microsoft Corp'
        assert txn.security.asset_class == AssetClass.STOCK
        assert txn.security.sub_category == 'COMMON'
        assert txn.security.listing_exchange == 'NASDAQ'
        assert txn.security.trading_exchange == 'XNAS'
        assert txn.date == datetime(2023, 1, 10)
        assert txn.quantity == 100.0
        assert txn.price_per_unit == 150.0
        assert txn.commission == 1.50
        assert txn.taxes == 0.25
        assert txn.currency.code == 'USD'
        assert txn.currency.rate_to_base == 0.75
        assert txn.transaction_id == 'TXN123'
        # Check calculated properties
        assert txn.total_cost == (100 * 150.00) + 1.50 + 0.25
        assert txn.total_cost_in_base_currency == txn.total_cost * 0.75

    def test_parse_sell_transaction(self, csv_parser, mock_sharesight_row_sell, mocker):
        """Test parsing a SELL transaction with enhanced fields."""
        mocker.patch('csv.DictReader', return_value=[mock_sharesight_row_sell])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.transaction_type == TransactionType.SELL
        assert txn.security.symbol == 'MSFT'
        assert txn.date == datetime(2023, 2, 15)
        assert txn.quantity == -50.0  # Quantity should be negative for sells
        assert txn.price_per_unit == 160.0
        assert txn.commission == 0.75
        assert txn.taxes == 0.10
        assert txn.currency.code == 'USD'
        assert txn.currency.rate_to_base == 0.76
        assert txn.transaction_id == 'TXN124'
        # Check calculated properties
        assert txn.net_amount == (50 * 160.00) - 0.75 - 0.10
        assert txn.net_amount_in_base_currency == txn.net_amount * 0.76

    def test_parse_dividend_transaction(self, csv_parser, mock_sharesight_row_dividend, mocker):
        """Test parsing a DIVIDEND transaction."""
        mocker.patch('csv.DictReader', return_value=[mock_sharesight_row_dividend])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.transaction_type == TransactionType.DIVIDEND
        assert txn.security.symbol == 'MSFT'
        assert txn.date == datetime(2023, 3, 1)
        assert txn.quantity == 100.0 # Shares held, not dividend amount
        assert txn.price_per_unit == 0.50 # Dividend per share
        assert txn.commission == 0.00
        assert txn.taxes == 5.00 # Withholding tax
        assert txn.currency.code == 'USD'
        assert txn.currency.rate_to_base == 0.74
        assert txn.transaction_id == 'TXN125'
        assert txn.security.name == 'Microsoft Corp'

    def test_parse_currency_exchange_transaction(self, csv_parser, mock_sharesight_row_currency_exchange, mocker):
        """Test parsing a CURRENCY_EXCHANGE transaction."""
        mocker.patch('csv.DictReader', return_value=[mock_sharesight_row_currency_exchange])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.transaction_type == TransactionType.CURRENCY_EXCHANGE
        assert txn.security.symbol == 'USD.GBP'
        assert txn.security.name == 'USD to GBP'
        assert txn.security.asset_class == AssetClass.CASH
        assert txn.date == datetime(2023, 4, 1)
        assert txn.quantity == 1000.0 # Amount of USD sold
        assert txn.price_per_unit == 0.80 # Exchange rate (GBP per USD)
        assert txn.currency.code == 'USD' # From currency
        assert txn.currency.rate_to_base == 1.00 # Base currency rate (GBP)
        assert txn.transaction_id == 'TXN126'

    def test_parse_multiple_transactions(self, csv_parser, mocker,
                                         mock_sharesight_row_buy,
                                         mock_sharesight_row_sell,
                                         mock_sharesight_row_dividend):
        """Test parsing a file with multiple transaction types."""
        mock_rows = [
            mock_sharesight_row_buy,
            mock_sharesight_row_sell,
            mock_sharesight_row_dividend
        ]
        mocker.patch('csv.DictReader', return_value=mock_rows)
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 3
        assert transactions[0].transaction_type == TransactionType.BUY
        assert transactions[1].transaction_type == TransactionType.SELL
        assert transactions[2].transaction_type == TransactionType.DIVIDEND

    def test_parse_missing_required_fields(self, csv_parser, mocker):
        """Test parsing a row with missing required fields."""
        bad_row = {
            'Symbol': 'MSFT',
            'Buy/Sell': 'BUY',
            'Quantity': '100',
            # Missing TradeDate and TradePrice
        }
        mocker.patch('csv.DictReader', return_value=[bad_row])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 0 # Should skip this row

    def test_parse_invalid_date_format(self, csv_parser, mock_sharesight_row_buy, mocker):
        """Test parsing a row with invalid date format."""
        invalid_date_row = mock_sharesight_row_buy.copy()
        invalid_date_row['TradeDate'] = '2023/13/01' # Invalid month
        mocker.patch('csv.DictReader', return_value=[invalid_date_row])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 0 # Should skip this row

    def test_parse_invalid_numeric_data(self, csv_parser, mock_sharesight_row_buy, mocker):
        """Test parsing a row with invalid numeric data."""
        invalid_numeric_row = mock_sharesight_row_buy.copy()
        invalid_numeric_row['Quantity'] = 'abc' # Invalid quantity
        mocker.patch('csv.DictReader', return_value=[invalid_numeric_row])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 0 # Should skip this row due to ValueError

    def test_parse_empty_file(self, csv_parser, mocker):
        """Test parsing an empty CSV file."""
        mocker.patch('csv.DictReader', return_value=[])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("empty.csv")
        assert len(transactions) == 0

    def test_parse_file_not_found(self, csv_parser, mocker):
        """Test parsing a non-existent file."""
        mocker.patch('builtins.open', side_effect=FileNotFoundError)
        transactions = csv_parser.parse("non_existent.csv")
        assert len(transactions) == 0

    def test_security_id_type_handling(self, csv_parser, mocker):
        """Test that security ID types are correctly handled."""
        row_isin = {
            'TradeDate': '2023-01-01', 'Symbol': 'AAPL', 'Name': 'Apple Inc',
            'Buy/Sell': 'BUY', 'Quantity': '10', 'TradePrice': '100',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '1.0',
            'SecurityID': 'US0378331005', 'SecurityIDType': 'ISIN'
        }
        row_cusip = {
            'TradeDate': '2023-01-01', 'Symbol': 'GOOG', 'Name': 'Alphabet Inc',
            'Buy/Sell': 'BUY', 'Quantity': '5', 'TradePrice': '2000',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '1.0',
            'SecurityID': '02079K107', 'SecurityIDType': 'CUSIP'
        }
        row_ticker_fallback = {
            'TradeDate': '2023-01-01', 'Symbol': 'TSLA', 'Name': 'Tesla Inc',
            'Buy/Sell': 'BUY', 'Quantity': '2', 'TradePrice': '800',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '1.0',
            # No SecurityID or SecurityIDType, should fallback to TICKER
        }

        mocker.patch('csv.DictReader', return_value=[row_isin, row_cusip, row_ticker_fallback])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 3

        assert transactions[0].security.security_type == 'ISIN'
        assert transactions[0].security.get_identifier() == 'US0378331005'

        assert transactions[1].security.security_type == 'CUSIP'
        assert transactions[1].security.get_identifier() == '02079K107'

        assert transactions[2].security.security_type == 'TICKER'
        assert transactions[2].security.get_identifier() == 'TSLA'

    def test_asset_class_mapping(self, csv_parser, mocker):
        """Test that asset classes are correctly mapped."""
        row_etf = {
            'TradeDate': '2023-01-01', 'Symbol': 'SPY', 'Name': 'SPDR S&P 500 ETF',
            'AssetClass': 'ETF', 'Buy/Sell': 'BUY', 'Quantity': '10', 'TradePrice': '400',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '1.0'
        }
        row_bond = {
            'TradeDate': '2023-01-01', 'Symbol': 'BOND1', 'Name': 'Corporate Bond',
            'AssetClass': 'BOND', 'Buy/Sell': 'BUY', 'Quantity': '1', 'TradePrice': '1000',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '1.0'
        }

        mocker.patch('csv.DictReader', return_value=[row_etf, row_bond])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 2

        assert transactions[0].security.asset_class == AssetClass.ETF
        assert transactions[1].security.asset_class == AssetClass.BOND

    def test_currency_rate_handling(self, csv_parser, mocker):
        """Test that currency rates are correctly handled."""
        row_usd = {
            'TradeDate': '2023-01-01', 'Symbol': 'AAPL', 'Name': 'Apple Inc',
            'Buy/Sell': 'BUY', 'Quantity': '10', 'TradePrice': '100',
            'CurrencyPrimary': 'USD', 'FXRateToBase': '0.80'
        }
        row_eur = {
            'TradeDate': '2023-01-01', 'Symbol': 'DAI', 'Name': 'Daimler AG',
            'Buy/Sell': 'BUY', 'Quantity': '5', 'TradePrice': '50',
            'CurrencyPrimary': 'EUR', 'FXRateToBase': '0.85'
        }

        mocker.patch('csv.DictReader', return_value=[row_usd, row_eur])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 2

        assert transactions[0].currency.code == 'USD'
        assert transactions[0].currency.rate_to_base == 0.80
        assert transactions[0].total_cost_in_base_currency == (10 * 100) * 0.80

        assert transactions[1].currency.code == 'EUR'
        assert transactions[1].currency.rate_to_base == 0.85
        assert transactions[1].total_cost_in_base_currency == (5 * 50) * 0.85

    def test_alternative_field_names(self, csv_parser, mocker):
        """Test that alternative field names are correctly handled."""
        row_alt_names = {
            'Date': '2023-05-01', # Alternative date field
            'Symbol': 'GOOG',
            'Description': 'Alphabet Inc', # Alternative name field
            'Buy/Sell': 'BUY',
            'Quantity': '5',
            'UnitPrice': '2000', # Alternative price field
            'Currency': 'USD', # Alternative currency field
            'CurrencyRate': '1.0', # Alternative FX rate field
            'Commission': '2.00', # Alternative commission field
            'Taxes': '0.50',
        }
        mocker.patch('csv.DictReader', return_value=[row_alt_names])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.date == datetime(2023, 5, 1)
        assert txn.security.name == 'Alphabet Inc'
        assert txn.price_per_unit == 2000.0
        assert txn.currency.code == 'USD'
        assert txn.currency.rate_to_base == 1.0
        assert txn.commission == 2.00
        assert txn.taxes == 0.50

    def test_currency_transaction_processing(self, csv_parser, mock_sharesight_row_currency_exchange, mocker):
        """Test that currency exchange transactions are processed and not skipped."""
        mocker.patch('csv.DictReader', return_value=[mock_sharesight_row_currency_exchange])
        mocker.patch('builtins.open', mocker.mock_open())

        transactions = csv_parser.parse("dummy_path.csv")
        assert len(transactions) == 1
        txn = transactions[0]

        assert txn.transaction_type == TransactionType.CURRENCY_EXCHANGE
        assert txn.security.symbol == 'USD.GBP'
        assert txn.security.asset_class == AssetClass.CASH
        assert txn.quantity == 1000.0
        assert txn.price_per_unit == 0.80
        assert txn.currency.code == 'USD'
        assert txn.currency.rate_to_base == 1.00 # This is the rate of USD to GBP, but the transaction currency is USD, so its rate to base is 1.0
