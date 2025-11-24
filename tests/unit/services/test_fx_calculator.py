"""Unit tests for FXCalculator service."""
from src.main.python.services.fx_calculator import FXCalculator


class TestFXCalculator:
    """Test suite for FX gain/loss calculations."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.calculator = FXCalculator()
        
    def test_same_currency_no_fx_gain(self):
        """FX gain is zero when buy and sell in same currency (GBP)."""
        fx_gain = self.calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=1.0,
            proceeds_original_amount=1500.0,
            proceeds_fx_rate=1.0
        )
        
        assert fx_gain == 0.0, "Same currency should have no FX gain/loss"
    
    def test_usd_to_gbp_fx_gain(self):
        """Calculate FX gain when USD strengthens against GBP."""
        # Buy $1000 at rate 0.75 (£1 = $1.33) = £750
        # Sell $1000 at rate 0.80 (£1 = $1.25) = £800
        # FX gain = £800 - £750 = £50
        fx_gain = self.calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.75,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.80
        )
        
        assert fx_gain == 50.0, f"Expected £50 FX gain, got £{fx_gain}"
    
    def test_usd_to_gbp_fx_loss(self):
        """Calculate FX loss when USD weakens against GBP."""
        # Buy $1000 at rate 0.85 = £850
        # Sell $1000 at rate 0.75 = £750
        # FX loss = £750 - £850 = -£100
        fx_gain = self.calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,
            cost_fx_rate=0.85,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.75
        )
        
        assert fx_gain == -100.0, f"Expected -£100 FX loss, got £{fx_gain}"
    
    def test_different_amounts_fx_calculation(self):
        """FX calculation works with different buy/sell amounts."""
        # Buy $2000 at rate 0.80 = £1600
        # Sell $1000 at rate 0.85 = £850
        # For the $1000 sold: cost at purchase = £800, cost at sale rate = £850
        # FX gain = £850 - £800 = £50
        fx_gain = self.calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=1000.0,  # Portion sold
            cost_fx_rate=0.80,
            proceeds_original_amount=1000.0,
            proceeds_fx_rate=0.85
        )
        
        assert fx_gain == 50.0, f"Expected £50 FX gain, got £{fx_gain}"

