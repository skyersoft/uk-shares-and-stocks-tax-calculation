"""Unit tests for the disposal calculator."""
import pytest
from datetime import datetime, timedelta

from src.main.python.services.disposal_calculator import UKDisposalCalculator
from src.main.python.models.domain_models import (
    Transaction,
    TransactionType,
    Security,
    Currency,
    Disposal
)


class TestUKDisposalCalculator:
    """Unit tests for the UK Disposal Calculator."""
    
    def test_simple_disposal_calculation(self):
        """Test a simple disposal calculation."""
        calculator = UKDisposalCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create transactions
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 6, 1),
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100.0,
            price_per_unit=5.0,
            commission=8.0,
            taxes=2.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Calculate disposal
        disposal = calculator.calculate_disposal(
            sell_transaction=sell_transaction,
            matched_buys=[buy_transaction]
        )
        
        # Check disposal details
        assert disposal is not None, "Disposal should not be None"
        assert disposal.security == security, "Security should match the original security"
        assert disposal.sell_date == sell_transaction.date, "Sell date should match transaction date"
        assert disposal.quantity == 100.0, f"Quantity should be 100.0, got {disposal.quantity}"
        # 100 * 7.0 - 10.0 = 690.0
        assert disposal.proceeds == 690.0, f"Proceeds should be 690.0, got {disposal.proceeds}"
        # 100 * 5.0 = 500.0
        assert disposal.cost_basis == 500.0, f"Cost basis should be 500.0, got {disposal.cost_basis}"
        # 8.0 + 2.0 = 10.0
        assert disposal.expenses == 10.0, f"Expenses should be 10.0, got {disposal.expenses}"
        # 690.0 - 500.0 - 10.0 = 180.0
        assert disposal.gain_or_loss == 180.0, f"Gain/loss should be 180.0, got {disposal.gain_or_loss}"
        # Buy is before sell
        assert disposal.matching_rule == "section-104", f"Rule should be section-104, got {disposal.matching_rule}"
    
    def test_same_day_disposal(self):
        """Test a same-day disposal calculation."""
        calculator = UKDisposalCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create transactions on the same day
        same_day = datetime(2024, 6, 1, 12, 0)
        
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=same_day,
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=same_day,
            quantity=100.0,
            price_per_unit=5.0,
            commission=8.0,
            taxes=2.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Calculate disposal
        disposal = calculator.calculate_disposal(
            sell_transaction=sell_transaction,
            matched_buys=[buy_transaction]
        )
        
        # Check disposal details
        assert disposal.matching_rule == "same-day"
    
    def test_bed_and_breakfast_disposal(self):
        """Test a bed & breakfast disposal calculation."""
        calculator = UKDisposalCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create a sell transaction
        sell_date = datetime(2024, 6, 1)
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=sell_date,
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create a buy transaction within 30 days after the sell
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=sell_date + timedelta(days=15),
            quantity=100.0,
            price_per_unit=5.0,
            commission=8.0,
            taxes=2.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Calculate disposal
        disposal = calculator.calculate_disposal(
            sell_transaction=sell_transaction,
            matched_buys=[buy_transaction]
        )
        
        # Check disposal details
        assert disposal.matching_rule == "30-day"
    
    def test_foreign_currency_disposal(self):
        """Test a disposal with currency conversion."""
        calculator = UKDisposalCalculator()
        
        # Create a security
        security = Security(isin="US0378331005", symbol="AAPL")
        
        # Create transactions
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 6, 1),
            quantity=-100.0,
            price_per_unit=200.0,
            commission=20.0,
            taxes=0.0,
            currency=Currency(code="USD", rate_to_base=0.78)  # USD to GBP
        )
        
        buy_transaction = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=100.0,
            price_per_unit=150.0,
            commission=15.0,
            taxes=5.0,
            currency=Currency(code="USD", rate_to_base=0.75)  # USD to GBP at time of purchase
        )
        
        # Calculate disposal
        disposal = calculator.calculate_disposal(
            sell_transaction=sell_transaction,
            matched_buys=[buy_transaction]
        )
        
        # Check disposal details
        assert disposal is not None, "Disposal should not be None"
        
        # Debug prints
        print(f"\nDEBUG VALUES:")
        print(f"Proceeds: {disposal.proceeds}")
        print(f"Cost basis: {disposal.cost_basis}")
        print(f"Expenses: {disposal.expenses}")
        print(f"Gain/Loss: {disposal.gain_or_loss}")
        print(f"\nCalculation details:")
        sell_qty = abs(sell_transaction.quantity)
        sell_price = sell_transaction.price_per_unit
        sell_comm = sell_transaction.commission
        sell_rate = sell_transaction.currency.rate_to_base
        buy_qty = buy_transaction.quantity
        buy_price = buy_transaction.price_per_unit
        buy_comm = buy_transaction.commission
        buy_tax = buy_transaction.taxes
        buy_rate = buy_transaction.currency.rate_to_base
        
        print(f"Expected proceeds: (100 * 200 - 20) * 0.78 = {(sell_qty * sell_price - sell_comm) * sell_rate}")
        print(f"Expected cost: (100 * 150) * 0.75 = {(buy_qty * buy_price) * buy_rate}")
        print(f"Expected expenses: (15 + 5) * 0.75 = {(buy_comm + buy_tax) * buy_rate}")
        
        # Proceeds in GBP: (100 * 200 - 20) * 0.78 = 15,584.40
        assert abs(disposal.proceeds - 15584.4) < 0.01, f"Proceeds should be approx 15584.4, but got {disposal.proceeds}"
        
        # Cost basis in GBP: (100 * 150) * 0.75 = 11,250.00
        assert abs(disposal.cost_basis - 11250.0) < 0.01, f"Cost basis should be approx 11250.0, but got {disposal.cost_basis}"
        
        # Expenses in GBP: (15 + 5) * 0.75 = 15.00
        assert abs(disposal.expenses - 15.0) < 0.01, f"Expenses should be approx 15.0, but got {disposal.expenses}"
        
        # Gain in GBP: 15,584.40 - 11,250.00 - 15.00 = 4,319.40
        assert abs(disposal.gain_or_loss - 4319.4) < 0.01, f"Gain/loss should be approx 4319.4, but got {disposal.gain_or_loss}"
    
    def test_multiple_matched_buys(self):
        """Test a disposal with multiple matched buy transactions."""
        calculator = UKDisposalCalculator()
        
        # Create a security
        security = Security(isin="GB00B16KPT44", symbol="HSBA")
        
        # Create sell transaction
        sell_transaction = Transaction(
            transaction_id="sell1",
            transaction_type=TransactionType.SELL,
            security=security,
            date=datetime(2024, 6, 1),
            quantity=-100.0,
            price_per_unit=7.0,
            commission=10.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Create multiple buy transactions
        buy1 = Transaction(
            transaction_id="buy1",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 1, 1),
            quantity=40.0,
            price_per_unit=4.0,
            commission=5.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        buy2 = Transaction(
            transaction_id="buy2",
            transaction_type=TransactionType.BUY,
            security=security,
            date=datetime(2024, 2, 1),
            quantity=60.0,
            price_per_unit=5.0,
            commission=6.0,
            taxes=0.0,
            currency=Currency(code="GBP", rate_to_base=1.0)
        )
        
        # Calculate disposal
        disposal = calculator.calculate_disposal(
            sell_transaction=sell_transaction,
            matched_buys=[buy1, buy2]
        )
        
        # Check disposal details
        assert disposal is not None, "Disposal should not be None"
        assert disposal.quantity == 100.0, f"Quantity should be 100.0, but got {disposal.quantity}"
        assert disposal.proceeds == 690.0, f"Proceeds should be 690.0, but got {disposal.proceeds}"  # 100 * 7.0 - 10.0 = 690.0
        
        # Cost basis: (40 * 4.0) + (60 * 5.0) = 160.0 + 300.0 = 460.0
        assert disposal.cost_basis == 460.0, f"Cost basis should be 460.0, but got {disposal.cost_basis}"
        
        # Expenses: 5.0 + 6.0 = 11.0
        assert disposal.expenses == 11.0, f"Expenses should be 11.0, but got {disposal.expenses}"
        
        # Gain: 690.0 - 460.0 - 11.0 = 219.0
        assert disposal.gain_or_loss == 219.0, f"Gain/loss should be 219.0, but got {disposal.gain_or_loss}"
