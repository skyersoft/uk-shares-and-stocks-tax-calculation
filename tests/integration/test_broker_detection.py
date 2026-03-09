"""Integration tests for broker detection in deployment context.

These tests verify the broker detection logic works correctly
when integrated with the actual converter system.
"""
import pytest
import tempfile
from pathlib import Path

# Import from the actual source
from src.main.python.converters.converter_factory import get_factory, reset_factory
from src.main.python.converters import register_default_converters


class TestBrokerDetectionIntegration:
    """Integration tests for broker detection with real converters."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register converters before each test and reset after."""
        reset_factory()  # Start fresh
        register_default_converters()
        yield
        # No cleanup needed - next test will reset
    
    @pytest.fixture
    def sample_ibkr_csv(self, tmp_path):
        """Create a sample IBKR CSV file."""
        csv_content = """Symbol,Quantity,TradePrice,TradeDate,SettleDate,IBCommission,Code,AssetClass,FXRateToBase
AAPL,10,150.00,2024-01-15,2024-01-17,5.00,O,STK,0.79
MSFT,-5,300.00,2024-03-20,2024-03-22,5.00,C,STK,0.79
"""
        file_path = tmp_path / "ibkr_trades.csv"
        file_path.write_text(csv_content)
        return str(file_path)
    
    @pytest.fixture
    def sample_trading212_csv(self, tmp_path):
        """Create a sample Trading 212 CSV file."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Currency (Withholding tax),Charge amount,Stamp duty reserve tax,Notes,ID,Currency conversion fee
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00,,,5.00,,,123456,6.15
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc.,-5,160.00,USD,0.80,800.00,640.00,,,5.00,,,123457,4.00
"""
        file_path = tmp_path / "trading212_export.csv"
        file_path.write_text(csv_content)
        return str(file_path)
    
    def test_detect_ibkr_broker(self, sample_ibkr_csv):
        """Test detecting IBKR broker from CSV file."""
        factory = get_factory()
        detection = factory.detect_broker(sample_ibkr_csv, min_confidence=0.5)
        
        assert detection is not None
        assert detection['broker'] == 'Interactive Brokers'
        assert detection['confidence'] >= 0.8
        assert 'converter' in detection
    
    def test_detect_trading212_broker(self, sample_trading212_csv):
        """Test detecting Trading 212 broker from CSV file."""
        factory = get_factory()
        detection = factory.detect_broker(sample_trading212_csv, min_confidence=0.5)
        
        assert detection is not None
        assert detection['broker'] == 'Trading 212'
        assert detection['confidence'] >= 0.8
        assert 'converter' in detection
    
    def test_convert_after_detection_ibkr(self, sample_ibkr_csv):
        """Test converting file after detection (IBKR)."""
        factory = get_factory()
        detection = factory.detect_broker(sample_ibkr_csv)
        
        assert detection is not None
        converter = detection['converter']
        
        # Convert the file
        transactions = converter.convert(sample_ibkr_csv, base_currency="GBP")
        
        assert len(transactions) == 2
        assert transactions[0].symbol == "AAPL"
        assert transactions[1].symbol == "MSFT"
    
    def test_convert_after_detection_trading212(self, sample_trading212_csv):
        """Test converting file after detection (Trading 212)."""
        factory = get_factory()
        detection = factory.detect_broker(sample_trading212_csv)
        
        assert detection is not None
        converter = detection['converter']
        
        # Convert the file
        transactions = converter.convert(sample_trading212_csv, base_currency="GBP")
        
        assert len(transactions) == 2
        assert transactions[0].symbol == "AAPL"
        assert transactions[1].symbol == "AAPL"
    
    def test_validation_before_conversion(self, sample_trading212_csv):
        """Test file validation before conversion."""
        factory = get_factory()
        detection = factory.detect_broker(sample_trading212_csv)
        
        assert detection is not None
        converter = detection['converter']
        
        # Validate file structure
        validation = converter.validate_file_structure(sample_trading212_csv)
        
        assert validation['valid'] is True
        assert validation['broker_detected'] == 'Trading 212'
        assert validation['confidence'] >= 0.8
        assert 'row_count' in validation
    
    def test_detect_broker_with_invalid_file(self, tmp_path):
        """Test broker detection with invalid file."""
        invalid_file = tmp_path / "invalid.csv"
        invalid_file.write_text("This is not a valid broker CSV file\nJust random data\n")
        
        factory = get_factory()
        detection = factory.detect_broker(str(invalid_file), min_confidence=0.5)
        
        # Should return None for undetectable files
        assert detection is None
    
    def test_list_supported_brokers(self):
        """Test listing supported brokers."""
        factory = get_factory()
        brokers = factory.list_brokers()
        
        assert 'Interactive Brokers' in brokers
        assert 'Trading 212' in brokers
        assert len(brokers) >= 2
    
    def test_get_converter_by_name(self):
        """Test getting converter by broker name."""
        factory = get_factory()
        
        ibkr_converter = factory.get_converter('Interactive Brokers')
        assert ibkr_converter.broker_name == 'Interactive Brokers'
        
        t212_converter = factory.get_converter('Trading 212')
        assert t212_converter.broker_name == 'Trading 212'
    
    def test_detection_with_alternatives(self, sample_trading212_csv):
        """Test that detection includes alternative matches."""
        factory = get_factory()
        detection = factory.detect_broker(sample_trading212_csv)
        
        assert detection is not None
        assert 'alternatives' in detection
        # Alternatives should be a list (may be empty if only one match)
        assert isinstance(detection['alternatives'], list)


class TestBrokerDetectionMetadata:
    """Test metadata extraction from detected files."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register converters before each test."""
        register_default_converters()
    
    def test_transaction_count_metadata(self, tmp_path):
        """Test extracting transaction count."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00
Market buy,2024-02-20 11:00:00,US5949181045,MSFT,Microsoft Corp.,5,300.00,USD,0.80,-1500.00,-1200.00
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc.,-5,160.00,USD,0.80,800.00,640.00
"""
        
        file_path = tmp_path / "test.csv"
        file_path.write_text(csv_content)
        
        factory = get_factory()
        detection = factory.detect_broker(str(file_path))
        
        assert detection is not None
        converter = detection['converter']
        
        # Convert and count
        transactions = converter.convert(str(file_path), base_currency="GBP")
        assert len(transactions) == 3
    
    def test_date_range_extraction(self, tmp_path):
        """Test extracting date range from transactions."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00
Market buy,2024-06-20 11:00:00,US5949181045,MSFT,Microsoft Corp.,5,300.00,USD,0.80,-1500.00,-1200.00
Market sell,2024-12-20 14:45:00,US0378331005,AAPL,Apple Inc.,-5,160.00,USD,0.80,800.00,640.00
"""
        
        file_path = tmp_path / "test.csv"
        file_path.write_text(csv_content)
        
        factory = get_factory()
        detection = factory.detect_broker(str(file_path))
        
        assert detection is not None
        converter = detection['converter']
        
        # Convert and check dates
        transactions = converter.convert(str(file_path), base_currency="GBP")
        dates = [tx.date for tx in transactions if tx.date]
        
        assert len(dates) == 3
        assert min(dates).year == 2024
        assert min(dates).month == 1
        assert max(dates).month == 12


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
