"""Unit tests for enhanced Transaction model currency support.

This test suite verifies the new currency support functionality
added to the Transaction model, including validation, conversion,
and additional calculation methods.
"""
from datetime import datetime
from uuid import UUID

from src.main.python.models.domain_models import (
    Transaction, TransactionType, Security, Currency
)


class TestTransactionModelEnhanced:
    """Test cases for enhanced Transaction model currency support."""
    
    def test_transaction_validation_positive_currency_rate(self):
        """Test that transaction validation requires positive currency rate."""
        # Valid currency rate should work
        valid_currency = Currency(code="USD", rate_to_base=0.8)
        transaction = Transaction(currency=valid_currency)
        assert transaction.currency.rate_to_base == 0.8
        
        # Invalid currency rate should raise error
        try:
            invalid_currency = Currency(code="USD", rate_to_base=-0.5)
            Transaction(currency=invalid_currency)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency rate must be positive" in str(e)
    
    def test_transaction_validation_negative_values(self):
        """Test validation of negative price, commission, and taxes."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        # Negative price should raise error
        try:
            Transaction(price_per_unit=-10.0, currency=currency)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Price per unit cannot be negative" in str(e)
        
        # Negative commission should raise error
        try:
            Transaction(commission=-5.0, currency=currency)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Commission cannot be negative" in str(e)
        
        # Negative taxes should raise error
        try:
            Transaction(taxes=-1.0, currency=currency)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Taxes cannot be negative" in str(e)
    
    def test_net_amount_buy_transaction(self):
        """Test net_amount calculation for buy transactions."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_type=TransactionType.BUY,
            quantity=100.0,
            price_per_unit=10.50,
            commission=9.95,
            taxes=0.50,
            currency=currency
        )
        
        # For buy: net_amount = total_cost
        # = 100 * 10.50 + 9.95 + 0.50 = 1060.45
        assert transaction.net_amount == 1060.45
        assert transaction.net_amount == transaction.total_cost
    
    def test_net_amount_sell_transaction(self):
        """Test net_amount calculation for sell transactions."""
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        transaction = Transaction(
            transaction_type=TransactionType.SELL,
            quantity=-50.0,
            price_per_unit=12.75,
            commission=9.95,
            taxes=1.25,
            currency=currency
        )
        
        # For sell: net_amount = proceeds = quantity * price - commission - taxes
        # = 50 * 12.75 - 9.95 - 1.25 = 637.50 - 11.20 = 626.30
        expected_net = 50.0 * 12.75 - 9.95 - 1.25
        assert transaction.net_amount == expected_net
        assert transaction.net_amount == 626.30
    
    def test_net_amount_in_base_currency(self):
        """Test net_amount_in_base_currency conversion."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        # Buy transaction
        buy_transaction = Transaction(
            transaction_type=TransactionType.BUY,
            quantity=100.0,
            price_per_unit=10.00,
            commission=5.00,
            taxes=2.00,
            currency=currency
        )
        
        # net_amount = 100 * 10 + 5 + 2 = 1007 USD
        # net_amount_in_base = 1007 * 0.8 = 805.6 GBP
        assert buy_transaction.net_amount == 1007.0
        assert buy_transaction.net_amount_in_base_currency == 805.6
        
        # Sell transaction
        sell_transaction = Transaction(
            transaction_type=TransactionType.SELL,
            quantity=-50.0,
            price_per_unit=15.00,
            commission=5.00,
            taxes=2.00,
            currency=currency
        )
        
        # net_amount = 50 * 15 - 5 - 2 = 743 USD
        # net_amount_in_base = 743 * 0.8 = 594.4 GBP
        assert sell_transaction.net_amount == 743.0
        assert sell_transaction.net_amount_in_base_currency == 594.4
    
    def test_individual_component_base_currency_conversions(self):
        """Test individual component conversions to base currency."""
        currency = Currency(code="EUR", rate_to_base=0.85)
        
        transaction = Transaction(
            quantity=100.0,
            price_per_unit=20.00,
            commission=10.00,
            taxes=5.00,
            currency=currency
        )
        
        # Test individual conversions
        assert transaction.commission_in_base_currency == 10.0 * 0.85  # 8.5 GBP
        assert transaction.taxes_in_base_currency == 5.0 * 0.85  # 4.25 GBP
        assert transaction.price_per_unit_in_base_currency == 20.0 * 0.85  # 17.0 GBP
    
    def test_convert_to_currency_method(self):
        """Test convert_to_currency method."""
        # Original transaction in USD
        usd_currency = Currency(code="USD", rate_to_base=0.8)
        eur_currency = Currency(code="EUR", rate_to_base=0.85)
        
        original_transaction = Transaction(
            transaction_id="TX123",
            transaction_type=TransactionType.BUY,
            quantity=100.0,
            price_per_unit=10.00,  # 10 USD
            commission=5.00,       # 5 USD
            taxes=2.00,           # 2 USD
            currency=usd_currency
        )
        
        # Convert to EUR
        converted_transaction = original_transaction.convert_to_currency(eur_currency)
        
        # Conversion factor = 0.8 / 0.85 = 0.9411764705882353
        conversion_factor = 0.8 / 0.85
        
        assert converted_transaction.transaction_id == "TX123"
        assert converted_transaction.transaction_type == TransactionType.BUY
        assert converted_transaction.quantity == 100.0  # Quantity unchanged
        assert abs(converted_transaction.price_per_unit - (10.0 * conversion_factor)) < 0.0001
        assert abs(converted_transaction.commission - (5.0 * conversion_factor)) < 0.0001
        assert abs(converted_transaction.taxes - (2.0 * conversion_factor)) < 0.0001
        assert converted_transaction.currency.code == "EUR"
        
        # Original transaction should be unchanged
        assert original_transaction.price_per_unit == 10.0
        assert original_transaction.currency.code == "USD"
    
    def test_convert_to_currency_validation(self):
        """Test convert_to_currency method validation."""
        currency = Currency(code="USD", rate_to_base=0.8)
        transaction = Transaction(currency=currency)
        
        # Should raise error when trying to create invalid target currency
        try:
            invalid_currency = Currency(code="EUR", rate_to_base=-0.5)
            assert False, "Should have raised ValueError during Currency creation"
        except ValueError as e:
            assert "Currency rate must be positive" in str(e)
        
        # Should raise error if source currency is None
        no_currency_transaction = Transaction()
        no_currency_transaction.currency = None
        try:
            no_currency_transaction.convert_to_currency(currency)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Source currency is required for conversion" in str(e)
    
    def test_is_same_currency_method(self):
        """Test is_same_currency method."""
        usd_currency = Currency(code="USD", rate_to_base=0.8)
        eur_currency = Currency(code="EUR", rate_to_base=0.85)
        another_usd_currency = Currency(code="USD", rate_to_base=0.75)  # Different rate
        
        transaction = Transaction(currency=usd_currency)
        
        # Same currency code should return True
        assert transaction.is_same_currency(another_usd_currency)
        
        # Different currency code should return False
        assert not transaction.is_same_currency(eur_currency)
        
        # Transaction with no currency should return False
        no_currency_transaction = Transaction()
        no_currency_transaction.currency = None
        assert not no_currency_transaction.is_same_currency(usd_currency)
    
    def test_get_currency_display_method(self):
        """Test get_currency_display method."""
        currency = Currency(code="USD", rate_to_base=0.8)
        transaction = Transaction(currency=currency)
        
        display = transaction.get_currency_display()
        assert "USD" in display
        assert "0.8000" in display
        
        # Transaction with no currency
        no_currency_transaction = Transaction()
        no_currency_transaction.currency = None
        assert no_currency_transaction.get_currency_display() == "No Currency"
    
    def test_create_buy_transaction_factory(self):
        """Test create_buy_transaction factory method."""
        security = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime(2024, 1, 15)
        
        transaction = Transaction.create_buy_transaction(
            transaction_id="BUY123",
            security=security,
            date=date,
            quantity=100.0,
            price_per_unit=5.25,
            currency=currency,
            commission=9.95,
            taxes=0.50
        )
        
        assert transaction.transaction_id == "BUY123"
        assert transaction.transaction_type == TransactionType.BUY
        assert transaction.security == security
        assert transaction.date == date
        assert transaction.quantity == 100.0
        assert transaction.price_per_unit == 5.25
        assert transaction.commission == 9.95
        assert transaction.taxes == 0.50
        assert transaction.currency == currency
    
    def test_create_buy_transaction_validation(self):
        """Test create_buy_transaction validation."""
        security = Security.create_with_isin("GB00B16KPT44")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime.now()
        
        # Should raise error for non-positive quantity
        try:
            Transaction.create_buy_transaction(
                transaction_id="BUY123",
                security=security,
                date=date,
                quantity=0.0,  # Invalid
                price_per_unit=5.25,
                currency=currency
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Buy transaction quantity must be positive" in str(e)
    
    def test_create_sell_transaction_factory(self):
        """Test create_sell_transaction factory method."""
        security = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime(2024, 1, 15)
        
        transaction = Transaction.create_sell_transaction(
            transaction_id="SELL123",
            security=security,
            date=date,
            quantity=-50.0,
            price_per_unit=6.75,
            currency=currency,
            commission=9.95,
            taxes=1.25
        )
        
        assert transaction.transaction_id == "SELL123"
        assert transaction.transaction_type == TransactionType.SELL
        assert transaction.security == security
        assert transaction.date == date
        assert transaction.quantity == -50.0
        assert transaction.price_per_unit == 6.75
        assert transaction.commission == 9.95
        assert transaction.taxes == 1.25
        assert transaction.currency == currency
    
    def test_create_sell_transaction_validation(self):
        """Test create_sell_transaction validation."""
        security = Security.create_with_isin("GB00B16KPT44")
        currency = Currency(code="GBP", rate_to_base=1.0)
        date = datetime.now()
        
        # Should raise error for non-negative quantity
        try:
            Transaction.create_sell_transaction(
                transaction_id="SELL123",
                security=security,
                date=date,
                quantity=50.0,  # Invalid (should be negative)
                price_per_unit=5.25,
                currency=currency
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Sell transaction quantity must be negative" in str(e)
    
    def test_get_transaction_summary_method(self):
        """Test get_transaction_summary method."""
        security = Security.create_with_isin("GB00B16KPT44", symbol="HSBA")
        currency = Currency(code="GBP", rate_to_base=1.0)
        
        # Buy transaction
        buy_transaction = Transaction(
            transaction_type=TransactionType.BUY,
            security=security,
            quantity=100.0,
            price_per_unit=5.25,
            currency=currency
        )
        
        buy_summary = buy_transaction.get_transaction_summary()
        assert "Bought 100.0 shares of HSBA at 5.25 GBP per share" == buy_summary
        
        # Sell transaction
        sell_transaction = Transaction(
            transaction_type=TransactionType.SELL,
            security=security,
            quantity=-50.0,
            price_per_unit=6.75,
            currency=currency
        )
        
        sell_summary = sell_transaction.get_transaction_summary()
        assert "Sold 50.0 shares of HSBA at 6.75 GBP per share" == sell_summary
        
        # Transaction with no security
        no_security_transaction = Transaction(
            transaction_type=TransactionType.BUY,
            quantity=25.0,
            price_per_unit=10.00,
            currency=currency
        )
        
        no_security_summary = no_security_transaction.get_transaction_summary()
        assert "Bought 25.0 shares of Unknown at 10.00 GBP per share" == no_security_summary
    
    def test_currency_conversion_edge_cases(self):
        """Test currency conversion with edge cases."""
        # Convert from GBP to USD
        gbp_currency = Currency(code="GBP", rate_to_base=1.0)
        usd_currency = Currency(code="USD", rate_to_base=0.8)
        
        gbp_transaction = Transaction(
            quantity=100.0,
            price_per_unit=10.00,  # 10 GBP
            commission=5.00,       # 5 GBP
            currency=gbp_currency
        )
        
        # Convert to USD: conversion_factor = 1.0 / 0.8 = 1.25
        usd_transaction = gbp_transaction.convert_to_currency(usd_currency)
        
        assert usd_transaction.price_per_unit == 12.5  # 10 * 1.25
        assert usd_transaction.commission == 6.25      # 5 * 1.25
        assert usd_transaction.currency.code == "USD"
        
        # Verify base currency amounts are the same
        assert abs(gbp_transaction.total_cost_in_base_currency - 
                  usd_transaction.total_cost_in_base_currency) < 0.0001
    
    def test_default_currency_assignment(self):
        """Test that transactions get default GBP currency when none specified."""
        transaction = Transaction()
        
        assert transaction.currency is not None
        assert transaction.currency.code == "GBP"
        assert transaction.currency.rate_to_base == 1.0
    
    def test_currency_required_for_base_conversions(self):
        """Test that currency is required for base currency conversions."""
        transaction = Transaction()
        transaction.currency = None
        
        # Should raise errors when trying to convert without currency
        try:
            _ = transaction.total_cost_in_base_currency
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency is required for base currency conversion" in str(e)
        
        try:
            _ = transaction.net_amount_in_base_currency
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency is required for base currency conversion" in str(e)
        
        try:
            _ = transaction.commission_in_base_currency
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency is required for base currency conversion" in str(e)
        
        try:
            _ = transaction.taxes_in_base_currency
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency is required for base currency conversion" in str(e)
        
        try:
            _ = transaction.price_per_unit_in_base_currency
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Currency is required for base currency conversion" in str(e)
