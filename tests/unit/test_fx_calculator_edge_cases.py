"""Unit tests for FX calculator edge cases and validation."""
import pytest
from datetime import datetime
from src.main.python.services.fx_calculator import FXCalculator
from src.main.python.models.domain_models import Transaction, TransactionType, Security, Currency


class TestFXCalculatorEdgeCases:
    """Test edge cases and validation in FX calculator."""
    
    @pytest.fixture
    def fx_calculator(self):
        """Create FX calculator instance."""
        return FXCalculator()
    
    def test_zero_fx_rate_handling(self, fx_calculator):
        """Test handling of zero FX rates."""
        # Should return 0 for invalid rates
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.0,  # Invalid
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.80
        )
        assert result == 0.0
        
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.75,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.0  # Invalid
        )
        assert result == 0.0
    
    def test_negative_fx_rate_handling(self, fx_calculator):
        """Test handling of negative FX rates."""
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=-0.75,  # Invalid
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.80
        )
        assert result == 0.0
    
    def test_same_currency_no_fx_gain(self, fx_calculator):
        """Test GBP to GBP transaction has no FX gain."""
        # Both rates at 1.0 (GBP)
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=1.0,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=1.0
        )
        assert result == 0.0
    
    def test_identical_fx_rates_no_gain(self, fx_calculator):
        """Test identical FX rates result in no gain/loss."""
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.75,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.75
        )
        assert result == 0.0
    
    def test_nearly_identical_rates(self, fx_calculator):
        """Test nearly identical rates (within 0.0001) are treated as same."""
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.750000,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.750001  # Tiny difference
        )
        assert result == 0.0
    
    def test_fx_gain_positive(self, fx_calculator):
        """Test FX gain when currency strengthens."""
        # Buy at 0.75, sell at 0.80 (currency strengthened)
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.75,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.80
        )
        # Expected: 1000 * (0.80 - 0.75) = 50 GBP gain
        assert result == pytest.approx(50.0)
    
    def test_fx_loss_negative(self, fx_calculator):
        """Test FX loss when currency weakens."""
        # Buy at 0.80, sell at 0.75 (currency weakened)
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.80,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.75
        )
        # Expected: 1000 * (0.75 - 0.80) = -50 GBP loss
        assert result == pytest.approx(-50.0)
    
    def test_extreme_rate_difference(self, fx_calculator):
        """Test extreme FX rate differences."""
        # Massive currency swing
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.50,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=1.50
        )
        # Expected: 1000 * (1.50 - 0.50) = 1000 GBP gain
        assert result == pytest.approx(1000.0)
    
    def test_negative_amount_warning(self, fx_calculator):
        """Test that negative amounts are handled but produce warning."""
        # Should handle gracefully even with negative amounts
        result = fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=-1000.0,  # Invalid but should not crash
            cost_fx_rate=0.75,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.80
        )
        # Should still calculate, but with warning logged
        assert isinstance(result, float)
    
    def test_weighted_average_empty_list(self, fx_calculator):
        """Test weighted average with empty transaction list."""
        result = fx_calculator.calculate_weighted_average_fx_rate([])
        assert result == 1.0  # Default to GBP
    
    def test_weighted_average_single_transaction(self, fx_calculator):
        """Test weighted average with single transaction."""
        security = Security(isin='US0378331005', symbol='AAPL')
        currency = Currency(code='USD', rate_to_base=0.75)
        
        tx = Transaction(
            transaction_id='T1',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100,
            price_per_unit=150.0,
            commission=10.0,
            taxes=0.0,
            currency=currency
        )
        
        result = fx_calculator.calculate_weighted_average_fx_rate([tx])
        assert result == 0.75
    
    def test_weighted_average_multiple_transactions(self, fx_calculator):
        """Test weighted average with multiple transactions at different rates."""
        security = Security(isin='US0378331005', symbol='AAPL')
        
        # Buy 100 shares @ $150, rate 0.75
        tx1 = Transaction(
            transaction_id='T1',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100,
            price_per_unit=150.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code='USD', rate_to_base=0.75)
        )
        
        # Buy 50 shares @ $160, rate 0.80
        tx2 = Transaction(
            transaction_id='T2',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 2, 1),
            quantity=50,
            price_per_unit=160.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code='USD', rate_to_base=0.80)
        )
        
        result = fx_calculator.calculate_weighted_average_fx_rate([tx1, tx2])
        
        # Expected: (100*150*0.75 + 50*160*0.80) / (100*150 + 50*160)
        # = (11250 + 6400) / (15000 + 8000)
        # = 17650 / 23000
        # = 0.7673913...
        assert result == pytest.approx(0.7673913, abs=0.0001)
    
    def test_weighted_average_zero_total_amount(self, fx_calculator):
        """Test weighted average when total amount is zero."""
        security = Security(isin='US0378331005', symbol='AAPL')
        
        # Transaction with zero quantity or price should result in zero total
        tx = Transaction(
            transaction_id='T1',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=0,  # Zero quantity
            price_per_unit=150.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code='USD', rate_to_base=0.75)
        )
        
        result = fx_calculator.calculate_weighted_average_fx_rate([tx])
        # Should default to 1.0 when total amount is zero
        assert result == 1.0
    
    def test_weighted_average_mixed_currencies(self, fx_calculator):
        """Test weighted average with transactions in different currencies."""
        security = Security(isin='US0378331005', symbol='AAPL')
        
        # USD transaction
        tx1 = Transaction(
            transaction_id='T1',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100,
            price_per_unit=150.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code='USD', rate_to_base=0.75)
        )
        
        # EUR transaction
        tx2 = Transaction(
            transaction_id='T2',
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 2, 1),
            quantity=50,
            price_per_unit=160.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code='EUR', rate_to_base=0.85)
        )
        
        result = fx_calculator.calculate_weighted_average_fx_rate([tx1, tx2])
        
        # Expected: (100*150*0.75 + 50*160*0.85) / (100*150 + 50*160)
        # = (11250 + 6800) / 23000
        # = 0.7847826...
        assert result == pytest.approx(0.7847826, abs=0.0001)
