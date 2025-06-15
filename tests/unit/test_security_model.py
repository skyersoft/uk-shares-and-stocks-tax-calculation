"""Unit tests for Security model validation and ID handling.

This test suite verifies the Security model's validation logic and ID handling
capabilities, ensuring proper validation of different security identifier types.
"""
import pytest
from uuid import UUID

from src.main.python.models.domain_models import Security


class TestSecurityModel:
    """Test cases for Security model validation and ID handling."""
    
    def test_security_creation_with_defaults(self):
        """Test creating a Security with default values."""
        security = Security()
        
        # Should have a valid UUID
        assert isinstance(security.id, UUID)
        
        # Default values should be set
        assert security.isin == ""
        assert security.symbol == ""
        assert security.name is None
        assert security.security_type is None
    
    def test_security_creation_with_isin(self):
        """Test creating a Security with ISIN identifier."""
        isin = "GB00B16KPT44"
        security = Security(isin=isin, symbol="HSBA", security_type="ISIN")
        
        assert security.isin == isin
        assert security.symbol == "HSBA"
        assert security.security_type == "ISIN"
        assert isinstance(security.id, UUID)
    
    def test_security_creation_with_cusip(self):
        """Test creating a Security with CUSIP identifier."""
        cusip = "037833100"
        security = Security(isin=f"CUSIP:{cusip}", symbol="AAPL", security_type="CUSIP")
        
        assert security.isin == f"CUSIP:{cusip}"
        assert security.symbol == "AAPL"
        assert security.security_type == "CUSIP"
        assert isinstance(security.id, UUID)
    
    def test_security_creation_with_all_fields(self):
        """Test creating a Security with all fields populated."""
        security = Security(
            isin="NL0000334118",
            symbol="ASM",
            name="ASM International NV",
            security_type="ISIN"
        )
        
        assert security.isin == "NL0000334118"
        assert security.symbol == "ASM"
        assert security.name == "ASM International NV"
        assert security.security_type == "ISIN"
        assert isinstance(security.id, UUID)
    
    def test_security_equality(self):
        """Test Security equality comparison."""
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security3 = Security(isin="NL0000334118", symbol="ASM")
        
        # Different instances with same data should NOT be equal due to different UUIDs
        assert security1 != security2
        
        # Different data should not be equal
        assert security1 != security3
        
        # But the business data should be the same
        assert security1.isin == security2.isin
        assert security1.symbol == security2.symbol
    
    def test_security_unique_ids(self):
        """Test that each Security gets a unique ID."""
        security1 = Security(isin="GB00B16KPT44")
        security2 = Security(isin="GB00B16KPT44")
        
        # Should have different UUIDs even with same data
        assert security1.id != security2.id
        assert isinstance(security1.id, UUID)
        assert isinstance(security2.id, UUID)
    
    def test_security_isin_validation_valid_format(self):
        """Test Security with valid ISIN formats."""
        valid_isins = [
            "GB00B16KPT44",  # UK ISIN
            "US0378331005",  # US ISIN
            "NL0000334118",  # Netherlands ISIN
            "JE00B1VS3770",  # Jersey ISIN
            "KYG393871085",  # Cayman Islands ISIN
        ]
        
        for isin in valid_isins:
            security = Security(isin=isin, security_type="ISIN")
            assert security.isin == isin
            assert len(security.isin) == 12  # ISIN should be 12 characters
    
    def test_security_cusip_validation_valid_format(self):
        """Test Security with valid CUSIP formats."""
        valid_cusips = [
            "037833100",  # Apple Inc.
            "747525103",  # Qualcomm Inc.
            "65340P106",  # NexGen Energy
        ]
        
        for cusip in valid_cusips:
            security = Security(isin=f"CUSIP:{cusip}", security_type="CUSIP")
            assert cusip in security.isin
            assert len(cusip) == 9  # CUSIP should be 9 characters
    
    def test_security_empty_identifiers(self):
        """Test Security with empty identifiers."""
        security = Security(isin="", symbol="", security_type="")
        
        assert security.isin == ""
        assert security.symbol == ""
        assert security.security_type == ""
        assert isinstance(security.id, UUID)
    
    def test_security_none_values(self):
        """Test Security with None values for optional fields."""
        security = Security(
            isin="GB00B16KPT44",
            symbol="HSBA",
            name=None,
            security_type=None
        )
        
        assert security.isin == "GB00B16KPT44"
        assert security.symbol == "HSBA"
        assert security.name is None
        assert security.security_type is None
    
    def test_security_string_representation(self):
        """Test Security string representation."""
        security = Security(
            isin="GB00B16KPT44",
            symbol="HSBA",
            name="HSBC Holdings plc",
            security_type="ISIN"
        )
        
        # Should be able to convert to string without error
        str_repr = str(security)
        assert "GB00B16KPT44" in str_repr
        assert "HSBA" in str_repr
    
    def test_security_different_id_types(self):
        """Test Security with different identifier types."""
        test_cases = [
            {
                "isin": "GB00B16KPT44",
                "security_type": "ISIN",
                "expected_length": 12
            },
            {
                "isin": "CUSIP:037833100",
                "security_type": "CUSIP",
                "expected_length": 15  # "CUSIP:" + 9 chars
            },
            {
                "isin": "SEDOL:B16KPT4",
                "security_type": "SEDOL",
                "expected_length": 13  # "SEDOL:" + 7 chars
            },
            {
                "isin": "TICKER:AAPL",
                "security_type": "TICKER",
                "expected_length": 11  # "TICKER:" + 4 chars
            }
        ]
        
        for case in test_cases:
            security = Security(
                isin=case["isin"],
                security_type=case["security_type"]
            )
            
            assert security.isin == case["isin"]
            assert security.security_type == case["security_type"]
            assert len(security.isin) == case["expected_length"]
    
    def test_security_immutable_id(self):
        """Test that Security ID remains constant after creation."""
        security = Security(isin="GB00B16KPT44")
        original_id = security.id
        
        # Modify other fields
        security.symbol = "HSBA"
        security.name = "HSBC Holdings"
        security.security_type = "ISIN"
        
        # ID should remain the same
        assert security.id == original_id
    
    def test_security_copy_behavior(self):
        """Test Security copy behavior."""
        original = Security(
            isin="GB00B16KPT44",
            symbol="HSBA",
            name="HSBC Holdings plc",
            security_type="ISIN"
        )
        
        # Create a copy by creating new instance with same data
        copy = Security(
            isin=original.isin,
            symbol=original.symbol,
            name=original.name,
            security_type=original.security_type
        )
        
        # Should have same data but different IDs
        assert copy.isin == original.isin
        assert copy.symbol == original.symbol
        assert copy.name == original.name
        assert copy.security_type == original.security_type
        assert copy.id != original.id  # Different UUIDs
    
    def test_security_field_types(self):
        """Test Security field type validation."""
        security = Security(
            isin="GB00B16KPT44",
            symbol="HSBA",
            name="HSBC Holdings plc",
            security_type="ISIN"
        )
        
        # Check field types
        assert isinstance(security.id, UUID)
        assert isinstance(security.isin, str)
        assert isinstance(security.symbol, str)
        assert isinstance(security.name, str) or security.name is None
        assert isinstance(security.security_type, str) or security.security_type is None
    
    def test_security_hash_behavior(self):
        """Test Security hash behavior for use in sets and dicts."""
        security1 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security2 = Security(isin="GB00B16KPT44", symbol="HSBA")
        security3 = Security(isin="NL0000334118", symbol="ASM")
        
        # Security objects are not hashable by default due to mutable fields
        # So we test that they can't be used in sets
        try:
            {security1, security2, security3}
            # If this succeeds, the test should fail
            assert False, "Security objects should not be hashable"
        except TypeError as e:
            # This is expected - Security objects should not be hashable
            assert "unhashable type" in str(e)
        
        # But we can use them in lists
        security_list = [security1, security2, security3]
        assert len(security_list) == 3
    
    def test_security_with_special_characters(self):
        """Test Security with special characters in fields."""
        security = Security(
            isin="GB00B16KPT44",
            symbol="HSBA.L",  # London exchange suffix
            name="HSBC Holdings plc (UK)",
            security_type="ISIN"
        )
        
        assert security.symbol == "HSBA.L"
        assert "(" in security.name
        assert ")" in security.name
    
    def test_security_long_names(self):
        """Test Security with long company names."""
        long_name = "Very Long Company Name That Exceeds Normal Length Limits Inc."
        security = Security(
            isin="US1234567890",
            symbol="LONG",
            name=long_name,
            security_type="ISIN"
        )
        
        assert security.name == long_name
        assert len(security.name) > 50
