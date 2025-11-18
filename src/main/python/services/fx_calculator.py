"""Foreign exchange gain/loss calculator for HMRC compliance."""
import logging
from typing import Optional


class FXCalculator:
    """Calculate foreign exchange gains/losses per HMRC rules.
    
    This calculator handles FX gain/loss calculations for:
    1. Share disposals (difference between acquisition and disposal FX rates)
    2. Cash currency exchanges (FIFO basis)
    
    HMRC requires separate tracking of FX gains/losses from capital gains.
    """
    
    def __init__(self):
        """Initialize the FX calculator."""
        self.logger = logging.getLogger(__name__)
    
    def calculate_disposal_fx_gain_loss(
        self,
        cost_original_amount: float,
        cost_fx_rate: float,
        proceeds_original_amount: float,
        proceeds_fx_rate: float
    ) -> float:
        """
        Calculate FX gain/loss component of a share disposal.
        
        The FX gain/loss represents the currency movement between acquisition
        and disposal. This is calculated by converting the original currency
        amounts at both rates and taking the difference.
        
        Formula:
        FX gain/loss = cost_original * (proceeds_fx_rate - cost_fx_rate)
        
        Args:
            cost_original_amount: Original cost in foreign currency
            cost_fx_rate: FX rate at acquisition (foreign to GBP)
            proceeds_original_amount: Proceeds in foreign currency
            proceeds_fx_rate: FX rate at disposal (foreign to GBP)
            
        Returns:
            FX gain/loss in GBP (positive = gain, negative = loss)
            
        Example:
            Bought 100 shares at $10 when rate was 0.75 (£7.50 per share)
            Sold 100 shares at $10 when rate was 0.80 (£8.00 per share)
            FX gain = 100 * 10 * (0.80 - 0.75) = £50
        """
        try:
            # Validate inputs
            if cost_fx_rate <= 0 or proceeds_fx_rate <= 0:
                self.logger.warning(
                    f"Invalid FX rates: cost={cost_fx_rate}, proceeds={proceeds_fx_rate}"
                )
                return 0.0
            
            # If both rates are the same (or both GBP), no FX gain/loss
            if abs(cost_fx_rate - proceeds_fx_rate) < 0.0001:
                return 0.0
            
            # Calculate the FX component
            # Cost at disposal rate vs cost at acquisition rate
            cost_at_disposal_rate = cost_original_amount * proceeds_fx_rate
            cost_at_acquisition_rate = cost_original_amount * cost_fx_rate
            
            fx_gain_loss = cost_at_disposal_rate - cost_at_acquisition_rate
            
            self.logger.debug(
                f"FX calculation: {cost_original_amount} @ {cost_fx_rate} -> "
                f"{proceeds_fx_rate} = {fx_gain_loss:.2f} GBP"
            )
            
            return fx_gain_loss
            
        except Exception as e:
            self.logger.error(f"Error calculating FX gain/loss: {e}")
            return 0.0
    
    def calculate_cash_exchange_gain_loss(
        self,
        amount: float,
        current_rate: float,
        historical_rate: float
    ) -> float:
        """
        Calculate FX gain/loss on cash currency exchange.
        
        This uses FIFO (First In First Out) basis for determining the
        historical acquisition rate of the currency being exchanged.
        
        Args:
            amount: Amount of foreign currency exchanged
            current_rate: Current FX rate (foreign to GBP)
            historical_rate: Historical acquisition rate (FIFO basis)
            
        Returns:
            FX gain/loss in GBP
            
        Example:
            Exchanged $1000 acquired at 0.75 (£750) when rate is 0.80 (£800)
            FX gain = £800 - £750 = £50
        """
        try:
            # Validate inputs
            if current_rate <= 0 or historical_rate <= 0:
                self.logger.warning(
                    f"Invalid rates: current={current_rate}, historical={historical_rate}"
                )
                return 0.0
            
            if amount <= 0:
                self.logger.warning(f"Invalid exchange amount: {amount}")
                return 0.0
            
            # Calculate proceeds and cost
            proceeds_gbp = amount * current_rate
            cost_gbp = amount * historical_rate
            
            fx_gain_loss = proceeds_gbp - cost_gbp
            
            self.logger.debug(
                f"Cash exchange: {amount} @ {historical_rate} -> "
                f"{current_rate} = {fx_gain_loss:.2f} GBP"
            )
            
            return fx_gain_loss
            
        except Exception as e:
            self.logger.error(f"Error calculating cash exchange gain/loss: {e}")
            return 0.0
    
    def calculate_weighted_average_fx_rate(
        self,
        transactions: list,
        quantity_field: str = 'quantity',
        fx_rate_field: str = 'fx_rate'
    ) -> float:
        """
        Calculate weighted average FX rate from multiple transactions.
        
        This is used when multiple acquisitions at different rates are
        matched to a single disposal.
        
        Args:
            transactions: List of transaction objects
            quantity_field: Name of the quantity field
            fx_rate_field: Name of the FX rate field
            
        Returns:
            Weighted average FX rate
        """
        try:
            total_weighted = 0.0
            total_quantity = 0.0
            
            for tx in transactions:
                quantity = getattr(tx, quantity_field, 0)
                
                # Try to get FX rate from currency object first
                if hasattr(tx, 'currency') and hasattr(tx.currency, 'rate_to_base'):
                    fx_rate = tx.currency.rate_to_base
                else:
                    fx_rate = getattr(tx, fx_rate_field, 1.0)
                
                total_weighted += abs(quantity) * fx_rate
                total_quantity += abs(quantity)
            
            if total_quantity == 0:
                return 1.0  # Default to no conversion
            
            weighted_avg = total_weighted / total_quantity
            
            self.logger.debug(
                f"Weighted average FX rate: {weighted_avg:.4f} "
                f"from {len(transactions)} transactions"
            )
            
            return weighted_avg
            
        except Exception as e:
            self.logger.error(f"Error calculating weighted average FX rate: {e}")
            return 1.0
