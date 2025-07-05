"""Tests for Phase 1 Task 1.1: Enhanced Transaction Type Enumeration - Proper TDD."""
import pytest
from src.main.python.models.domain_models import TransactionType


class TestEnhancedTransactionTypes:
    """Test enhanced transaction type functionality."""
    
    def test_existing_transaction_types_preserved(self):
        """Test that existing transaction types are preserved for backward compatibility."""
        # These should always pass
        assert TransactionType.BUY.value == "BUY"
        assert TransactionType.SELL.value == "SELL"
        assert TransactionType.DIVIDEND.value == "DIV"
        assert TransactionType.SPLIT.value == "SPLIT"
        assert TransactionType.MERGER.value == "MERGER"
        assert TransactionType.FEE.value == "FEE"
        assert TransactionType.TRANSFER_IN.value == "TRANSFER_IN"
        assert TransactionType.TRANSFER_OUT.value == "TRANSFER_OUT"
    
    def test_currency_exchange_transaction_type(self):
        """Test that CURRENCY_EXCHANGE transaction type exists and has correct value."""
        assert TransactionType.CURRENCY_EXCHANGE.value == "FX"
    
    def test_interest_transaction_type(self):
        """Test that INTEREST transaction type exists and has correct value."""
        assert TransactionType.INTEREST.value == "INT"
    
    def test_commission_transaction_type(self):
        """Test that COMMISSION transaction type exists and has correct value."""
        assert TransactionType.COMMISSION.value == "COMM"
    
    def test_tax_withholding_transaction_type(self):
        """Test that TAX_WITHHOLDING transaction type exists and has correct value."""
        assert TransactionType.TAX_WITHHOLDING.value == "TAX"
    
    def test_cash_adjustment_transaction_type(self):
        """Test that CASH_ADJUSTMENT transaction type exists and has correct value."""
        assert TransactionType.CASH_ADJUSTMENT.value == "CASH_ADJ"
    
    def test_all_enhanced_transaction_types_exist(self):
        """Test that all enhanced transaction types exist with correct values."""
        # This tests the complete enhanced functionality
        expected_types = {
            TransactionType.BUY: "BUY",
            TransactionType.SELL: "SELL", 
            TransactionType.DIVIDEND: "DIV",
            TransactionType.CURRENCY_EXCHANGE: "FX",
            TransactionType.INTEREST: "INT",
            TransactionType.COMMISSION: "COMM",
            TransactionType.TAX_WITHHOLDING: "TAX",
            TransactionType.SPLIT: "SPLIT",
            TransactionType.MERGER: "MERGER",
            TransactionType.TRANSFER_IN: "TRANSFER_IN",
            TransactionType.TRANSFER_OUT: "TRANSFER_OUT",
            TransactionType.CASH_ADJUSTMENT: "CASH_ADJ",
            TransactionType.FEE: "FEE"
        }
        
        for transaction_type, expected_value in expected_types.items():
            assert transaction_type.value == expected_value
    
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
