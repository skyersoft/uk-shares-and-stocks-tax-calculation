"""Tests for Lambda handler broker detection functionality."""
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
import tempfile
import os

# Mock the imports that would normally come from Lambda layers
import sys
sys.path.insert(0, 'src/main/python')

from deployment.lambda_handler import (
    detect_broker_from_file,
    handle_broker_detection_request,
    handle_calculation_request
)


class TestBrokerDetection:
    """Test broker detection functionality."""
    
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
        result = detect_broker_from_file(sample_ibkr_csv)
        
        assert result['detected'] is True
        assert result['broker'] == 'Interactive Brokers'
        assert result['confidence'] >= 0.8
        assert result['validation']['valid'] is True
        assert result['metadata']['transaction_count'] > 0
    
    def test_detect_trading212_broker(self, sample_trading212_csv):
        """Test detecting Trading 212 broker from CSV file."""
        result = detect_broker_from_file(sample_trading212_csv)
        
        assert result['detected'] is True
        assert result['broker'] == 'Trading 212'
        assert result['confidence'] >= 0.8
        assert result['validation']['valid'] is True
        assert result['metadata']['transaction_count'] > 0
    
    def test_detect_broker_with_invalid_file(self, tmp_path):
        """Test broker detection with invalid file."""
        invalid_file = tmp_path / "invalid.csv"
        invalid_file.write_text("This is not a valid broker CSV file\nJust random data")
        
        result = detect_broker_from_file(str(invalid_file))
        
        assert result['detected'] is False
        assert 'error' in result
    
    def test_detect_broker_transaction_preview(self, sample_trading212_csv):
        """Test that broker detection includes transaction preview."""
        result = detect_broker_from_file(sample_trading212_csv)
        
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
        result = detect_broker_from_file(sample_trading212_csv)
        
        assert result['detected'] is True
        assert result['metadata']['date_range'] is not None
        assert 'start' in result['metadata']['date_range']
        assert 'end' in result['metadata']['date_range']


class TestBrokerDetectionEndpoint:
    """Test the /detect-broker endpoint."""
    
    def test_handle_broker_detection_request_success(self):
        """Test successful broker detection request."""
        # Create mock event with multipart form data
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00
"""
        
        # Mock multipart data
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        body = f"""------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Disposition: form-data; name="file"; filename="test.csv"\r
Content-Type: text/csv\r
\r
{csv_content}\r
------WebKitFormBoundary7MA4YWxkTrZu0gW--\r
"""
        
        event = {
            'httpMethod': 'POST',
            'path': '/detect-broker',
            'headers': {
                'content-type': f'multipart/form-data; boundary={boundary}'
            },
            'body': body,
            'isBase64Encoded': False
        }
        
        with patch('deployment.lambda_handler.parse_multipart_data_proper') as mock_parse:
            mock_parse.return_value = (csv_content, None, None, 'test.csv')
            
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
            mock_parse.return_value = ('', None, None, '')
            
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
    
    def test_calculation_includes_broker_metadata(self):
        """Test that calculation response includes broker metadata for CSV files."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc.,-5,160.00,USD,0.80,800.00,640.00
"""
        
        event = {
            'httpMethod': 'POST',
            'path': '/calculate',
            'headers': {
                'content-type': 'multipart/form-data; boundary=test'
            },
            'body': '',
            'isBase64Encoded': False
        }
        
        with patch('deployment.lambda_handler.parse_multipart_data_proper') as mock_parse, \
             patch('deployment.lambda_handler.create_enhanced_calculator') as mock_calc:
            
            mock_parse.return_value = (csv_content, '2024-2025', 'both', 'test.csv')
            
            # Mock calculator
            mock_calculator_instance = Mock()
            mock_calculator_instance.calculate_comprehensive_analysis.return_value = {
                'tax_analysis': {'total_gain': 100}
            }
            mock_calc.return_value = mock_calculator_instance
            
            response = handle_calculation_request(event)
            
            assert response['statusCode'] == 200
            body_data = json.loads(response['body'])
            
            # Should include broker metadata
            assert 'broker_metadata' in body_data
            assert body_data['broker_metadata']['broker'] in ['Interactive Brokers', 'Trading 212']
            assert 'confidence' in body_data['broker_metadata']
            assert 'transaction_count' in body_data['broker_metadata']
    
    def test_calculation_fails_on_undetected_broker(self):
        """Test that calculation fails gracefully when broker cannot be detected."""
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
            mock_parse.return_value = (invalid_csv, '2024-2025', 'both', 'invalid.csv')
            
            response = handle_calculation_request(event)
            
            assert response['statusCode'] == 400
            body_data = json.loads(response['body'])
            assert 'error' in body_data
            assert body_data['error'] == 'Broker detection failed'


class TestBrokerDetectionMetadata:
    """Test broker detection metadata extraction."""
    
    def test_metadata_includes_all_fields(self, tmp_path):
        """Test that metadata includes all expected fields."""
        csv_content = """Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Total
Market buy,2024-01-15 10:30:00,US0378331005,AAPL,Apple Inc.,10,150.00,USD,0.82,-1500.00,-1230.00
Market buy,2024-02-20 11:00:00,US5949181045,MSFT,Microsoft Corp.,5,300.00,USD,0.80,-1500.00,-1200.00
Market sell,2024-03-20 14:45:00,US0378331005,AAPL,Apple Inc.,-5,160.00,USD,0.80,800.00,640.00
"""
        
        file_path = tmp_path / "test.csv"
        file_path.write_text(csv_content)
        
        result = detect_broker_from_file(str(file_path))
        
        assert result['detected'] is True
        
        # Check all metadata fields
        metadata = result['metadata']
        assert 'transaction_count' in metadata
        assert metadata['transaction_count'] == 3
        
        assert 'date_range' in metadata
        assert metadata['date_range'] is not None
        assert metadata['date_range']['start'] == '2024-01-15'
        assert metadata['date_range']['end'] == '2024-03-20'
        
        assert 'transaction_preview' in metadata
        assert len(metadata['transaction_preview']) <= 5  # Max 5 preview items
    
    def test_validation_errors_included(self, tmp_path):
        """Test that validation errors are included in response."""
        # Create CSV with missing required columns
        invalid_csv = """Action,Time
Buy,2024-01-15
"""
        
        file_path = tmp_path / "invalid.csv"
        file_path.write_text(invalid_csv)
        
        result = detect_broker_from_file(str(file_path))
        
        # Should still attempt detection but may have validation errors
        if result['detected']:
            assert 'validation' in result
            validation = result['validation']
            assert 'valid' in validation
            assert 'errors' in validation or 'warnings' in validation


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
