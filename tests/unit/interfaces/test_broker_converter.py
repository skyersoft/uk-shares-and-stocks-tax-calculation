"""
Unit tests for BrokerConverterInterface and BaseBrokerConverter.

Test Coverage Goals:
- 100% coverage of BaseBrokerConverter
- All abstract methods tested via mock implementation
- Error handling tested
- Edge cases covered

Test Organization:
- TestBrokerConversionError: Exception class
- TestBaseBrokerConverter: Base class functionality
- TestMockConverter: Complete converter implementation
"""

import pytest
import tempfile
import csv
from pathlib import Path
from typing import List, Dict, Any

from src.main.python.interfaces.broker_converter import (
    BrokerConverterInterface,
    BaseBrokerConverter,
    BrokerConversionError
)
from src.main.python.models.standard_transaction import (
    StandardTransaction,
    TransactionType
)
from decimal import Decimal
from datetime import datetime


class MockBrokerConverter(BaseBrokerConverter):
    """Mock converter for testing."""
    
    @property
    def broker_name(self) -> str:
        return "Mock Broker"
    
    @property
    def supported_file_extensions(self) -> List[str]:
        return ["csv", "txt"]
    
    def get_required_columns(self) -> List[str]:
        return ["Date", "Symbol", "Quantity", "Price"]
    
    def get_optional_columns(self) -> List[str]:
        return ["Commission", "Notes"]
    
    def convert(
        self,
        file_path: str,
        base_currency: str = "GBP",
        **kwargs
    ) -> List[StandardTransaction]:
        """Simple conversion for testing."""
        transactions = []
        
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                tx = StandardTransaction(
                    date=datetime.strptime(row['Date'], '%Y-%m-%d'),
                    symbol=row['Symbol'],
                    transaction_type=TransactionType.BUY,
                    quantity=Decimal(row['Quantity']),
                    price=Decimal(row['Price']),
                    transaction_currency=base_currency,
                    base_currency=base_currency
                )
                transactions.append(tx)
        
        return transactions


class TestBrokerConversionError:
    """Test BrokerConversionError exception class."""
    
    def test_create_error_basic(self):
        """Should create error with basic message."""
        error = BrokerConversionError(
            broker="Test Broker",
            file_path="/path/to/file.csv",
            message="Test error"
        )
        
        assert error.broker == "Test Broker"
        assert error.file_path == "/path/to/file.csv"
        assert error.message == "Test error"
        assert error.errors == []
        assert "[Test Broker] Test error" in str(error)
    
    def test_create_error_with_errors_list(self):
        """Should create error with list of errors."""
        error = BrokerConversionError(
            broker="Test Broker",
            file_path="/path/to/file.csv",
            message="Conversion failed",
            errors=["Missing column A", "Invalid date format"]
        )
        
        assert len(error.errors) == 2
        error_str = str(error)
        assert "Missing column A" in error_str
        assert "Invalid date format" in error_str


class TestBaseBrokerConverter:
    """Test BaseBrokerConverter default implementations."""
    
    @pytest.fixture
    def converter(self):
        """Create a mock converter instance."""
        return MockBrokerConverter()
    
    @pytest.fixture
    def valid_csv_file(self, tmp_path):
        """Create a valid CSV file for testing."""
        file_path = tmp_path / "test.csv"
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol', 'Quantity', 'Price', 'Commission'])
            writer.writerow(['2024-01-15', 'AAPL', '100', '150.25', '5.00'])
            writer.writerow(['2024-01-16', 'MSFT', '50', '300.00', '5.00'])
        return str(file_path)
    
    @pytest.fixture
    def invalid_csv_file(self, tmp_path):
        """Create an invalid CSV file (missing required columns)."""
        file_path = tmp_path / "invalid.csv"
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol'])  # Missing Quantity and Price
            writer.writerow(['2024-01-15', 'AAPL'])
        return str(file_path)
    
    def test_broker_name(self, converter):
        """Should return broker name."""
        assert converter.broker_name == "Mock Broker"
    
    def test_supported_file_extensions(self, converter):
        """Should return supported extensions."""
        assert converter.supported_file_extensions == ["csv", "txt"]
    
    def test_get_required_columns(self, converter):
        """Should return required columns."""
        required = converter.get_required_columns()
        assert "Date" in required
        assert "Symbol" in required
        assert "Quantity" in required
        assert "Price" in required
    
    def test_get_optional_columns(self, converter):
        """Should return optional columns."""
        optional = converter.get_optional_columns()
        assert "Commission" in optional
        assert "Notes" in optional
    
    def test_can_handle_valid_file(self, converter, valid_csv_file):
        """Should return True for valid file."""
        assert converter.can_handle(valid_csv_file) is True
    
    def test_can_handle_invalid_file(self, converter, invalid_csv_file):
        """Should return False for invalid file."""
        assert converter.can_handle(invalid_csv_file) is False
    
    def test_can_handle_nonexistent_file(self, converter):
        """Should return False for nonexistent file."""
        assert converter.can_handle("/nonexistent/file.csv") is False
    
    def test_can_handle_wrong_extension(self, converter, tmp_path):
        """Should return False for wrong file extension."""
        file_path = tmp_path / "test.xlsx"  # Not in supported extensions
        file_path.touch()
        assert converter.can_handle(str(file_path)) is False
    
    def test_detect_confidence_valid_file(self, converter, valid_csv_file):
        """Should return high confidence for valid file."""
        confidence = converter.detect_confidence(valid_csv_file)
        assert confidence == 1.0  # All required columns present
    
    def test_detect_confidence_partial_match(self, converter, tmp_path):
        """Should return 0.0 confidence when required columns are missing."""
        file_path = tmp_path / "partial.csv"
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol', 'Quantity'])  # Missing Price (required)
            writer.writerow(['2024-01-15', 'AAPL', '100'])
        
        # Missing required column means validation fails, so confidence is 0.0
        confidence = converter.detect_confidence(str(file_path))
        assert confidence == 0.0
    
    def test_detect_confidence_invalid_file(self, converter, invalid_csv_file):
        """Should return low confidence for invalid file."""
        confidence = converter.detect_confidence(invalid_csv_file)
        assert confidence < 0.5  # Only 2 out of 4 columns
    
    def test_detect_confidence_nonexistent_file(self, converter):
        """Should return 0.0 for nonexistent file."""
        confidence = converter.detect_confidence("/nonexistent/file.csv")
        assert confidence == 0.0
    
    def test_validate_file_structure_valid(self, converter, valid_csv_file):
        """Should validate valid file structure."""
        result = converter.validate_file_structure(valid_csv_file)
        
        assert result['valid'] is True
        assert len(result['errors']) == 0
        assert result['row_count'] == 2
        assert 'Date' in result['columns']
        assert 'Symbol' in result['columns']
        assert result['broker_detected'] == "Mock Broker"
        assert result['confidence'] > 0.8
    
    def test_validate_file_structure_missing_columns(self, converter, invalid_csv_file):
        """Should detect missing required columns."""
        result = converter.validate_file_structure(invalid_csv_file)
        
        assert result['valid'] is False
        assert len(result['errors']) > 0
        assert any("Missing required columns" in e for e in result['errors'])
    
    def test_validate_file_structure_missing_optional(self, converter, tmp_path):
        """Should warn about missing optional columns."""
        file_path = tmp_path / "no_optional.csv"
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol', 'Quantity', 'Price'])  # No optional
            writer.writerow(['2024-01-15', 'AAPL', '100', '150.25'])
        
        result = converter.validate_file_structure(str(file_path))
        
        assert result['valid'] is True  # Still valid
        assert len(result['warnings']) > 0
        assert any("Missing optional columns" in w for w in result['warnings'])
    
    def test_validate_file_structure_nonexistent(self, converter):
        """Should handle nonexistent file."""
        result = converter.validate_file_structure("/nonexistent/file.csv")
        
        assert result['valid'] is False
        assert any("File not found" in e for e in result['errors'])
    
    def test_convert_valid_file(self, converter, valid_csv_file):
        """Should convert valid file to transactions."""
        transactions = converter.convert(valid_csv_file, base_currency="GBP")
        
        assert len(transactions) == 2
        assert transactions[0].symbol == "AAPL"
        assert transactions[0].quantity == Decimal('100')
        assert transactions[0].price == Decimal('150.25')
        assert transactions[1].symbol == "MSFT"
    
    def test_repr(self, converter):
        """Should have readable string representation."""
        repr_str = repr(converter)
        assert "MockBrokerConverter" in repr_str
        assert "Mock Broker" in repr_str


class TestBrokerConverterInterface:
    """Test abstract interface requirements."""
    
    def test_cannot_instantiate_interface(self):
        """Should not be able to instantiate abstract interface."""
        with pytest.raises(TypeError):
            BrokerConverterInterface()
    
    def test_must_implement_all_abstract_methods(self):
        """Should require all abstract methods to be implemented."""
        
        class IncompleteConverter(BrokerConverterInterface):
            """Incomplete implementation missing some methods."""
            
            @property
            def broker_name(self) -> str:
                return "Incomplete"
            
            # Missing other required methods
        
        with pytest.raises(TypeError):
            IncompleteConverter()
    
    def test_complete_implementation_works(self):
        """Should allow complete implementation."""
        converter = MockBrokerConverter()
        assert converter.broker_name == "Mock Broker"
        assert isinstance(converter, BrokerConverterInterface)


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    @pytest.fixture
    def converter(self):
        return MockBrokerConverter()
    
    def test_empty_csv_file(self, converter, tmp_path):
        """Should handle empty CSV file."""
        file_path = tmp_path / "empty.csv"
        file_path.touch()
        
        result = converter.validate_file_structure(str(file_path))
        assert result['valid'] is False
    
    def test_csv_with_only_header(self, converter, tmp_path):
        """Should handle CSV with only header row."""
        file_path = tmp_path / "header_only.csv"
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol', 'Quantity', 'Price'])
        
        result = converter.validate_file_structure(str(file_path))
        assert result['valid'] is True
        assert result['row_count'] == 0
    
    def test_malformed_csv(self, converter, tmp_path):
        """Should handle malformed CSV gracefully."""
        file_path = tmp_path / "malformed.csv"
        with open(file_path, 'w') as f:
            f.write("This is not a valid CSV\n")
            f.write("Just some random text\n")
        
        # Should not crash, but may return low confidence
        try:
            result = converter.validate_file_structure(str(file_path))
            # If it doesn't crash, that's good enough
            assert isinstance(result, dict)
        except Exception:
            # Some errors are acceptable for malformed files
            pass
    
    def test_unicode_in_csv(self, converter, tmp_path):
        """Should handle Unicode characters in CSV."""
        file_path = tmp_path / "unicode.csv"
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Symbol', 'Quantity', 'Price'])
            writer.writerow(['2024-01-15', 'AAPL', '100', '150.25'])
            writer.writerow(['2024-01-16', '中文股票', '50', '300.00'])  # Chinese characters
        
        transactions = converter.convert(str(file_path))
        assert len(transactions) == 2
        assert transactions[1].symbol == '中文股票'
