"""Disposal calculator implementation."""
import logging
from datetime import datetime
from typing import List, Dict, Optional

from ..interfaces.calculator_interfaces import DisposalCalculatorInterface
from ..models.domain_models import Transaction, Disposal


class UKDisposalCalculator(DisposalCalculatorInterface):
    """UK-specific implementation of disposal calculation."""
    
    def __init__(self):
        """Initialize the disposal calculator."""
        self.logger = logging.getLogger(__name__)
    
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
            Disposal object with gain/loss calculation
        """
        self.logger.info(
            f"Calculating disposal for {sell_transaction.transaction_id} - "
            f"{abs(sell_transaction.quantity)} shares of {sell_transaction.security.get_display_name()}"
        )
        
        # Calculate proceeds (selling price less costs)
        gross_proceeds = abs(sell_transaction.quantity) * sell_transaction.price_per_unit
        selling_costs = sell_transaction.commission + sell_transaction.taxes
        net_proceeds = (gross_proceeds - selling_costs) * sell_transaction.currency.rate_to_base
        
        # Debug log for proceeds calculation
        self.logger.debug(f"Gross proceeds: {gross_proceeds}, Selling costs: {selling_costs}")
        self.logger.debug(f"Currency rate: {sell_transaction.currency.rate_to_base}")
        self.logger.debug(f"Net proceeds in base currency: {net_proceeds}")
        
        # Calculate cost basis from matched buys
        total_cost = 0.0
        total_expenses = 0.0
        matching_rule = ""
        
        for buy_tx in matched_buys:
            # Calculate the base currency cost for this portion of the matched buy
            acquisition_cost = buy_tx.quantity * buy_tx.price_per_unit
            acquisition_expenses = buy_tx.commission + buy_tx.taxes
            
            # Convert to base currency if needed
            base_cost = acquisition_cost * buy_tx.currency.rate_to_base
            base_expenses = acquisition_expenses * buy_tx.currency.rate_to_base
            
            total_cost += base_cost
            total_expenses += base_expenses
            
            # Determine the matching rule (use the first match's rule)
            if not matching_rule:
                days_difference = (sell_transaction.date.date() - buy_tx.date.date()).days
                if days_difference == 0:
                    matching_rule = "same-day"
                elif days_difference < 0 and abs(days_difference) <= 30:
                    matching_rule = "30-day"
                else:
                    matching_rule = "section-104"
        
        # Create the disposal object
        disposal = Disposal(
            security=sell_transaction.security,
            sell_date=sell_transaction.date,
            quantity=abs(sell_transaction.quantity),
            proceeds=net_proceeds,
            cost_basis=total_cost,
            expenses=total_expenses,
            matching_rule=matching_rule
        )
        
        self.logger.info(
            f"Disposal calculation: Proceeds={disposal.proceeds:.2f}, "
            f"Cost basis={disposal.cost_basis:.2f}, "
            f"Expenses={disposal.expenses:.2f}, "
            f"Gain/Loss={disposal.gain_or_loss:.2f}, "
            f"Rule={disposal.matching_rule}"
        )
        
        return disposal
