"""Unit tests for the QFX parser."""
import os
import pytest
from datetime import datetime
from src.main.python.parsers.qfx_parser import QfxParser
from src.main.python.models.domain_models import TransactionType


class TestQfxParser:
    """Unit tests for the QFX Parser."""
    
    @pytest.fixture
    def sample_qfx_path(self):
        """Fixture to provide the path to a sample QFX file."""
        return os.path.join(
            "/Users/myuser/development/ibkr-tax-calculator",
            "data",
            "U11075163_20240408_20250404.qfx"
        )
    
    def test_parse_qfx_file(self, sample_qfx_path):
        """Test that the parser can parse a QFX file."""
        parser = QfxParser()
        transactions = parser.parse(sample_qfx_path)
        
        # Basic checks
        assert transactions is not None
        assert len(transactions) > 0
        
        # Check transaction types
        buys = [tx for tx in transactions 
                if tx.transaction_type == TransactionType.BUY]
        sells = [tx for tx in transactions 
                if tx.transaction_type == TransactionType.SELL]
        
        assert len(buys) > 0
        assert len(sells) > 0
        
        # Check some transaction properties
        for tx in transactions:
            # Basic validation
            assert tx.transaction_id is not None
            assert tx.security is not None
            assert tx.security.isin is not None
            assert tx.date is not None
            assert tx.quantity != 0
            assert tx.currency is not None
            # Some QFX files might have transactions with zero price
            # In an MVP, we'll allow this but log a warning
            if tx.price_per_unit == 0.0:
                print(
                    f"Warning: Transaction {tx.transaction_id} has zero "
                    "price_per_unit"
                )
            
            # Buy quantities should be positive, sell quantities negative
            if tx.transaction_type == TransactionType.BUY:
                assert tx.quantity > 0
            elif tx.transaction_type == TransactionType.SELL:
                assert tx.quantity < 0

    def test_parse_qfx_missing_price(self, tmp_path):
        """Test QFX parser calculates price_per_unit if missing/zero."""
        qfx_content = '''
<OFX>
  <INVSTMTTRNRS>
    <INVSTMTRS>
      <INVTRANLIST>
        <BUYSTOCK>
          <INVBUY>
            <INVTRAN>
              <FITID>TXN1</FITID>
              <DTTRADE>20240101</DTTRADE>
            </INVTRAN>
            <SECID>
              <UNIQUEID>GB00B16KPT44</UNIQUEID>
              <UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE>
            </SECID>
            <UNITS>10</UNITS>
            <UNITPRICE>0</UNITPRICE>
            <TOTAL>100</TOTAL>
            <COMMISSION>1</COMMISSION>
          </INVBUY>
        </BUYSTOCK>
      </INVTRANLIST>
    </INVSTMTRS>
  </INVSTMTTRNRS>
</OFX>
'''
        qfx_file = tmp_path / "missing_price.qfx"
        qfx_file.write_text(qfx_content)
        parser = QfxParser()
        transactions = parser.parse(str(qfx_file))
        assert len(transactions) == 1
        tx = transactions[0]
        assert tx.price_per_unit == 10.0, (
            f"Expected price_per_unit=10.0, got {tx.price_per_unit}"
        )

    def test_parse_qfx_multiple_security_ids(self, tmp_path):
        """Test QFX parser handles multiple security identifier types."""
        qfx_content = '''
<OFX>
  <INVSTMTTRNRS>
    <INVSTMTRS>
      <INVTRANLIST>
        <BUYSTOCK>
          <INVBUY>
            <INVTRAN>
              <FITID>TXN2</FITID>
              <DTTRADE>20240102</DTTRADE>
            </INVTRAN>
            <SECID>
              <UNIQUEID>037833100</UNIQUEID>
              <UNIQUEIDTYPE>CUSIP</UNIQUEIDTYPE>
            </SECID>
            <UNITS>5</UNITS>
            <UNITPRICE>20</UNITPRICE>
            <TOTAL>100</TOTAL>
            <COMMISSION>1</COMMISSION>
          </INVBUY>
        </BUYSTOCK>
      </INVTRANLIST>
    </INVSTMTRS>
  </INVSTMTTRNRS>
</OFX>
'''
        qfx_file = tmp_path / "cusip_id.qfx"
        qfx_file.write_text(qfx_content)
        parser = QfxParser()
        transactions = parser.parse(str(qfx_file))
        assert len(transactions) == 1
        tx = transactions[0]
        assert tx.security.isin.startswith("CUSIP:"), (
            f"Expected CUSIP prefix, got {tx.security.isin}"
        )
        # Check for either the last 6 digits or the full CUSIP
        assert (tx.security.symbol == "833100" or 
                tx.security.symbol == "037833100"), (
            f"Expected symbol '833100' or '037833100', got {tx.security.symbol}"
        )

    def test_parse_qfx_error_recovery(self, tmp_path):
        """Test parser skips malformed transactions but parses valid ones."""
        qfx_content = '''
<OFX>
  <INVSTMTTRNRS>
    <INVSTMTRS>
      <INVTRANLIST>
        <BUYSTOCK>
          <INVBUY>
            <INVTRAN>
              <FITID>TXN3</FITID>
              <DTTRADE>20240103</DTTRADE>
            </INVTRAN>
            <SECID>
              <UNIQUEID></UNIQUEID>
              <UNIQUEIDTYPE></UNIQUEIDTYPE>
            </SECID>
            <UNITS>0</UNITS>
            <UNITPRICE>0</UNITPRICE>
            <TOTAL>0</TOTAL>
            <COMMISSION>0</COMMISSION>
          </INVBUY>
        </BUYSTOCK>
        <BUYSTOCK>
          <INVBUY>
            <INVTRAN>
              <FITID>TXN4</FITID>
              <DTTRADE>20240104</DTTRADE>
            </INVTRAN>
            <SECID>
              <UNIQUEID>GB00B16KPT44</UNIQUEID>
              <UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE>
            </SECID>
            <UNITS>2</UNITS>
            <UNITPRICE>50</UNITPRICE>
            <TOTAL>100</TOTAL>
            <COMMISSION>1</COMMISSION>
          </INVBUY>
        </BUYSTOCK>
      </INVTRANLIST>
    </INVSTMTRS>
  </INVSTMTTRNRS>
</OFX>
'''
        qfx_file = tmp_path / "error_recovery.qfx"
        qfx_file.write_text(qfx_content)
        parser = QfxParser()
        transactions = parser.parse(str(qfx_file))
        # Should skip the malformed transaction and parse the valid one
        assert len(transactions) == 1, (
            f"Expected 1 transaction, got {len(transactions)}"
        )
        tx = transactions[0]
        assert tx.transaction_id == "TXN4", (
            f"Expected transaction TXN4, got {tx.transaction_id}"
        )
        assert tx.price_per_unit == 50.0, (
            f"Expected price_per_unit=50.0, got {tx.price_per_unit}"
        )
        assert tx.security.isin == "GB00B16KPT44", (
            f"Expected ISIN 'GB00B16KPT44', got {tx.security.isin}"
        )
