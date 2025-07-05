"""Tests for Phase 1 Task 1.2: Enhanced Asset Class Support."""
import pytest
from src.main.python.models.domain_models import Security


class TestAssetClassEnumeration:
    """Test cases for the AssetClass enumeration."""
    
    def test_asset_class_enum_exists(self):
        """Test that AssetClass enum exists."""
        from src.main.python.models import domain_models
        assert hasattr(domain_models, 'AssetClass'), "AssetClass should exist"
        
        from src.main.python.models.domain_models import AssetClass
        assert AssetClass.STOCK.value == "STK"
        assert AssetClass.ETF.value == "ETF"
        assert AssetClass.CLOSED_END_FUND.value == "CLOSED-END FUND"
        assert AssetClass.CASH.value == "CASH"
        assert AssetClass.BOND.value == "BOND"
        assert AssetClass.OPTION.value == "OPT"
        assert AssetClass.FUTURE.value == "FUT"
    
class TestEnhancedAssetClassAfterImplementation:
    """Tests that will pass after implementing enhanced asset class support."""
    
    def test_asset_class_enum_exists(self):
        """Test that AssetClass enum exists with all required values."""
        from src.main.python.models.domain_models import AssetClass
        
        # Test all required asset classes
        assert AssetClass.STOCK.value == "STK"
        assert AssetClass.ETF.value == "ETF"
        assert AssetClass.CLOSED_END_FUND.value == "CLOSED-END FUND"
        assert AssetClass.CASH.value == "CASH"
        assert AssetClass.BOND.value == "BOND"
        assert AssetClass.OPTION.value == "OPT"
        assert AssetClass.FUTURE.value == "FUT"
    
    def test_enhanced_security_model(self):
        """Test enhanced Security model with asset class fields."""
        from src.main.python.models.domain_models import AssetClass
        
        security = Security()
        
        # Test default values
        assert hasattr(security, 'asset_class')
        assert hasattr(security, 'sub_category')
        assert hasattr(security, 'listing_exchange')
        assert hasattr(security, 'trading_exchange')
        
        # Test default asset class
        assert security.asset_class == AssetClass.STOCK
        assert security.sub_category is None
        assert security.listing_exchange is None
        assert security.trading_exchange is None
    
    def test_security_creation_with_asset_class(self):
        """Test creating securities with different asset classes."""
        from src.main.python.models.domain_models import AssetClass
        
        # Test ETF creation
        etf = Security(
            symbol="SPY",
            name="SPDR S&P 500 ETF Trust",
            asset_class=AssetClass.ETF,
            listing_exchange="NYSE"
        )
        assert etf.asset_class == AssetClass.ETF
        assert etf.listing_exchange == "NYSE"
        
        # Test closed-end fund creation
        cef = Security(
            symbol="BDJ",
            name="Blackstone Strategic Credit Fund",
            asset_class=AssetClass.CLOSED_END_FUND,
            sub_category="CREDIT",
            listing_exchange="NYSE"
        )
        assert cef.asset_class == AssetClass.CLOSED_END_FUND
        assert cef.sub_category == "CREDIT"
    
    def test_asset_class_validation(self):
        """Test asset class validation logic."""
        from src.main.python.models.domain_models import AssetClass
        
        # Test valid combinations
        security = Security(
            asset_class=AssetClass.STOCK,
            sub_category="COMMON"
        )
        # Should not raise any exceptions
        
        # Test cash asset class
        cash_security = Security(
            symbol="EUR.GBP",
            asset_class=AssetClass.CASH
        )
        assert cash_security.asset_class == AssetClass.CASH
