"""Unit tests for Trading 212 Converter."""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

from src.main.python.converters.trading212_converter import Trading212Converter
from src.main.python.models.standard_transaction import TransactionType, StandardTransaction

class TestTrading212Converter:
    """Tests for Trading 212 Converter."""
    
    @pytest.fixture
    def converter(self):
        """Create a converter instance."""
        return Trading212Converter()
        
    def test_broker_name(self, converter):
        """Test broker name property."""
        assert converter.broker_name == "Trading 212"
        
    def test_detect_confidence_exact_match(self, converter):
        """Test confidence detection with exact header match."""
        header = "Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Currency (Withholding tax),Charge amount,Stamp duty reserve tax,Notes,ID,Currency conversion fee"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 1.0
        
    def test_detect_confidence_partial_match(self, converter):
        """Test confidence detection with partial header match."""
        # Missing some columns but has key ones
        header = "Action,Time,No. of shares,Ticker"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.8
        
    def test_detect_confidence_no_match(self, converter):
        """Test confidence detection with no match."""
        header = "Date,Symbol,Quantity,Price"
        with patch("builtins.open", new_callable=MagicMock) as mock_open:
            mock_open.return_value.__enter__.return_value.readline.return_value = header
            confidence = converter.detect_confidence("dummy.csv")
            assert confidence == 0.0
        
    def test_parse_transaction_type(self, converter):
        """Test transaction type parsing."""
        assert converter._parse_transaction_type("Market buy") == TransactionType.BUY
        assert converter._parse_transaction_type("Limit buy") == TransactionType.BUY
        assert converter._parse_transaction_type("Market sell") == TransactionType.SELL
        assert converter._parse_transaction_type("Dividend (Ordinary)") == TransactionType.DIVIDEND
        assert converter._parse_transaction_type("Interest on cash") == TransactionType.INTEREST
        assert converter._parse_transaction_type("Deposit") is None
        
    def test_process_row_buy(self, converter):
        """Test processing a buy transaction row."""
        row = {
            'Action': 'Market buy',
            'Time': '2023-01-15 10:30:00',
            'ISIN': 'US0378331005',
            'Ticker': 'AAPL',
            'Name': 'Apple Inc',
            'No. of shares': '10',
            'Price / share': '150.00',
            'Currency (Price / share)': 'USD',
            'Exchange rate': '0.82',
            'Total': '1230.00',
            'Withholding tax': '0.00',
            'Stamp duty reserve tax': '0.00',
            'Currency conversion fee': '6.15',
            'ID': 'EOF123456789'
        }
        
        tx = converter._process_row(row)
        
        assert isinstance(tx, StandardTransaction)
        assert tx.transaction_type == TransactionType.BUY
        assert tx.symbol == 'AAPL'
        assert tx.date == datetime(2023, 1, 15, 10, 30)
        assert tx.quantity == Decimal('10')
        assert tx.price == Decimal('150.00')
        assert tx.transaction_currency == 'USD'
        assert tx.fx_rate_to_base == Decimal('0.82')
        assert tx.currency_conversion_fee == Decimal('6.15')
        
    def test_process_row_sell(self, converter):
        """Test processing a sell transaction row."""
        row = {
            'Action': 'Market sell',
            'Time': '2023-02-20 14:45:00',
            'Ticker': 'AAPL',
            'No. of shares': '5',
            'Price / share': '160.00',
            'Currency (Price / share)': 'USD',
            'Exchange rate': '0.83',
            'Total': '664.00'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.SELL
        assert tx.quantity == Decimal('-5') # Negative for sell
        assert tx.price == Decimal('160.00')
        
    def test_process_row_dividend(self, converter):
        """Test processing a dividend transaction row."""
        row = {
            'Action': 'Dividend (Ordinary)',
            'Time': '2023-03-01 09:00:00',
            'Ticker': 'AAPL',
            'No. of shares': '', # Empty for dividend
            'Price / share': '0.23',
            'Currency (Price / share)': 'USD',
            'Total': '1.91', # Net amount
            'Withholding tax': '0.34',
            'Exchange rate': '0.83'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.DIVIDEND
        assert tx.gross_amount == Decimal('2.25') # 1.91 + 0.34
        assert tx.withholding_tax == Decimal('0.34')
        
    def test_process_row_interest(self, converter):
        """Test processing an interest transaction row."""
        row = {
            'Action': 'Interest on cash',
            'Time': '2023-05-01 00:00:00',
            'Ticker': '',
            'Name': 'Interest',
            'No. of shares': '',
            'Price / share': '',
            'Total': '1.50',
            'Currency (Price / share)': 'GBP',
            'Exchange rate': '1.0'
        }
        
        tx = converter._process_row(row)
        
        assert tx.transaction_type == TransactionType.INTEREST
        assert tx.symbol == 'CASH'
        
    def test_process_row_deposit_ignored(self, converter):
        """Test that deposits without ticker are ignored (or handled as CASH_ADJUSTMENT)."""
        row = {
            'Action': 'Deposit',
            'Time': '2023-01-01',
            'Ticker': '',
            'Total': '1000.00'
        }
        
        tx = converter._process_row(row)
        
        # Currently we return None for deposits without ticker in _process_row
        assert tx is None


class TestTrading212RealWorldFormats:
    """Regression tests for issues found against real-world Trading 212 exports."""

    @pytest.fixture
    def converter(self):
        return Trading212Converter()

    def _row(self, **overrides):
        row = {
            'Action': 'Market buy', 'Time': '2024-05-02 10:00:00',
            'ISIN': 'GB00B03MLX29', 'Ticker': 'SHEL', 'Name': 'Shell',
            'No. of shares': '100', 'Price / share': '2500.00',
            'Currency (Price / share)': 'GBX', 'Exchange rate': 'Not available',
            'Total': '2503.75', 'Currency (Total)': 'GBP',
        }
        row.update(overrides)
        return row

    @pytest.mark.parametrize("code", ["GBX", "GBp"])
    def test_pence_prices_are_converted_to_pounds(self, converter, code):
        tx = converter._process_row(self._row(**{'Currency (Price / share)': code}))
        assert tx.transaction_currency == 'GBP'
        assert tx.price == Decimal('25.00')
        assert tx.fx_rate_to_base == Decimal('1.0')
        assert tx.gross_amount == Decimal('2500.00')

    @pytest.mark.parametrize("action", [
        "Currency conversion", "Deposit", "Withdrawal", "Card debit",
        "Spending cashback", "New card cost",
    ])
    def test_cash_movements_are_never_trades(self, converter, action):
        assert converter._parse_transaction_type(action) is None
        assert converter._process_row(self._row(Action=action)) is None

    def test_exchange_rate_quoted_as_foreign_per_gbp_is_inverted(self, converter):
        # 10 x $200 at 1.26 USD per GBP = GBP 1587.30 (the exported Total)
        tx = converter._process_row(self._row(**{
            'Action': 'Market sell', 'Ticker': 'AAPL', 'ISIN': 'US0378331005',
            'No. of shares': '10', 'Price / share': '200.00',
            'Currency (Price / share)': 'USD', 'Exchange rate': '1.26',
            'Total': '1587.30',
        }))
        assert tx.fx_rate_to_base == pytest.approx(Decimal('0.79365'), abs=Decimal('0.0001'))
        assert tx.gross_amount_base == pytest.approx(Decimal('1587.30'), abs=Decimal('0.1'))

    def test_exchange_rate_quoted_as_gbp_per_unit_is_kept(self, converter):
        tx = converter._process_row(self._row(**{
            'Ticker': 'AAPL', 'No. of shares': '10', 'Price / share': '150.00',
            'Currency (Price / share)': 'USD', 'Exchange rate': '0.82',
            'Total': '1230.00',
        }))
        assert tx.fx_rate_to_base == Decimal('0.82')

    def test_unclear_exchange_rate_evidence_keeps_exported_rate(self, converter):
        # Total in a non-GBP currency: cannot infer direction, keep as exported
        tx = converter._process_row(self._row(**{
            'Ticker': 'AAPL', 'Currency (Price / share)': 'USD',
            'Exchange rate': '1.26', 'Currency (Total)': 'EUR', 'Total': '999',
        }))
        assert tx.fx_rate_to_base == Decimal('1.26')

    @pytest.mark.parametrize("value", [
        "2024-05-02 10:00:00", "2024-05-02 10:00:00.123",
        "2024-05-02T10:00:00Z", "2024-05-02T10:00:00.123Z", "2024-05-02",
    ])
    def test_date_formats(self, converter, value):
        assert converter._process_row(self._row(Time=value)).date.date().isoformat() == "2024-05-02"

    def test_row_with_empty_time_is_skipped(self, converter):
        assert converter._process_row(self._row(Time='')) is None

    def test_realistic_export_end_to_end(self):
        path = "tests/data/trading212/export_realistic.csv"
        conv = Trading212Converter()
        assert conv.detect_confidence(path) == 1.0
        txs = conv.convert(path)
        assert [t.symbol for t in txs] == ['AAPL', 'RDSA', 'AAPL', 'RDSA']  # no phantom trade
        assert txs[0].fx_rate_to_base == pytest.approx(Decimal('0.8'), abs=Decimal('0.001'))

    def test_utf8_bom_file(self, tmp_path):
        src = open("tests/data/trading212/export_realistic.csv", encoding="utf-8").read()
        f = tmp_path / "bom.csv"
        f.write_text(src, encoding="utf-8-sig")
        assert len(Trading212Converter().convert(str(f))) == 4
