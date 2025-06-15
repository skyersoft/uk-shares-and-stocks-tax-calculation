"""Unit tests for enhanced Security model validation and factory methods.

This test suite verifies the new validation logic and factory methods
added to the Security model for ID type support.
"""
import pytest
from uuid import UUID

from src.main.python.models.domain_models import Security


class TestSecurityModelEnhanced:
    """Test cases for enhanced Security model validation and factory methods."""
    
    def test_create_with_isin_factory(self):
        """Test creating Security using ISIN factory method."""
        isin = "GB00B16KPT44"
        security = Security.create_with_isin(isin, symbol="HSBA", name="HSBC Holdings")
        
        assert security.isin == isin
        assert security.symbol == "HSBA"
        assert security.name == "HSBC Holdings"
        assert security.security_type == "ISIN"
        assert isinstance(security.id, UUID)
    
    def test_create_with_cusip_factory(self):
        """Test creating Security using CUSIP factory method."""
        cusip = "037833100"
        security = Security.create_with_cusip(cusip, symbol="AAPL", name="Apple Inc.")
        
        assert security.isin == f"CUSIP:{cusip}"
        assert security.symbol == "AAPL"
        assert security.name == "Apple Inc."
        assert security.security_type == "CUSIP"
        assert isinstance(security.id, UUID)
    
    def test_create_with_cusip_factory_already_prefixed(self):
        """Test creating Security using CUSIP factory with already prefixed CUSIP."""
        cusip = "CUSIP:037833100"
        security = Security.create_with_cusip(cusip, symbol="AAPL")
        
        assert security.isin == cusip
        assert security.security_type == "CUSIP"
    
    def test_create_with_sedol_factory(self):
        """Test creating Security using SEDOL factory method."""
        sedol = "B16KPT4"
        security = Security.create_with_sedol(sedol, symbol="HSBA")
        
        assert security.isin == f"SEDOL:{sedol}"
        assert security.symbol == "HSBA"
        assert security.security_type == "SEDOL"
    
    def test_create_with_ticker_factory(self):
        """Test creating Security using ticker factory method."""
        ticker = "AAPL"
        security = Security.create_with_ticker(ticker, symbol="AAPL", name="Apple Inc.")
        
        assert security.isin == f"TICKER:{ticker}"
        assert security.symbol == "AAPL"
        assert security.name == "Apple Inc."
        assert security.security_type == "TICKER"
    
    def test_isin_validation_valid(self):
        """Test ISIN validation with valid ISINs."""
        valid_isins = [
            "GB00B16KPT44",
            "US0378331005",
            "NL0000334118",
            "JE00B1VS3770",
            "KYG393871085"
        ]
        
        for isin in valid_isins:
            security = Security.create_with_isin(isin)
            assert security.is_valid_identifier()
    
    def test_isin_validation_invalid_length(self):
        """Test ISIN validation with invalid length."""
        with pytest.raises(ValueError, match="ISIN must be 12 characters"):
            Security.create_with_isin("GB00B16KPT4")  # 11 characters
        
        with pytest.raises(ValueError, match="ISIN must be 12 characters"):
            Security.create_with_isin("GB00B16KPT444")  # 13 characters
    
    def test_isin_validation_invalid_format(self):
        """Test ISIN validation with invalid format."""
        with pytest.raises(ValueError, match="ISIN must be alphanumeric"):
            Security.create_with_isin("GB00B16KPT4!")  # Special character
        
        with pytest.raises(ValueError, match="ISIN country code must be letters"):
            Security.create_with_isin("1200B16KPT44")  # Numeric country code
    
    def test_cusip_validation_valid(self):
        """Test CUSIP validation with valid CUSIPs."""
        valid_cusips = [
            "037833100",
            "747525103",
            "65340P106"
        ]
        
        for cusip in valid_cusips:
            security = Security.create_with_cusip(cusip)
            assert security.is_valid_identifier()
    
    def test_cusip_validation_invalid_length(self):
        """Test CUSIP validation with invalid length."""
        with pytest.raises(ValueError, match="CUSIP must be 9 characters"):
            Security.create_with_cusip("03783310")  # 8 characters
        
        with pytest.raises(ValueError, match="CUSIP must be 9 characters"):
            Security.create_with_cusip("0378331000")  # 10 characters
    
    def test_cusip_validation_invalid_format(self):
        """Test CUSIP validation with invalid format."""
        with pytest.raises(ValueError, match="CUSIP must be alphanumeric"):
            Security.create_with_cusip("037833!00")  # Special character
    
    def test_sedol_validation_valid(self):
        """Test SEDOL validation with valid SEDOLs."""
        valid_sedols = [
            "B16KPT4",
            "0263494",
            "B1YW440"
        ]
        
        for sedol in valid_sedols:
            security = Security.create_with_sedol(sedol)
            assert security.is_valid_identifier()
    
    def test_sedol_validation_invalid_length(self):
        """Test SEDOL validation with invalid length."""
        with pytest.raises(ValueError, match="SEDOL must be 7 characters"):
            Security.create_with_sedol("B16KPT")  # 6 characters
        
        with pytest.raises(ValueError, match="SEDOL must be 7 characters"):
            Security.create_with_sedol("B16KPT44")  # 8 characters
    
    def test_ticker_validation_valid(self):
        """Test ticker validation with valid tickers."""
        valid_tickers = [
            "AAPL",
            "MSFT",
            "GOOGL",
            "HSBA.L",  # London exchange
            "BRK-A"    # Berkshire Hathaway
        ]
        
        for ticker in valid_tickers:
            security = Security.create_with_ticker(ticker)
            assert security.is_valid_identifier()
    
    def test_ticker_validation_invalid_length(self):
        """Test ticker validation with invalid length."""
        with pytest.raises(ValueError, match="Ticker must be 1-10 characters"):
            Security.create_with_ticker("")  # Empty
        
        with pytest.raises(ValueError, match="Ticker must be 1-10 characters"):
            Security.create_with_ticker("VERYLONGTICKER")  # Too long
    
    def test_ticker_validation_invalid_characters(self):
        """Test ticker validation with invalid characters."""
        with pytest.raises(ValueError, match="Ticker contains invalid characters"):
            Security.create_with_ticker("AAPL!")  # Special character
    
    def test_get_identifier_method(self):
        """Test get_identifier method for different security types."""
        # ISIN
        isin_security = Security.create_with_isin("GB00B16KPT44")
        assert isin_security.get_identifier() == "GB00B16KPT44"
        
        # CUSIP
        cusip_security = Security.create_with_cusip("037833100")
        assert cusip_security.get_identifier() == "037833100"
        
        # SEDOL
        sedol_security = Security.create_with_sedol("B16KPT4")
        assert sedol_security.get_identifier() == "B16KPT4"
        
        # Ticker
        ticker_security = Security.create_with_ticker("AAPL")
        assert ticker_security.get_identifier() == "AAPL"
    
    def test_get_identifier_no_type(self):
        """Test get_identifier method when no security type is set."""
        security = Security(isin="GB00B16KPT44")
        assert security.get_identifier() == "GB00B16KPT44"
    
    def test_is_valid_identifier_method(self):
        """Test is_valid_identifier method."""
        # Valid identifiers
        valid_security = Security.create_with_isin("GB00B16KPT44")
        assert valid_security.is_valid_identifier()
        
        # Invalid identifier (create without validation by not setting security_type first)
        invalid_security = Security(isin="INVALID")
        invalid_security.security_type = "ISIN"  # Set type after creation to bypass validation
        assert not invalid_security.is_valid_identifier()
        
        # No identifier
        empty_security = Security()
        assert empty_security.is_valid_identifier()  # Empty is considered valid
    
    def test_get_display_name_method(self):
        """Test get_display_name method."""
        # With name and symbol
        security1 = Security.create_with_isin("GB00B16KPT44", symbol="HSBA", name="HSBC Holdings")
        assert security1.get_display_name() == "HSBC Holdings (HSBA)"
        
        # With symbol only
        security2 = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        assert security2.get_display_name() == "HSBA (GB00B16KPT44)"
        
        # With identifier only
        security3 = Security.create_with_isin("GB00B16KPT44")
        assert security3.get_display_name() == "GB00B16KPT44"
        
        # Empty security
        security4 = Security()
        assert security4.get_display_name() == "Unknown Security"
    
    def test_validation_on_creation(self):
        """Test that validation occurs during object creation."""
        # Valid creation should work
        Security.create_with_isin("GB00B16KPT44")
        
        # Invalid creation should raise error
        with pytest.raises(ValueError):
            Security(isin="INVALID", security_type="ISIN")
    
    def test_no_validation_without_type(self):
        """Test that no validation occurs when security_type is not set."""
        # This should not raise an error even with invalid ISIN format
        security = Security(isin="INVALID")
        assert security.isin == "INVALID"
        assert security.security_type is None
    
    def test_validation_with_empty_isin(self):
        """Test validation behavior with empty ISIN."""
        # Empty ISIN should not trigger validation errors
        security = Security(isin="", security_type="ISIN")
        assert security.is_valid_identifier()
    
    def test_factory_methods_with_minimal_params(self):
        """Test factory methods with minimal parameters."""
        isin_security = Security.create_with_isin("GB00B16KPT44")
        assert isin_security.isin == "GB00B16KPT44"
        assert isin_security.symbol == ""
        assert isin_security.name is None
        
        cusip_security = Security.create_with_cusip("037833100")
        assert cusip_security.isin == "CUSIP:037833100"
        assert cusip_security.symbol == ""
        assert cusip_security.name is None
    
    def test_mixed_identifier_types_in_collection(self):
        """Test using different identifier types in a collection."""
        securities = [
            Security.create_with_isin("GB00B16KPT44", symbol="HSBA"),
            Security.create_with_cusip("037833100", symbol="AAPL"),
            Security.create_with_sedol("B16KPT4", symbol="HSBA"),
            Security.create_with_ticker("MSFT", symbol="MSFT")
        ]
        
        # All should be valid
        for security in securities:
            assert security.is_valid_identifier()
        
        # Should have different types
        types = {security.security_type for security in securities}
        assert types == {"ISIN", "CUSIP", "SEDOL", "TICKER"}
        
        # Should have different identifiers
        identifiers = {security.get_identifier() for security in securities}
        assert len(identifiers) == 4  # All unique
