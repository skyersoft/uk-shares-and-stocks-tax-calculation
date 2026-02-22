"""Tests for Lambda handler broker detection functionality.

These tests verify the broker detection logic by using the actual converter
infrastructure (from src.main.python) to detect brokers from CSV files.
"""
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
import tempfile
import os

from src.main.python.converters import register_default_converters
from src.main.python.converters.converter_factory import get_factory

# Ensure converters are registered
register_default_converters()

import deployment.lambda_handler as lambda_handler_module

from deployment.lambda_handler import (
    handle_broker_detection_request,
    handle_calculation_request
)


@pytest.fixture(autouse=True)
def patch_lambda_converters():
    """Patch CONVERTERS_AVAILABLE and get_factory for all tests in this module.
    
    The lambda_handler imports from 'main.python.*' (Lambda Layer path) which
    doesn't resolve in the test environment. We patch the module state so 
    detect_broker_from_file works correctly.
    
    We call register_default_converters() inside the fixture (not just at
    module level) to handle test ordering issues where the factory singleton
    may have been recreated by other test modules.
    """
    register_default_converters()
    with patch.object(lambda_handler_module, 'CONVERTERS_AVAILABLE', True), \
         patch.object(lambda_handler_module, 'get_factory', get_factory, create=True):
        yield


class TestBrokerDetection:
    """Test broker detection functionality."""

    @pytest.fixture
    def sample_ibkr_csv(self, tmp_path):
        """Create a sample IBKR CSV file with correct IBKR columns."""
        csv_content = """Symbol,Quantity,TradePrice,TradeDate,SettleDate,IBCommission,Code,AssetClass,FXRateToBase
AAPL,10,150.00,2024-01-15,2024-01-17,5.00,O,STK,0.79
MSFT,-5,300.00,2024-03-20,2024-03-22,5.00,C,STK,0.79
"""
        file_path = tmp_path / "ibkr_trades.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    @pytest.fixture
    def sample_trading212_csv(self, tmp_path):
        """Create a sample Trading 212 CSV file matching actual format."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Stamp duty reserve tax,Currency conversion fee
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc,10,150.00,USD,0.82,0.00,1175.00,0.00,0.00,5.00
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc,-5,160.00,USD,0.80,800.00,640.00,0.00,0.00,4.00
"""
        file_path = tmp_path / "trading212_export.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    @pytest.fixture
    def sample_freetrade_csv(self, tmp_path):
        """Create a sample Freetrade CSV file matching actual format."""
        csv_content = """Date,Type,Symbol,Quantity,Price,Fees,Currency,Name
2024-01-15,BUY,AAPL,10,150.00,1.50,USD,Apple Inc
2024-03-20,SELL,AAPL,5,160.00,1.50,USD,Apple Inc
"""
        file_path = tmp_path / "freetrade_export.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    def test_detect_ibkr_broker(self, sample_ibkr_csv):
        """Test detecting IBKR broker from CSV file."""
        result = lambda_handler_module.detect_broker_from_file(sample_ibkr_csv)

        assert result['detected'] is True
        assert result['broker'] == 'Interactive Brokers'
        assert result['confidence'] >= 0.8

    def test_detect_trading212_broker(self, sample_trading212_csv):
        """Test detecting Trading 212 broker from CSV file."""
        result = lambda_handler_module.detect_broker_from_file(sample_trading212_csv)

        assert result['detected'] is True
        assert result['broker'] == 'Trading 212'
        assert result['confidence'] >= 0.8

    def test_detect_freetrade_broker(self, sample_freetrade_csv):
        """Test detecting Freetrade broker from CSV file."""
        result = lambda_handler_module.detect_broker_from_file(sample_freetrade_csv)

        assert result['detected'] is True
        assert result['broker'] == 'Freetrade'
        assert result['confidence'] >= 0.5

    def test_detect_broker_with_invalid_file(self, tmp_path):
        """Test broker detection with invalid file."""
        invalid_file = tmp_path / "invalid.csv"
        invalid_file.write_text("This is not a valid broker CSV file\nJust random data")

        result = lambda_handler_module.detect_broker_from_file(str(invalid_file))

        assert result['detected'] is False
        assert 'error' in result

    def test_detect_broker_transaction_preview(self, sample_trading212_csv):
        """Test that broker detection includes transaction preview."""
        result = lambda_handler_module.detect_broker_from_file(sample_trading212_csv)

        assert result['detected'] is True
        assert 'transaction_preview' in result['metadata']
        assert len(result['metadata']['transaction_preview']) > 0

        # Check preview structure
        preview = result['metadata']['transaction_preview'][0]
        assert 'date' in preview
        assert 'symbol' in preview
        assert 'type' in preview
        assert 'quantity' in preview
        assert 'price' in preview

    def test_detect_broker_date_range(self, sample_trading212_csv):
        """Test that broker detection includes date range."""
        result = lambda_handler_module.detect_broker_from_file(sample_trading212_csv)

        assert result['detected'] is True
        assert result['metadata']['date_range'] is not None
        assert 'start' in result['metadata']['date_range']
        assert 'end' in result['metadata']['date_range']


class TestBrokerDetectionEndpoint:
    """Test the /detect-broker endpoint."""

    def test_handle_broker_detection_request_success(self):
        """Test successful broker detection request."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Stamp duty reserve tax,Currency conversion fee
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc,10,150.00,USD,0.82,0.00,1175.00,0.00,0.00,5.00
"""

        event = {
            'httpMethod': 'POST',
            'path': '/detect-broker',
            'headers': {
                'content-type': 'multipart/form-data; boundary=test'
            },
            'body': '',
            'isBase64Encoded': False
        }

        with patch('deployment.lambda_handler.parse_multipart_data_proper') as mock_parse:
            mock_parse.return_value = (
                [{'content': csv_content, 'filename': 'test.csv'}],
                None,
                None
            )

            response = handle_broker_detection_request(event)

            assert response['statusCode'] == 200
            body_data = json.loads(response['body'])
            assert 'detected' in body_data
            assert 'filename' in body_data
            assert body_data['filename'] == 'test.csv'

    def test_handle_broker_detection_request_no_file(self):
        """Test broker detection request with no file."""
        event = {
            'httpMethod': 'POST',
            'path': '/detect-broker',
            'headers': {
                'content-type': 'multipart/form-data; boundary=test'
            },
            'body': '',
            'isBase64Encoded': False
        }

        with patch('deployment.lambda_handler.parse_multipart_data_proper') as mock_parse:
            mock_parse.return_value = ([], None, None)

            response = handle_broker_detection_request(event)

            assert response['statusCode'] == 400
            body_data = json.loads(response['body'])
            assert 'error' in body_data

    def test_handle_broker_detection_request_invalid_content_type(self):
        """Test broker detection request with invalid content type."""
        event = {
            'httpMethod': 'POST',
            'path': '/detect-broker',
            'headers': {
                'content-type': 'application/json'
            },
            'body': '{}',
            'isBase64Encoded': False
        }

        response = handle_broker_detection_request(event)

        assert response['statusCode'] == 400
        body_data = json.loads(response['body'])
        assert 'error' in body_data


class TestCalculationWithBrokerDetection:
    """Test the enhanced /calculate endpoint with broker detection."""

    def test_calculation_fails_on_undetected_broker(self):
        """Test that calculation handles undetected broker gracefully."""
        invalid_csv = "Invalid,CSV,Data\n1,2,3"

        event = {
            'httpMethod': 'POST',
            'path': '/calculate',
            'headers': {
                'content-type': 'multipart/form-data; boundary=test'
            },
            'body': '',
            'isBase64Encoded': False
        }

        with patch('deployment.lambda_handler.parse_multipart_data_proper') as mock_parse:
            mock_parse.return_value = (
                [{'content': invalid_csv, 'filename': 'invalid.csv'}],
                '2024-2025',
                'both'
            )

            response = handle_calculation_request(event)

            # Should return an error since broker can't be detected
            assert response['statusCode'] in [400, 500, 503]
            body_data = json.loads(response['body'])
            assert 'error' in body_data


class TestBrokerDetectionMetadata:
    """Test broker detection metadata extraction."""

    def test_metadata_includes_all_fields(self, tmp_path):
        """Test that metadata includes all expected fields."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total,Withholding tax,Stamp duty reserve tax,Currency conversion fee
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc,10,150.00,USD,0.82,0.00,1175.00,0.00,0.00,5.00
Market buy,2024-02-20 11:00:00,US5949181045,MSFT,Microsoft Corp,5,300.00,USD,0.80,0.00,1200.00,0.00,0.00,4.00
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc,-5,160.00,USD,0.80,800.00,640.00,0.00,0.00,4.00
"""

        file_path = tmp_path / "test.csv"
        file_path.write_text(csv_content)

        result = lambda_handler_module.detect_broker_from_file(str(file_path))

        assert result['detected'] is True

        metadata = result['metadata']
        assert 'transaction_count' in metadata
        assert metadata['transaction_count'] == 3

        assert 'date_range' in metadata
        assert metadata['date_range'] is not None

        assert 'transaction_preview' in metadata
        assert len(metadata['transaction_preview']) <= 5

    def test_validation_errors_included(self, tmp_path):
        """Test that validation errors are included in response."""
        invalid_csv = """Action,Time
Buy,2024-01-15
"""

        file_path = tmp_path / "invalid.csv"
        file_path.write_text(invalid_csv)

        result = lambda_handler_module.detect_broker_from_file(str(file_path))

        if result['detected']:
            assert 'validation' in result
            validation = result['validation']
            assert 'valid' in validation
            assert 'errors' in validation or 'warnings' in validation


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
