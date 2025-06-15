"""Unit tests for SecurityFactory."""
import pytest
from unittest.mock import Mock
import xml.etree.ElementTree as ET
from uuid import UUID

from src.main.python.models.domain_models import Security
from src.main.python.parsers.security_factory import SecurityFactory


class TestSecurityFactory:
    """Test suite for SecurityFactory."""

    @pytest.fixture
    def security_factory(self):
        """Create a SecurityFactory instance for testing."""
        return SecurityFactory()

    def test_create_from_valid_isin(self, security_factory):
        """Test creating a Security from a valid ISIN."""
        isin = "GB00B16KPT44"
        security = security_factory.create_from_isin(isin)
        
        assert isinstance(security, Security)
        assert security.isin == isin
        assert security.symbol == isin[-6:]  # Last 6 chars
        assert security.security_type == "ISIN"

    def test_create_from_valid_cusip(self, security_factory):
        """Test creating a Security from a valid CUSIP."""
        cusip = "037833100"
        security = security_factory.create_from_cusip(cusip)
        
        assert isinstance(security, Security)
        assert security.isin == f"CUSIP:{cusip}"
        assert security.symbol == cusip[-6:]  # Last 6 chars
        assert security.security_type == "CUSIP"

    def test_create_from_empty_id(self, security_factory):
        """Test handling empty security identifiers."""
        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_isin("")
        assert "Empty security identifier" in str(exc_info.value)

        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_cusip("")
        assert "Empty security identifier" in str(exc_info.value)

    def test_create_from_malformed_id(self, security_factory):
        """Test handling malformed security identifiers."""
        # ISIN should be 12 characters
        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_isin("GB123")
        assert "Invalid ISIN format" in str(exc_info.value)

        # CUSIP should be 9 characters
        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_cusip("123")
        assert "Invalid CUSIP format" in str(exc_info.value)

    def test_create_from_xml_node_isin(self, security_factory):
        """Test creating a Security from XML node with ISIN."""
        xml_str = """
            <SECID>
                <UNIQUEID>GB00B16KPT44</UNIQUEID>
                <UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE>
            </SECID>
        """
        node = ET.fromstring(xml_str)
        security = security_factory.create_from_xml_node(node)
        
        assert isinstance(security, Security)
        assert security.isin == "GB00B16KPT44"
        assert security.symbol == "6KPT44"
        assert security.security_type == "ISIN"

    def test_create_from_xml_node_cusip(self, security_factory):
        """Test creating a Security from XML node with CUSIP."""
        xml_str = """
            <SECID>
                <UNIQUEID>037833100</UNIQUEID>
                <UNIQUEIDTYPE>CUSIP</UNIQUEIDTYPE>
            </SECID>
        """
        node = ET.fromstring(xml_str)
        security = security_factory.create_from_xml_node(node)
        
        assert isinstance(security, Security)
        assert security.isin == "CUSIP:037833100"
        assert security.symbol == "833100"
        assert security.security_type == "CUSIP"

    def test_create_from_xml_node_empty(self, security_factory):
        """Test handling XML node with empty values."""
        xml_str = """
            <SECID>
                <UNIQUEID></UNIQUEID>
                <UNIQUEIDTYPE></UNIQUEIDTYPE>
            </SECID>
        """
        node = ET.fromstring(xml_str)
        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_xml_node(node)
        assert "Empty security identifier" in str(exc_info.value)

    def test_create_from_xml_node_missing_fields(self, security_factory):
        """Test handling XML node with missing fields."""
        xml_str = """
            <SECID>
                <UNIQUEID>GB00B16KPT44</UNIQUEID>
            </SECID>
        """
        node = ET.fromstring(xml_str)
        with pytest.raises(ValueError) as exc_info:
            security_factory.create_from_xml_node(node)
        assert "Missing UNIQUEIDTYPE" in str(exc_info.value)
