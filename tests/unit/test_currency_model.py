"""Unit tests for Currency model conversions.

This test suite verifies the Currency model's conversion logic,
validation, and utility methods for handling exchange rates.
"""
from src.main.python.models.domain_models import Currency


class TestCurrencyModel:
    """Test cases for Currency model conversions."""
    
    def test_currency_creation_basic(self):
        """Test creating a Currency with basic values."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        assert currency.code == "USD"
        assert currency.rate_to_base == 0.8
    
    def test_currency_creation_gbp_base(self):
        """Test creating GBP currency (base currency)."""
        gbp = Currency(code="GBP", rate_to_base=1.0)
        
        assert gbp.code == "GBP"
        assert gbp.rate_to_base == 1.0
    
    def test_currency_creation_various_rates(self):
        """Test creating currencies with various exchange rates."""
        currencies = [
            Currency(code="USD", rate_to_base=0.8),      # 1 USD = 0.8 GBP
            Currency(code="EUR", rate_to_base=0.85),     # 1 EUR = 0.85 GBP
            Currency(code="JPY", rate_to_base=0.0067),   # 1 JPY = 0.0067 GBP
            Currency(code="CAD", rate_to_base=0.6),      # 1 CAD = 0.6 GBP
            Currency(code="AUD", rate_to_base=0.55),     # 1 AUD = 0.55 GBP
        ]
        
        assert currencies[0].code == "USD" and currencies[0].rate_to_base == 0.8
        assert currencies[1].code == "EUR" and currencies[1].rate_to_base == 0.85
        assert currencies[2].code == "JPY" and currencies[2].rate_to_base == 0.0067
        assert currencies[3].code == "CAD" and currencies[3].rate_to_base == 0.6
        assert currencies[4].code == "AUD" and currencies[4].rate_to_base == 0.55
    
    def test_currency_conversion_to_base(self):
        """Test converting amounts to base currency (GBP)."""
        usd = Currency(code="USD", rate_to_base=0.8)
        eur = Currency(code="EUR", rate_to_base=0.85)
        jpy = Currency(code="JPY", rate_to_base=0.0067)
        
        # Convert 100 USD to GBP
        usd_amount = 100.0
        gbp_from_usd = usd_amount * usd.rate_to_base
        assert gbp_from_usd == 80.0
        
        # Convert 100 EUR to GBP
        eur_amount = 100.0
        gbp_from_eur = eur_amount * eur.rate_to_base
        assert gbp_from_eur == 85.0
        
        # Convert 10000 JPY to GBP
        jpy_amount = 10000.0
        gbp_from_jpy = jpy_amount * jpy.rate_to_base
        assert gbp_from_jpy == 67.0
    
    def test_currency_conversion_from_base(self):
        """Test converting amounts from base currency (GBP) to other currencies."""
        usd = Currency(code="USD", rate_to_base=0.8)
        eur = Currency(code="EUR", rate_to_base=0.85)
        
        # Convert 100 GBP to USD
        gbp_amount = 100.0
        usd_from_gbp = gbp_amount / usd.rate_to_base
        assert usd_from_gbp == 125.0  # 100 / 0.8
        
        # Convert 100 GBP to EUR
        eur_from_gbp = gbp_amount / eur.rate_to_base
        assert abs(eur_from_gbp - 117.647058823529) < 0.0001  # 100 / 0.85
    
    def test_currency_cross_conversion(self):
        """Test converting between two non-base currencies."""
        usd = Currency(code="USD", rate_to_base=0.8)
        eur = Currency(code="EUR", rate_to_base=0.85)
        
        # Convert 100 USD to EUR via GBP
        usd_amount = 100.0
        
        # Step 1: USD to GBP
        gbp_amount = usd_amount * usd.rate_to_base  # 100 * 0.8 = 80 GBP
        
        # Step 2: GBP to EUR
        eur_amount = gbp_amount / eur.rate_to_base  # 80 / 0.85 = 94.117647...
        
        expected_eur = 80.0 / 0.85
        assert abs(eur_amount - expected_eur) < 0.0001
        assert abs(eur_amount - 94.117647058824) < 0.0001
    
    def test_currency_conversion_precision(self):
        """Test currency conversion with high precision values."""
        # High precision rate
        precise_currency = Currency(code="PREC", rate_to_base=0.123456789)
        
        amount = 1000.0
        converted = amount * precise_currency.rate_to_base
        
        assert converted == 123.456789
    
    def test_currency_conversion_edge_cases(self):
        """Test currency conversion with edge case values."""
        # Very small rate (like some cryptocurrencies or weak currencies)
        small_rate_currency = Currency(code="SMALL", rate_to_base=0.000001)
        
        amount = 1000000.0
        converted = amount * small_rate_currency.rate_to_base
        assert converted == 1.0
        
        # Very large rate (theoretical)
        large_rate_currency = Currency(code="LARGE", rate_to_base=10000.0)
        
        amount = 0.001
        converted = amount * large_rate_currency.rate_to_base
        assert converted == 10.0
    
    def test_currency_zero_amount_conversion(self):
        """Test currency conversion with zero amounts."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        zero_amount = 0.0
        converted = zero_amount * currency.rate_to_base
        assert converted == 0.0
    
    def test_currency_negative_amount_conversion(self):
        """Test currency conversion with negative amounts."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        negative_amount = -100.0
        converted = negative_amount * currency.rate_to_base
        assert converted == -80.0
    
    def test_currency_equality(self):
        """Test currency equality comparison."""
        usd1 = Currency(code="USD", rate_to_base=0.8)
        usd2 = Currency(code="USD", rate_to_base=0.8)
        usd3 = Currency(code="USD", rate_to_base=0.75)  # Different rate
        eur = Currency(code="EUR", rate_to_base=0.8)    # Different code
        
        # Same code and rate should be equal
        assert usd1 == usd2
        
        # Different rate should not be equal
        assert usd1 != usd3
        
        # Different code should not be equal
        assert usd1 != eur
    
    def test_currency_string_representation(self):
        """Test currency string representation."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        str_repr = str(currency)
        assert "USD" in str_repr
        assert "0.8" in str_repr
    
    def test_currency_field_types(self):
        """Test currency field types."""
        currency = Currency(code="USD", rate_to_base=0.8)
        
        assert isinstance(currency.code, str)
        assert isinstance(currency.rate_to_base, float)
    
    def test_real_world_currency_rates(self):
        """Test with realistic currency exchange rates."""
        # Approximate rates as of a typical day (these change daily)
        currencies = {
            "GBP": Currency(code="GBP", rate_to_base=1.0),      # Base currency
            "USD": Currency(code="USD", rate_to_base=0.79),     # 1 USD ≈ 0.79 GBP
            "EUR": Currency(code="EUR", rate_to_base=0.86),     # 1 EUR ≈ 0.86 GBP
            "JPY": Currency(code="JPY", rate_to_base=0.0053),   # 1 JPY ≈ 0.0053 GBP
            "CAD": Currency(code="CAD", rate_to_base=0.58),     # 1 CAD ≈ 0.58 GBP
            "AUD": Currency(code="AUD", rate_to_base=0.52),     # 1 AUD ≈ 0.52 GBP
            "CHF": Currency(code="CHF", rate_to_base=0.88),     # 1 CHF ≈ 0.88 GBP
        }
        
        # Test conversions
        # 1000 USD to GBP
        usd_amount = 1000.0
        gbp_from_usd = usd_amount * currencies["USD"].rate_to_base
        assert gbp_from_usd == 790.0
        
        # 1000 EUR to GBP
        eur_amount = 1000.0
        gbp_from_eur = eur_amount * currencies["EUR"].rate_to_base
        assert gbp_from_eur == 860.0
        
        # 100000 JPY to GBP
        jpy_amount = 100000.0
        gbp_from_jpy = jpy_amount * currencies["JPY"].rate_to_base
        assert gbp_from_jpy == 530.0
    
    def test_currency_conversion_round_trip(self):
        """Test round-trip currency conversion accuracy."""
        usd = Currency(code="USD", rate_to_base=0.8)
        
        original_amount = 100.0
        
        # Convert USD to GBP and back to USD
        gbp_amount = original_amount * usd.rate_to_base  # 100 * 0.8 = 80
        back_to_usd = gbp_amount / usd.rate_to_base      # 80 / 0.8 = 100
        
        assert back_to_usd == original_amount
    
    def test_currency_conversion_chain(self):
        """Test conversion through a chain of currencies."""
        usd = Currency(code="USD", rate_to_base=0.8)
        eur = Currency(code="EUR", rate_to_base=0.85)
        jpy = Currency(code="JPY", rate_to_base=0.0067)
        
        # Convert 100 USD -> GBP -> EUR -> GBP -> JPY
        original_usd = 100.0
        
        # USD to GBP
        gbp1 = original_usd * usd.rate_to_base  # 100 * 0.8 = 80
        
        # GBP to EUR
        eur_amount = gbp1 / eur.rate_to_base    # 80 / 0.85 = 94.117647...
        
        # EUR to GBP
        gbp2 = eur_amount * eur.rate_to_base    # Should be back to 80
        
        # GBP to JPY
        jpy_amount = gbp2 / jpy.rate_to_base    # 80 / 0.0067 = 11940.298...
        
        assert abs(gbp1 - gbp2) < 0.0001  # Should be the same
        assert abs(jpy_amount - 11940.298507462687) < 0.0001
    
    def test_currency_batch_conversions(self):
        """Test converting multiple amounts with the same currency."""
        usd = Currency(code="USD", rate_to_base=0.8)
        
        amounts = [10.0, 25.5, 100.0, 1000.0, 0.01]
        expected_gbp = [8.0, 20.4, 80.0, 800.0, 0.008]
        
        for i, amount in enumerate(amounts):
            converted = amount * usd.rate_to_base
            assert abs(converted - expected_gbp[i]) < 0.0001
    
    def test_currency_fractional_rates(self):
        """Test currencies with fractional exchange rates."""
        # Currency with repeating decimal rate
        currency = Currency(code="FRAC", rate_to_base=1/3)  # 0.333333...
        
        amount = 300.0
        converted = amount * currency.rate_to_base
        assert abs(converted - 100.0) < 0.0001
    
    def test_currency_comparison_operations(self):
        """Test currency comparison for sorting and ordering."""
        currencies = [
            Currency(code="USD", rate_to_base=0.8),
            Currency(code="EUR", rate_to_base=0.85),
            Currency(code="GBP", rate_to_base=1.0),
            Currency(code="JPY", rate_to_base=0.0067),
        ]
        
        # Sort by rate_to_base
        sorted_by_rate = sorted(currencies, key=lambda c: c.rate_to_base)
        
        assert sorted_by_rate[0].code == "JPY"  # Lowest rate
        assert sorted_by_rate[-1].code == "GBP"  # Highest rate (base currency)
        
        # Sort by currency code
        sorted_by_code = sorted(currencies, key=lambda c: c.code)
        
        assert sorted_by_code[0].code == "EUR"
        assert sorted_by_code[1].code == "GBP"
        assert sorted_by_code[2].code == "JPY"
        assert sorted_by_code[3].code == "USD"
    
    def test_currency_copy_behavior(self):
        """Test currency copy and modification behavior."""
        original = Currency(code="USD", rate_to_base=0.8)
        
        # Create a copy by creating new instance with same values
        copy = Currency(code=original.code, rate_to_base=original.rate_to_base)
        
        assert original == copy
        assert original is not copy  # Different objects
        
        # Modify copy
        copy.rate_to_base = 0.75
        
        assert original.rate_to_base == 0.8  # Original unchanged
        assert copy.rate_to_base == 0.75     # Copy changed
        assert original != copy              # No longer equal
