"""Unit tests for Transaction model calculations.

This test suite verifies the Transaction model's calculation logic,
including cost calculations, currency conversions, and property methods.
"""
import pytest
from datetime import datetime
from uuid import UUID

from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency
)


class TestTransactionModel:
    """Test cases for Transaction model calculations."""
    
    def test_transaction_creation_with_defaults(self):
        """Test creating a Transaction with default values."""
        transaction = Transaction()
        
        # Should have a valid UUID
        assert isinstance(transaction.id, UUID)
        
        # Default values should be set
        assert transaction.transaction_id == ""
        assert transaction.transaction_type == TransactionType.BUY
        assert transaction.security is None
        assert transaction.date is None
        assert transaction.quantity == 0.0
        assert transaction.price_per_unit == 0.0
        assert transaction.commission == 0.0
        assert transaction.taxes == 0.0
        
        # Currency should default to GBP
        assert transaction.currency is not None
        assert transaction.currency.code == "GBP"
        assert transaction.currency.rate_to_base == 1.0
    
    def test_transaction_creation_with_all_fields(self):
        """Test creating a Transaction with all fields populated."""
        security = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime(2024, 1, 15)
        
        transaction = Transaction(
            transaction_id="TX123456",
            transaction_type=TransactionType.BUY,
            security=security,
            date=date,
            quantity=100.0,
            price_per_unit=525.50,
            commission=9.95,
            taxes=0.50,
            currency=currency
        )
        
        assert transaction.transaction_id == "TX123456"
        assert transaction.transaction_type == TransactionType.BUY
        assert transaction.security == security
        assert transaction.date == date
        assert transaction.quantity == 100.0
        assert transaction.price_per_unit == 525.50
        assert transaction.commission == 9.95
        assert transaction.taxes == 0.50
        assert transaction.currency == currency
        assert isinstance(transaction.id, UUID)
    
    def test_total_cost_calculation_buy_transaction(self):
        """Test total_cost calculation for buy transaction."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_type=TransactionType.BUY,
            quantity=100.0,
            price_per_unit=10.50,
            commission=9.95,
            taxes=0.50,
            currency=currency
        )
        
        # total_cost = abs(quantity) * price_per_unit + commission + taxes
        # = 100 * 10.50 + 9.95 + 0.50 = 1050 + 9.95 + 0.50 = 1060.45
        expected_total = 100.0 * 10.50 + 9.95 + 0.50
        assert transaction.total_cost == expected_total
        assert transaction.total_cost == 1060.45
    
    def test_total_cost_calculation_sell_transaction(self):
        """Test total_cost calculation for sell transaction."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_type=TransactionType.SELL,
            quantity=-50.0,  # Negative for sell
            price_per_unit=12.75,
            commission=9.95,
            taxes=1.25,
            currency=currency
        )
        
        # total_cost = abs(quantity) * price_per_unit + commission + taxes
        # = abs(-50) * 12.75 + 9.95 + 1.25 = 50 * 12.75 + 11.20 = 637.50 + 11.20 = 648.70
        expected_total = abs(-50.0) * 12.75 + 9.95 + 1.25
        assert transaction.total_cost == expected_total
        assert transaction.total_cost == 648.70
    
    def test_total_cost_with_zero_values(self):
        """Test total_cost calculation with zero values."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=0.0,
            price_per_unit=0.0,
            commission=0.0,
            taxes=0.0,
            currency=currency
        )
        
        assert transaction.total_cost == 0.0
    
    def test_total_cost_with_no_commission_or_taxes(self):
        """Test total_cost calculation with no commission or taxes."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=25.0,
            price_per_unit=40.00,
            commission=0.0,
            taxes=0.0,
            currency=currency
        )
        
        # total_cost = 25 * 40.00 + 0 + 0 = 1000.00
        assert transaction.total_cost == 1000.00
    
    def test_total_property_alias(self):
        """Test that total property is an alias for total_cost."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=10.0,
            price_per_unit=15.75,
            commission=5.00,
            taxes=1.00,
            currency=currency
        )
        
        # Both should return the same value
        assert transaction.total == transaction.total_cost
        assert transaction.total == 10.0 * 15.75 + 5.00 + 1.00
        assert transaction.total == 163.50
    
    def test_total_cost_in_base_currency_gbp(self):
        """Test total_cost_in_base_currency with GBP (rate 1.0)."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=100.0,
            price_per_unit=5.25,
            commission=10.00,
            taxes=2.50,
            currency=currency
        )
        
        # total_cost = 100 * 5.25 + 10.00 + 2.50 = 537.50
        # total_cost_in_base = 537.50 * 1.0 = 537.50
        assert transaction.total_cost == 537.50
        assert transaction.total_cost_in_base_currency == 537.50
    
    def test_total_cost_in_base_currency_usd(self):
        """Test total_cost_in_base_currency with USD conversion."""
        currency = Currency(code="USD", rate_to_base=0.8)  # 1 USD = 0.8 GBP
        
        transaction = Transaction(
            quantity=50.0,
            price_per_unit=100.00,
            commission=15.00,
            taxes=5.00,
            currency=currency
        )
        
        # total_cost = 50 * 100.00 + 15.00 + 5.00 = 5020.00 USD
        # total_cost_in_base = 5020.00 * 0.8 = 4016.00 GBP
        assert transaction.total_cost == 5020.00
        assert transaction.total_cost_in_base_currency == 4016.00
    
    def test_total_cost_in_base_currency_eur(self):
        """Test total_cost_in_base_currency with EUR conversion."""
        currency = Currency(code="EUR", rate_to_base=0.85)  # 1 EUR = 0.85 GBP
        
        transaction = Transaction(
            quantity=75.0,
            price_per_unit=20.50,
            commission=8.75,
            taxes=1.25,
            currency=currency
        )
        
        # total_cost = 75 * 20.50 + 8.75 + 1.25 = 1547.50 EUR
        # total_cost_in_base = 1547.50 * 0.85 = 1315.375 GBP
        assert transaction.total_cost == 1547.50
        assert transaction.total_cost_in_base_currency == 1315.375
    
    def test_total_cost_with_fractional_quantities(self):
        """Test total_cost calculation with fractional quantities."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=12.5,
            price_per_unit=8.75,
            commission=3.50,
            taxes=0.25,
            currency=currency
        )
        
        # total_cost = 12.5 * 8.75 + 3.50 + 0.25 = 109.375 + 3.75 = 113.125
        expected_total = 12.5 * 8.75 + 3.50 + 0.25
        assert transaction.total_cost == expected_total
        assert transaction.total_cost == 113.125
    
    def test_total_cost_with_high_precision_values(self):
        """Test total_cost calculation with high precision values."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            quantity=33.333,
            price_per_unit=15.999,
            commission=2.995,
            taxes=0.005,
            currency=currency
        )
        
        # total_cost = 33.333 * 15.999 + 2.995 + 0.005
        expected_total = 33.333 * 15.999 + 2.995 + 0.005
        assert transaction.total_cost == expected_total
    
    def test_transaction_type_validation(self):
        """Test that transaction types are properly set."""
        buy_transaction = Transaction(transaction_type=TransactionType.BUY)
        sell_transaction = Transaction(transaction_type=TransactionType.SELL)
        dividend_transaction = Transaction(transaction_type=TransactionType.DIVIDEND)
        
        assert buy_transaction.transaction_type == TransactionType.BUY
        assert sell_transaction.transaction_type == TransactionType.SELL
        assert dividend_transaction.transaction_type == TransactionType.DIVIDEND
    
    def test_transaction_with_security_object(self):
        """Test transaction with Security object."""
        security = Security.create_with_isin("US0378331005", symbol="AAPL", name="Apple Inc.")
        currency = Currency(code="USD", rate_to_base=0.8)
        
        transaction = Transaction(
            transaction_type=TransactionType.BUY,
            security=security,
            quantity=10.0,
            price_per_unit=150.00,
            commission=5.00,
            currency=currency
        )
        
        assert transaction.security == security
        assert transaction.security.symbol == "AAPL"
        assert transaction.security.get_identifier() == "US0378331005"
        assert transaction.total_cost == 1505.00  # 10 * 150 + 5
        assert transaction.total_cost_in_base_currency == 1204.00  # 1505 * 0.8
    
    def test_transaction_calculations_edge_cases(self):
        """Test transaction calculations with edge cases."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        # Very small quantities
        small_transaction = Transaction(
            quantity=0.001,
            price_per_unit=1000.00,
            commission=0.01,
            taxes=0.001,
            currency=currency
        )
        
        # total_cost = 0.001 * 1000 + 0.01 + 0.001 = 1.011
        assert small_transaction.total_cost == 1.011
        
        # Very large quantities
        large_transaction = Transaction(
            quantity=1000000.0,
            price_per_unit=0.001,
            commission=100.00,
            taxes=50.00,
            currency=currency
        )
        
        # total_cost = 1000000 * 0.001 + 100 + 50 = 1150
        assert large_transaction.total_cost == 1150.00
    
    def test_transaction_negative_quantity_handling(self):
        """Test that negative quantities are handled correctly in calculations."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        # Sell transaction with negative quantity
        transaction = Transaction(
            transaction_type=TransactionType.SELL,
            quantity=-25.0,
            price_per_unit=20.00,
            commission=5.00,
            taxes=1.00,
            currency=currency
        )
        
        # total_cost should use abs(quantity)
        # total_cost = abs(-25) * 20.00 + 5.00 + 1.00 = 506.00
        assert transaction.total_cost == 506.00
        assert transaction.quantity == -25.0  # Original quantity preserved
    
    def test_transaction_currency_rate_edge_cases(self):
        """Test currency conversion with edge case rates."""
        # Very high rate
        high_rate_currency = Currency(code="JPY", rate_to_base=0.0067)
        
        transaction_high = Transaction(
            quantity=100.0,
            price_per_unit=1000.0,
            commission=500.0,
            taxes=100.0,
            currency=high_rate_currency
        )
        
        # total_cost = 100 * 1000 + 500 + 100 = 100600 JPY
        # total_cost_in_base = 100600 * 0.0067 = 674.02 GBP
        assert transaction_high.total_cost == 100600.0
        assert transaction_high.total_cost_in_base_currency == 674.02
        
        # Very low rate (theoretical)
        low_rate_currency = Currency(code="CRYPTO", rate_to_base=50000.0)
        
        transaction_low = Transaction(
            quantity=0.1,
            price_per_unit=0.001,
            commission=0.0001,
            taxes=0.0,
            currency=low_rate_currency
        )
        
        # total_cost = 0.1 * 0.001 + 0.0001 + 0 = 0.0001 + 0.0001 = 0.0002
        # total_cost_in_base = 0.0002 * 50000 = 10.0 GBP
        assert transaction_low.total_cost == 0.0002
        assert transaction_low.total_cost_in_base_currency == 10.0
    
    def test_transaction_unique_ids(self):
        """Test that each Transaction gets a unique ID."""
        transaction1 = Transaction()
        transaction2 = Transaction()
        
        # Should have different UUIDs
        assert transaction1.id != transaction2.id
        assert isinstance(transaction1.id, UUID)
        assert isinstance(transaction2.id, UUID)
    
    def test_transaction_string_representation(self):
        """Test Transaction string representation."""
        security = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_id="TX123",
            transaction_type=TransactionType.BUY,
            security=security,
            quantity=100.0,
            price_per_unit=5.25,
            currency=currency
        )
        
        # Should be able to convert to string without error
        str_repr = str(transaction)
        assert "TX123" in str_repr
        assert "BUY" in str_repr
    
    def test_transaction_field_types(self):
        """Test Transaction field type validation."""
        security = Security.create_with_isin("GB00B16KPT44")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime.now()
        
        transaction = Transaction(
            transaction_id="TX123",
            transaction_type=TransactionType.BUY,
            security=security,
            date=date,
            quantity=100.0,
            price_per_unit=5.25,
            commission=2.50,
            taxes=0.50,
            currency=currency
        )
        
        # Check field types
        assert isinstance(transaction.id, UUID)
        assert isinstance(transaction.transaction_id, str)
        assert isinstance(transaction.transaction_type, TransactionType)
        assert isinstance(transaction.security, Security)
        assert isinstance(transaction.date, datetime)
        assert isinstance(transaction.quantity, float)
        assert isinstance(transaction.price_per_unit, float)
        assert isinstance(transaction.commission, float)
        assert isinstance(transaction.taxes, float)
        assert isinstance(transaction.currency, Currency)
