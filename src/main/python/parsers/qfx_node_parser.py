"""QFX Node Parser for parsing individual XML nodes."""
import logging
import re
from datetime import datetime
from typing import Dict, Any, Optional
from xml.etree.ElementTree import Element


class QfxNodeParser:
    """Parser for individual QFX XML nodes."""
    
    def __init__(self):
        """Initialize the QFX node parser."""
        self.logger = logging.getLogger(__name__)
    
    def parse_transaction_details(self, invtran: Element) -> Dict[str, Any]:
        """Parse transaction details from INVTRAN element.
        
        Args:
            invtran: XML element containing transaction data
            
        Returns:
            Dictionary with parsed transaction details
        """
        result = {
            "date": None,
            "id": None,
            "memo": None
        }
        
        try:
            # Parse transaction ID
            fitid_elem = invtran.find("FITID")
            if fitid_elem is not None and fitid_elem.text:
                result["id"] = fitid_elem.text.strip()
            
            # Parse transaction date
            dttrade_elem = invtran.find("DTTRADE")
            if dttrade_elem is not None and dttrade_elem.text:
                result["date"] = self._parse_date(dttrade_elem.text.strip())
            
            # Parse memo
            memo_elem = invtran.find("MEMO")
            if memo_elem is not None and memo_elem.text:
                result["memo"] = memo_elem.text.strip()
                
        except Exception as e:
            self.logger.warning(f"Error parsing transaction details: {e}")
            
        return result
    
    def parse_header(self, root: Element) -> Dict[str, Any]:
        """Parse header information from OFX root element.
        
        Args:
            root: XML root element
            
        Returns:
            Dictionary with parsed header information
        """
        result = {
            "date": None,
            "code": None,
            "severity": None,
            "broker": None
        }
        
        try:
            # Navigate to SONRS element
            sonrs = root.find(".//SONRS")
            if sonrs is not None:
                # Parse status information
                status = sonrs.find("STATUS")
                if status is not None:
                    code_elem = status.find("CODE")
                    if code_elem is not None and code_elem.text:
                        result["code"] = code_elem.text.strip()
                    
                    severity_elem = status.find("SEVERITY")
                    if severity_elem is not None and severity_elem.text:
                        result["severity"] = severity_elem.text.strip()
                
                # Parse server date
                dtserver_elem = sonrs.find("DTSERVER")
                if dtserver_elem is not None and dtserver_elem.text:
                    result["date"] = self._parse_date(dtserver_elem.text.strip())
                
                # Parse financial institution info
                fi = sonrs.find("FI")
                if fi is not None:
                    org_elem = fi.find("ORG")
                    if org_elem is not None and org_elem.text:
                        result["broker"] = org_elem.text.strip()
                        
        except Exception as e:
            self.logger.warning(f"Error parsing header: {e}")
            
        return result
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse QFX date string into datetime object.
        
        Supports various QFX date formats including timezone-aware dates.
        
        Args:
            date_str: Date string from QFX file
            
        Returns:
            Parsed datetime object or None if parsing fails
        """
        if not date_str:
            return None
            
        try:
            # Remove timezone information if present (e.g., [-5:EST])
            # QFX format: YYYYMMDDHHMMSS.sss[timezone]
            clean_date = re.sub(r'\[.*?\]$', '', date_str)
            
            # Remove milliseconds if present
            clean_date = re.sub(r'\.\d+$', '', clean_date)
            
            # Parse different date formats
            if len(clean_date) == 8:  # YYYYMMDD
                return datetime.strptime(clean_date, "%Y%m%d")
            elif len(clean_date) == 14:  # YYYYMMDDHHMMSS
                return datetime.strptime(clean_date, "%Y%m%d%H%M%S")
            elif len(clean_date) >= 12:  # YYYYMMDDHHMM or longer
                # Try to parse at least YYYYMMDDHHMM
                return datetime.strptime(clean_date[:12], "%Y%m%d%H%M")
            else:
                self.logger.warning(f"Unsupported date format: {date_str}")
                return None
                
        except ValueError as e:
            self.logger.warning(f"Failed to parse date '{date_str}': {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing date '{date_str}': {e}")
            return None
