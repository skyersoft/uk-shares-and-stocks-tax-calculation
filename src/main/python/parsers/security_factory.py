"""Security factory for creating Security objects from different ID types."""
from abc import ABC, abstractmethod
import xml.etree.ElementTree as ET

from ..models.domain_models import Security


class ISecurityFactory(ABC):
    """Interface for security factory implementations."""
    
    @abstractmethod
    def create_from_isin(self, isin: str) -> Security:
        """Create a Security object from an ISIN.
        
        Args:
            isin: The ISIN identifier
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If ISIN is empty or invalid
        """
        pass
    
    @abstractmethod
    def create_from_cusip(self, cusip: str) -> Security:
        """Create a Security object from a CUSIP.
        
        Args:
            cusip: The CUSIP identifier
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If CUSIP is empty or invalid
        """
        pass
    
    @abstractmethod
    def create_from_xml_node(self, node: ET.Element) -> Security:
        """Create a Security object from an XML node.
        
        Args:
            node: XML element containing security information
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If required fields are missing or invalid
        """
        pass


class SecurityFactory(ISecurityFactory):
    """Creates Security objects from different identifier types."""
    
    def create_from_isin(self, isin: str) -> Security:
        """Create a Security object from an ISIN.
        
        Args:
            isin: The ISIN identifier
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If ISIN is empty or invalid
        """
        if not isin:
            raise ValueError("Empty security identifier")
        
        if len(isin) != 12:
            raise ValueError("Invalid ISIN format - must be 12 characters")
            
        return Security(
            isin=isin,
            symbol=isin[-6:],  # Use last 6 chars as symbol
            security_type="ISIN"
        )
    
    def create_from_cusip(self, cusip: str) -> Security:
        """Create a Security object from a CUSIP.
        
        Args:
            cusip: The CUSIP identifier
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If CUSIP is empty or invalid
        """
        if not cusip:
            raise ValueError("Empty security identifier")
        
        if len(cusip) != 9:
            raise ValueError("Invalid CUSIP format - must be 9 characters")
        
        return Security(
            isin=f"CUSIP:{cusip}",
            symbol=cusip[-6:],  # Use last 6 chars as symbol
            security_type="CUSIP"
        )
    
    def create_from_xml_node(self, node: ET.Element) -> Security:
        """Create a Security object from an XML node.
        
        Args:
            node: XML element containing security information
            
        Returns:
            A Security object
            
        Raises:
            ValueError: If required fields are missing or invalid
        """
        # Extract identifier and type
        uniqueid = node.findtext('./UNIQUEID', '').strip()
        uniqueidtype = node.findtext('./UNIQUEIDTYPE', '').strip()
        
        # Check for empty identifier first
        if not uniqueid:
            raise ValueError("Empty security identifier")
            
        # Then check for missing type
        if not uniqueidtype:
            raise ValueError("Missing UNIQUEIDTYPE")
            
        # Create security based on identifier type
        if uniqueidtype.upper() == 'ISIN':
            return self.create_from_isin(uniqueid)
        elif uniqueidtype.upper() == 'CUSIP':
            return self.create_from_cusip(uniqueid)
        else:
            return Security(
                isin=f"{uniqueidtype}:{uniqueid}",
                symbol=uniqueid[-6:] if len(uniqueid) >= 6 else uniqueid,
                security_type=uniqueidtype
            )
