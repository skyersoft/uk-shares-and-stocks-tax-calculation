"""Foreign exchange gain/loss calculator for HMRC compliance."""
import logging
from typing import Optional, List


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
                    f"Invalid FX rates: cost={cost_fx_rate}, proceeds={proceeds_fx_rate}. "
                    f"Using zero FX gain/loss."
                )
                return 0.0
            
            # Validate amounts
            if cost_original_amount < 0 or proceeds_original_amount < 0:
                self.logger.warning(
                    f"Negative amounts detected: cost={cost_original_amount}, "
                    f"proceeds={proceeds_original_amount}"
                )
            
            # If both rates are the same (or both GBP), no FX gain/loss
            if abs(cost_fx_rate - proceeds_fx_rate) < 0.0001:
                self.logger.debug(
                    f"FX rates identical ({cost_fx_rate:.4f}), no FX gain/loss"
                )
                return 0.0
            
            # If rates are 1.0, this is likely GBP-GBP transaction
            if abs(cost_fx_rate - 1.0) < 0.0001 and abs(proceeds_fx_rate - 1.0) < 0.0001:
                self.logger.debug("GBP-GBP transaction, no FX gain/loss")
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
        transactions: List
    ) -> float:
        """Calculate weighted average FX rate from multiple transactions.
        
        Args:
            transactions: List of Transaction objects
            
        Returns:
            Weighted average FX rate
        """
        if not transactions:
            self.logger.warning("No transactions provided for weighted average calculation")
            return 1.0
        
        try:
            total_amount = 0.0
            weighted_sum = 0.0
            
            for tx in transactions:
                amount = abs(tx.quantity) * tx.price_per_unit
                if amount > 0:
                    fx_rate = tx.currency.rate_to_base if hasattr(tx, 'currency') else 1.0
                    if fx_rate <= 0:
                        self.logger.warning(
                            f"Invalid FX rate {fx_rate} for transaction {tx.transaction_id}, "
                            f"using 1.0"
                        )
                        fx_rate = 1.0
                    
                    weighted_sum += amount * fx_rate
                    total_amount += amount
            
            if total_amount > 0:
                weighted_avg = weighted_sum / total_amount
                self.logger.debug(
                    f"Weighted average FX rate: {weighted_avg:.4f} "
                    f"from {len(transactions)} transactions"
                )
                return weighted_avg
            else:
                self.logger.warning("Total amount is zero, returning default rate 1.0")
                return 1.0
                
        except Exception as e:
            self.logger.error(f"Error calculating weighted average FX rate: {e}")
            return 1.0
