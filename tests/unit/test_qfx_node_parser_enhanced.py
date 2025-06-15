"""Enhanced unit tests for QFX node parser with timezone-aware date parsing."""
import pytest
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement

from src.main.python.parsers.qfx_node_parser import QfxNodeParser


class TestQfxNodeParserEnhanced:
    """Enhanced tests for QFX node parser focusing on date parsing improvements."""
    
    def test_parse_timezone_aware_dates(self):
        """Test parsing dates with timezone information (Task 8.4)."""
        parser = QfxNodeParser()
        
        # Create test node with timezone-aware date
        invtran = Element("INVTRAN")
        SubElement(invtran, "FITID").text = "test123"
        SubElement(invtran, "DTTRADE").text = "20250218153851.000[-5:EST]"
        SubElement(invtran, "MEMO").text = "Test transaction"
        
        # Parse the transaction details
        result = parser.parse_transaction_details(invtran)
        
        # Should successfully parse the date
        assert result["date"] is not None, "Date should be parsed successfully"
        assert isinstance(result["date"], datetime), "Date should be datetime object"
        
        # Verify the parsed date components
        expected_date = datetime(2025, 2, 18, 15, 38, 51)
        assert result["date"] == expected_date, f"Expected {expected_date}, got {result['date']}"
        
        # Verify other fields
        assert result["id"] == "test123"
        assert result["memo"] == "Test transaction"
    
    def test_parse_various_date_formats(self):
        """Test parsing various QFX date formats."""
        parser = QfxNodeParser()
        
        test_cases = [
            # Format: (date_string, expected_datetime)
            ("20240820", datetime(2024, 8, 20)),
            ("20240820092430", datetime(2024, 8, 20, 9, 24, 30)),
            ("20240820092430.000", datetime(2024, 8, 20, 9, 24, 30)),
            ("20240820092430.000[-4:EDT]", datetime(2024, 8, 20, 9, 24, 30)),
            ("20250127105305.000[-5:EST]", datetime(2025, 1, 27, 10, 53, 5)),
            ("20241213104102.000[-5:EST]", datetime(2024, 12, 13, 10, 41, 2)),
        ]
        
        for date_string, expected_date in test_cases:
            # Create test node
            invtran = Element("INVTRAN")
            SubElement(invtran, "FITID").text = "test123"
            SubElement(invtran, "DTTRADE").text = date_string
            SubElement(invtran, "MEMO").text = "Test"
            
            # Parse the transaction details
            result = parser.parse_transaction_details(invtran)
            
            # Verify the date was parsed correctly
            assert result["date"] is not None, f"Date should be parsed for format: {date_string}"
            assert result["date"] == expected_date, f"Expected {expected_date} for {date_string}, got {result['date']}"
    
    def test_parse_header_with_timezone_dates(self):
        """Test parsing header dates with timezone information."""
        parser = QfxNodeParser()
        
        # Create test header node with timezone-aware date
        root = Element("OFX")
        signonmsgsrsv1 = SubElement(root, "SIGNONMSGSRSV1")
        sonrs = SubElement(signonmsgsrsv1, "SONRS")
        
        status = SubElement(sonrs, "STATUS")
        SubElement(status, "CODE").text = "0"
        SubElement(status, "SEVERITY").text = "INFO"
        
        SubElement(sonrs, "DTSERVER").text = "20240820092430.000[-4:EDT]"
        
        fi = SubElement(sonrs, "FI")
        SubElement(fi, "ORG").text = "Interactive Brokers"
        
        # Parse the header
        result = parser.parse_header(root)
        
        # Should successfully parse the date
        assert result["date"] is not None, "Header date should be parsed successfully"
        assert isinstance(result["date"], datetime), "Header date should be datetime object"
        
        # Verify the parsed date
        expected_date = datetime(2024, 8, 20, 9, 24, 30)
        assert result["date"] == expected_date, f"Expected {expected_date}, got {result['date']}"
        
        # Verify other fields
        assert result["code"] == "0"
        assert result["severity"] == "INFO"
        assert result["broker"] == "Interactive Brokers"
    
    def test_parse_invalid_date_formats_gracefully(self):
        """Test that invalid date formats are handled gracefully."""
        parser = QfxNodeParser()
        
        invalid_dates = [
            "invalid-date",
            "2024-08-20",  # Wrong format
            "20240820T092430Z",  # ISO format not supported
            "",  # Empty string
            "20241301",  # Invalid month
        ]
        
        for invalid_date in invalid_dates:
            # Create test node
            invtran = Element("INVTRAN")
            SubElement(invtran, "FITID").text = "test123"
            SubElement(invtran, "DTTRADE").text = invalid_date
            SubElement(invtran, "MEMO").text = "Test"
            
            # Parse the transaction details
            result = parser.parse_transaction_details(invtran)
            
            # Should handle gracefully by setting date to None
            assert result["date"] is None, f"Invalid date {invalid_date} should result in None"
            assert result["id"] == "test123", "Other fields should still be parsed"
            assert result["memo"] == "Test", "Other fields should still be parsed"
    
    def test_parse_edge_case_dates(self):
        """Test parsing edge case dates."""
        parser = QfxNodeParser()
        
        edge_cases = [
            # Format: (date_string, expected_datetime)
            ("20240229", datetime(2024, 2, 29)),  # Leap year
            ("20231231235959", datetime(2023, 12, 31, 23, 59, 59)),  # End of year
            ("20240101000000", datetime(2024, 1, 1, 0, 0, 0)),  # Start of year
            ("20240630120000.123[-4:EDT]", datetime(2024, 6, 30, 12, 0, 0)),  # Milliseconds ignored
        ]
        
        for date_string, expected_date in edge_cases:
            # Create test node
            invtran = Element("INVTRAN")
            SubElement(invtran, "FITID").text = "test123"
            SubElement(invtran, "DTTRADE").text = date_string
            SubElement(invtran, "MEMO").text = "Test"
            
            # Parse the transaction details
            result = parser.parse_transaction_details(invtran)
            
            # Verify the date was parsed correctly
            assert result["date"] is not None, f"Date should be parsed for: {date_string}"
            assert result["date"] == expected_date, f"Expected {expected_date} for {date_string}, got {result['date']}"
    
    def test_no_regression_existing_formats(self):
        """Test that existing date formats still work (no regression)."""
        parser = QfxNodeParser()
        
        # Test existing formats that should continue to work
        existing_formats = [
            ("20240820", datetime(2024, 8, 20)),
            ("20240820.000", datetime(2024, 8, 20)),
        ]
        
        for date_string, expected_date in existing_formats:
            # Create test node
            invtran = Element("INVTRAN")
            SubElement(invtran, "FITID").text = "test123"
            SubElement(invtran, "DTTRADE").text = date_string
            SubElement(invtran, "MEMO").text = "Test"
            
            # Parse the transaction details
            result = parser.parse_transaction_details(invtran)
            
            # Verify the date was parsed correctly
            assert result["date"] is not None, f"Existing format should still work: {date_string}"
            assert result["date"] == expected_date, f"Expected {expected_date} for {date_string}, got {result['date']}"
