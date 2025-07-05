"""Tests for Phase 1 Task 1.1: Enhanced Transaction Type Enumeration."""
import pytest
from src.main.python.models.domain_models import TransactionType


class TestEnhancedTransactionTypes:
    """Test enhanced transaction type enumeration."""
    
    def test_existing_transaction_types_preserved(self):
        """Test that existing transaction types are preserved for backward compatibility."""
        # Existing types should still be available
        assert TransactionType.BUY.value == "BUY"
        assert TransactionType.SELL.value == "SELL"
        assert TransactionType.DIVIDEND.value == "DIV"
        assert TransactionType.SPLIT.value == "SPLIT"
        assert TransactionType.MERGER.value == "MERGER"
        assert TransactionType.FEE.value == "FEE"
        assert TransactionType.TRANSFER_IN.value == "TRANSFER_IN"
        assert TransactionType.TRANSFER_OUT.value == "TRANSFER_OUT"
    
    
    
    def test_all_transaction_types_have_string_values(self):
        """Test that all transaction types have proper string values."""
        # This test will be updated once we add the new types
        expected_types = {
            TransactionType.BUY: "BUY",
            TransactionType.SELL: "SELL", 
            TransactionType.DIVIDEND: "DIV",
            TransactionType.SPLIT: "SPLIT",
            TransactionType.MERGER: "MERGER",
            TransactionType.FEE: "FEE",
            TransactionType.TRANSFER_IN: "TRANSFER_IN",
            TransactionType.TRANSFER_OUT: "TRANSFER_OUT"
        }
        
        for transaction_type, expected_value in expected_types.items():
            assert transaction_type.value == expected_value
    
    def test_transaction_type_enum_completeness(self):
        """Test that we have all expected transaction types."""
        all_types = list(TransactionType)
        assert len(all_types) == 13  # Updated to 13 after enhancement
        
        # Verify all expected types are present
        expected_values = {
            "BUY", "SELL", "DIV", "FX", "INT", "COMM", "TAX", 
            "SPLIT", "MERGER", "TRANSFER_IN", "TRANSFER_OUT", "CASH_ADJ", "FEE"
        }
        actual_values = {t.value for t in all_types}
        assert actual_values == expected_values


class TestEnhancedTransactionTypesAfterImplementation:
    """Tests that will pass after implementing the enhanced transaction types."""
    
    @pytest.mark.skip(reason="Will be enabled after implementation")
    def test_enhanced_transaction_types_exist(self):
        """Test that all enhanced transaction types exist."""
        # Currency exchange
        assert TransactionType.CURRENCY_EXCHANGE == "FX"
        
        # Interest
        assert TransactionType.INTEREST == "INT"
        
        # Commission
        assert TransactionType.COMMISSION == "COMM"
        
        # Tax withholding
        assert TransactionType.TAX_WITHHOLDING == "TAX"
        
        # Cash adjustment
        assert TransactionType.CASH_ADJUSTMENT == "CASH_ADJ"
    
    @pytest.mark.skip(reason="Will be enabled after implementation")
    def test_enhanced_enum_completeness(self):
        """Test that we have all expected transaction types after enhancement."""
        all_types = list(TransactionType)
        assert len(all_types) == 13  # 8 original + 5 new
        
        # Verify all expected types are present
        expected_values = {
            "BUY", "SELL", "DIV", "FX", "INT", "COMM", "TAX", 
            "SPLIT", "MERGER", "TRANSFER_IN", "TRANSFER_OUT", "CASH_ADJ", "FEE"
        }
        actual_values = {t.value for t in all_types}
        assert actual_values == expected_values
