"""
Unit tests for StandardTransaction model.

Test Coverage Goals:
- 100% code coverage for StandardTransaction class
- All validation rules tested
- All calculation methods tested
- Edge cases and error conditions tested
- SOLID principles verified

Test Organization:
- TestStandardTransactionCreation: Basic object creation
- TestStandardTransactionValidation: Validation logic
- TestStandardTransactionCalculations: Automatic calculations
- TestStandardTransactionMultiCurrency: FX handling
- TestStandardTransactionSerialization: to_dict() method
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from src.main.python.models.standard_transaction import (
    StandardTransaction,
    TransactionType,
    AssetClass,
    round_currency
)


class TestRoundCurrency:
    """Test the round_currency helper function."""
    
    def test_round_currency_two_decimals(self):
        """Should round to 2 decimal places."""
        assert round_currency(Decimal('10.123')) == Decimal('10.12')
        assert round_currency(Decimal('10.126')) == Decimal('10.13')
    
    def test_round_currency_bankers_rounding(self):
        """Should use ROUND_HALF_UP (rounds .5 up)."""
        assert round_currency(Decimal('10.125')) == Decimal('10.13')
        assert round_currency(Decimal('10.135')) == Decimal('10.14')
    
    def test_round_currency_already_rounded(self):
        """Should handle already rounded values."""
        assert round_currency(Decimal('10.12')) == Decimal('10.12')


class TestStandardTransactionCreation:
    """Test basic creation of StandardTransaction objects."""
    
    def test_create_minimal_transaction(self):
        """Should create transaction with only required fields."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.symbol == "AAPL"
        assert tx.quantity == Decimal('100')
        assert tx.price == Decimal('150.25')
        assert tx.transaction_currency == "USD"
    
    def test_create_with_all_fields(self):
        """Should create transaction with all fields populated."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            name="Apple Inc",
            isin="US0378331005",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            broker="Trading 212",
            account_id="ACC123",
            transaction_id="TXN456",
            asset_class=AssetClass.STOCK,
            commission=Decimal('5.00'),
            stamp_duty=Decimal('0.50'),
            base_currency="GBP",
            fx_rate_to_base=Decimal('0.79'),
            is_isa=True
        )
        
        assert tx.name == "Apple Inc"
        assert tx.isin == "US0378331005"
        assert tx.broker == "Trading 212"
        assert tx.is_isa is True
    
    def test_default_values(self):
        """Should set correct default values."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.name == ""
        assert tx.broker == "Unknown"
        assert tx.asset_class == AssetClass.STOCK
        assert tx.commission == Decimal('0')
        assert tx.stamp_duty == Decimal('0')
        assert tx.withholding_tax == Decimal('0')
        assert tx.currency_conversion_fee == Decimal('0')
        assert tx.other_fees == Decimal('0')
        assert tx.base_currency == "GBP"
        assert tx.is_isa is False
        assert tx.is_sipp is False
        assert tx.validation_errors == []
        # Should have warning for missing FX rate (USD to GBP)
        assert len(tx.processing_warnings) == 1
        assert "Missing FX rate" in tx.processing_warnings[0]


class TestStandardTransactionCalculations:
    """Test automatic calculation of derived fields."""
    
    def test_calculate_gross_amount(self):
        """Should automatically calculate gross_amount from quantity * price."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.gross_amount == Decimal('15025.00')
    
    def test_calculate_gross_amount_with_negative_quantity(self):
        """Should use absolute value of quantity for gross_amount."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.SELL,
            quantity=Decimal('-100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.gross_amount == Decimal('15025.00')
    
    def test_calculate_net_amount(self):
        """Should calculate net_amount as gross - fees - taxes."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            commission=Decimal('5.00'),
            stamp_duty=Decimal('0.50'),
            withholding_tax=Decimal('2.00')
        )
        
        # gross_amount = 15025.00
        # total_fees = 5.00 + 0.50 = 5.50
        # net_amount = 15025.00 - 5.50 - 2.00 = 15017.50
        assert tx.net_amount == Decimal('15017.50')
    
    def test_total_fees_property(self):
        """Should calculate total_fees from all fee components."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            commission=Decimal('5.00'),
            stamp_duty=Decimal('0.50'),
            currency_conversion_fee=Decimal('1.25'),
            other_fees=Decimal('0.75')
        )
        
        assert tx.total_fees == Decimal('7.50')
    
    def test_preserve_provided_gross_amount(self):
        """Should not override gross_amount if provided."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            gross_amount=Decimal('15000.00')  # Different from calculated
        )
        
        assert tx.gross_amount == Decimal('15000.00')


class TestStandardTransactionMultiCurrency:
    """Test multi-currency and FX rate handling."""
    
    def test_same_currency_sets_fx_rate_to_one(self):
        """Should set fx_rate_to_base to 1.0 for same currency."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="VOD",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('1000'),
            price=Decimal('0.75'),
            transaction_currency="GBP",
            base_currency="GBP"
        )
        
        assert tx.fx_rate_to_base == Decimal('1.0')
        assert tx.fx_rate_source == "Same Currency"
    
    def test_different_currency_requires_fx_rate(self):
        """Should add warning if FX rate missing for cross-currency."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            base_currency="GBP"
        )
        
        assert tx.fx_rate_to_base is None
        assert len(tx.processing_warnings) == 1
        assert "Missing FX rate" in tx.processing_warnings[0]
    
    def test_calculate_base_amounts_with_fx_rate(self):
        """Should calculate base currency amounts when FX rate provided."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.00'),
            transaction_currency="USD",
            base_currency="GBP",
            fx_rate_to_base=Decimal('0.80'),
            commission=Decimal('5.00')
        )
        
        # gross_amount = 15000.00 USD
        # gross_amount_base = 15000.00 * 0.80 = 12000.00 GBP
        assert tx.gross_amount_base == Decimal('12000.00')
        
        # net_amount = 15000.00 - 5.00 = 14995.00 USD
        # net_amount_base = 14995.00 * 0.80 = 11996.00 GBP
        assert tx.net_amount_base == Decimal('11996.00')
        
        # fees_base = 5.00 * 0.80 = 4.00 GBP
        assert tx.fees_base == Decimal('4.00')
    
    def test_currency_normalization(self):
        """Should normalize currency codes to uppercase."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="usd",  # lowercase
            base_currency="gbp"  # lowercase
        )
        
        assert tx.transaction_currency == "USD"
        assert tx.base_currency == "GBP"


class TestStandardTransactionValidation:
    """Test validation logic."""
    
    def test_valid_transaction(self):
        """Should validate a correct transaction."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            base_currency="GBP",
            fx_rate_to_base=Decimal('0.79')
        )
        
        assert tx.validate() is True
        assert len(tx.validation_errors) == 0
    
    def test_missing_symbol(self):
        """Should fail validation if symbol is missing."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="",  # Empty symbol
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.validate() is False
        assert "Symbol is required" in tx.validation_errors
    
    def test_zero_quantity(self):
        """Should fail validation if quantity is zero."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('0'),  # Zero quantity
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.validate() is False
        assert "Quantity cannot be zero" in tx.validation_errors
    
    def test_negative_price(self):
        """Should fail validation if price is negative."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('-150.25'),  # Negative price
            transaction_currency="USD"
        )
        
        assert tx.validate() is False
        assert "Price cannot be negative" in tx.validation_errors
    
    def test_future_date(self):
        """Should fail validation if date is in the future."""
        future_date = datetime.now() + timedelta(days=1)
        tx = StandardTransaction(
            date=future_date,
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        assert tx.validate() is False
        assert "Transaction date cannot be in the future" in tx.validation_errors
    
    def test_invalid_currency_code(self):
        """Should fail validation for invalid currency code."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="XXX"  # Invalid currency
        )
        
        assert tx.validate() is False
        assert "Invalid transaction currency: XXX" in tx.validation_errors
    
    def test_missing_fx_rate_for_cross_currency(self):
        """Should fail validation if FX rate missing for different currencies."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            base_currency="GBP"
            # fx_rate_to_base not provided
        )
        
        assert tx.validate() is False
        assert "FX rate required" in tx.validation_errors[0]
    
    def test_negative_fx_rate(self):
        """Should fail validation if FX rate is negative."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD",
            base_currency="GBP",
            fx_rate_to_base=Decimal('-0.79')  # Negative FX rate
        )
        
        assert tx.validate() is False
        assert "FX rate must be positive" in tx.validation_errors
    
    def test_buy_with_zero_price(self):
        """Should fail validation for BUY with zero price."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('0'),  # Zero price
            transaction_currency="USD"
        )
        
        assert tx.validate() is False
        assert "BUY transaction must have non-zero price" in tx.validation_errors
    
    def test_multiple_validation_errors(self):
        """Should collect multiple validation errors."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="",  # Missing symbol
            transaction_type=TransactionType.BUY,
            quantity=Decimal('0'),  # Zero quantity
            price=Decimal('-150.25'),  # Negative price
            transaction_currency="XXX"  # Invalid currency
        )
        
        assert tx.validate() is False
        assert len(tx.validation_errors) >= 3


class TestStandardTransactionSerialization:
    """Test serialization to dictionary."""
    
    def test_to_dict_basic(self):
        """Should serialize to dictionary."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15, 10, 30),
            symbol="AAPL",
            name="Apple Inc",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        result = tx.to_dict()
        
        assert result['date'] == '2024-01-15T10:30:00'
        assert result['symbol'] == 'AAPL'
        assert result['name'] == 'Apple Inc'
        assert result['transaction_type'] == 'BUY'
        assert result['quantity'] == '100'
        assert result['price'] == '150.25'
        assert result['transaction_currency'] == 'USD'
    
    def test_to_dict_with_optional_fields(self):
        """Should handle None values in serialization."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        result = tx.to_dict()
        
        assert result['isin'] is None
        assert result['cost_basis'] is None
        assert result['realized_pl'] is None
    
    def test_repr(self):
        """Should have readable string representation."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('100'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        repr_str = repr(tx)
        
        assert "StandardTransaction" in repr_str
        assert "2024-01-15" in repr_str
        assert "AAPL" in repr_str
        assert "BUY" in repr_str


class TestStandardTransactionEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_very_small_amounts(self):
        """Should handle very small decimal amounts correctly."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="PENNY",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('10000'),
            price=Decimal('0.001'),
            transaction_currency="GBP"
        )
        
        assert tx.gross_amount == Decimal('10.00')
    
    def test_very_large_amounts(self):
        """Should handle very large amounts correctly."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="BRK.A",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('1'),
            price=Decimal('500000.00'),
            transaction_currency="USD"
        )
        
        assert tx.gross_amount == Decimal('500000.00')
    
    def test_fractional_shares(self):
        """Should handle fractional share quantities."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.BUY,
            quantity=Decimal('0.5'),
            price=Decimal('150.25'),
            transaction_currency="USD"
        )
        
        # 0.5 * 150.25 = 75.125, rounds to 75.13 with ROUND_HALF_UP
        assert tx.gross_amount == Decimal('75.13')
    
    def test_dividend_with_zero_price(self):
        """Should allow DIVIDEND with zero price."""
        tx = StandardTransaction(
            date=datetime(2024, 1, 15),
            symbol="AAPL",
            transaction_type=TransactionType.DIVIDEND,
            quantity=Decimal('2.50'),  # Dividend amount
            price=Decimal('0'),  # Dividends don't have a price
            transaction_currency="GBP",  # Same as base currency
            base_currency="GBP"
        )
        
        # Should not fail validation for dividend with zero price
        assert tx.validate() is True
        assert len(tx.validation_errors) == 0
