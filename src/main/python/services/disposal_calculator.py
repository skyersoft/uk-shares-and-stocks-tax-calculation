"""Disposal calculator implementation with FX tracking."""
import logging
from datetime import datetime
from typing import List, Dict, Optional

from ..interfaces.calculator_interfaces import DisposalCalculatorInterface
from ..models.domain_models import Transaction, Disposal
from .fx_calculator import FXCalculator


class UKDisposalCalculator(DisposalCalculatorInterface):
    """UK-specific implementation of disposal calculation with FX tracking."""
    
    def __init__(self):
        """Initialize the disposal calculator."""
        self.logger = logging.getLogger(__name__)
        self.fx_calculator = FXCalculator()
    
    def calculate_disposal(
        self, 
        sell_transaction: Transaction, 
        matched_buys: List[Transaction]
    ) -> Disposal:
        """
        Calculate the disposal details for a sell transaction.
        
        Args:
            sell_transaction: The sell transaction
            matched_buys: List of matched buy transactions
            
        Returns:
            Disposal object with comprehensive gain/loss calculation
        """
        self.logger.info(
            f"Calculating disposal for {sell_transaction.transaction_id} - "
            f"{abs(sell_transaction.quantity)} shares of "
            f"{sell_transaction.security.get_display_name()}"
        )
        
        # Calculate proceeds (selling price less costs)
        gross_proceeds = abs(sell_transaction.quantity) * sell_transaction.price_per_unit
        selling_costs = sell_transaction.commission + sell_transaction.taxes
        net_proceeds = (gross_proceeds - selling_costs) * sell_transaction.currency.rate_to_base
        
        # Extract proceeds details
        proceeds_original_amount = gross_proceeds
        proceeds_original_currency = sell_transaction.currency.code
        proceeds_fx_rate = sell_transaction.currency.rate_to_base
        proceeds_commission = sell_transaction.commission * proceeds_fx_rate
        
        # Calculate cost basis from matched buys
        total_cost = 0.0
        total_expenses = 0.0
        cost_original_amount = 0.0
        total_quantity = 0.0
        acquisition_date = None
        matching_rule = ""
        
        for buy_tx in matched_buys:
            # Calculate the base currency cost for this portion
            acquisition_cost = buy_tx.quantity * buy_tx.price_per_unit
            acquisition_expenses = buy_tx.commission + buy_tx.taxes
            
            # Convert to base currency if needed
            base_cost = acquisition_cost * buy_tx.currency.rate_to_base
            base_expenses = acquisition_expenses * buy_tx.currency.rate_to_base
            
            total_cost += base_cost
            total_expenses += base_expenses
            cost_original_amount += acquisition_cost
            total_quantity += buy_tx.quantity
            
            # Track earliest acquisition date
            if acquisition_date is None or buy_tx.date < acquisition_date:
                acquisition_date = buy_tx.date
            
            # Determine the matching rule (use the first match's rule)
            if not matching_rule:
                days_diff = (sell_transaction.date.date() - buy_tx.date.date()).days
                if days_diff == 0:
                    matching_rule = "same-day"
                elif days_diff < 0 and abs(days_diff) <= 30:
                    matching_rule = "bed-breakfast"
                else:
                    matching_rule = "section104"
        
        # Get cost currency and weighted average FX rate
        cost_original_currency = matched_buys[0].currency.code if matched_buys else 'GBP'
        cost_fx_rate = self.fx_calculator.calculate_weighted_average_fx_rate(matched_buys)
        cost_commission = sum(buy.commission * buy.currency.rate_to_base for buy in matched_buys)
        
        # Calculate FX gain/loss component
        fx_gain_loss = self.fx_calculator.calculate_disposal_fx_gain_loss(
            cost_original_amount=cost_original_amount,
            cost_fx_rate=cost_fx_rate,
            proceeds_original_amount=proceeds_original_amount,
            proceeds_fx_rate=proceeds_fx_rate
        )
        
        # Create the disposal object with error handling
        try:
            disposal = Disposal(
                security=sell_transaction.security,
                sell_date=sell_transaction.date,
                quantity=abs(sell_transaction.quantity),
                proceeds=net_proceeds,
                cost_basis=total_cost,
                expenses=total_expenses,
                matching_rule=matching_rule,
                
                # Detailed cost breakdown
                cost_original_amount=cost_original_amount,
                cost_original_currency=cost_original_currency,
                cost_fx_rate=cost_fx_rate,
                cost_commission=cost_commission,
                acquisition_date=acquisition_date,
                
                # Detailed proceeds breakdown
                proceeds_original_amount=proceeds_original_amount,
                proceeds_original_currency=proceeds_original_currency,
                proceeds_fx_rate=proceeds_fx_rate,
                proceeds_commission=proceeds_commission,
                
                # Tax and FX tracking
                withholding_tax=sell_transaction.withholding_tax,
                country=sell_transaction.country,
                fx_gain_loss=fx_gain_loss
            )
        except Exception as e:
            self.logger.error(
                f"Failed to create disposal for {sell_transaction.transaction_id}: {e}"
            )
            raise ValueError(
                f"Disposal calculation failed for {sell_transaction.security.get_display_name()}: {e}"
            ) from e
        
        self.logger.info(
            f"Disposal calculation: Proceeds={disposal.proceeds:.2f}, "
            f"Cost basis={disposal.cost_basis:.2f}, "
            f"Expenses={disposal.expenses:.2f}, "
            f"FX gain/loss={disposal.fx_gain_loss:.2f}, "
            f"CGT gain/loss={disposal.cgt_gain_loss:.2f}, "
            f"Total gain/loss={disposal.gain_or_loss:.2f}, "
            f"Rule={disposal.matching_rule}"
        )
        
        return disposal
