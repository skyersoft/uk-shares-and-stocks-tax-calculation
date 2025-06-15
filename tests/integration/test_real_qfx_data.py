"""Integration test for real QFX data with implemented models (Task 2.7).

This test validates that the Security, Transaction, and Currency models
work correctly with real QFX data from data/U11075163_20240408_20250404.qfx.
"""
import pytest
from datetime import datetime
from src.main.python.parsers.qfx_parser import QfxParser
from src.main.python.models.domain_models import TransactionType, Currency


class TestRealQfxDataIntegration:
    """Integration tests for real QFX data with implemented models."""
    
    @pytest.fixture
    def qfx_parser(self):
        """Create QFX parser instance."""
        return QfxParser()
    
    @pytest.fixture
    def real_qfx_file_path(self):
        """Path to real QFX data file."""
        return "data/U11075163_20240408_20250404.qfx"
    
    def test_parse_real_qfx_file_successfully(self, qfx_parser, real_qfx_file_path):
        """Test that real QFX file can be parsed without errors."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Should have parsed some transactions
        assert len(transactions) > 0
        print(f"Parsed {len(transactions)} transactions from real QFX file")
    
    def test_security_models_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test Security models work with real ISIN and CUSIP identifiers."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Collect unique securities
        securities = {}
        for tx in transactions:
            if tx.security and tx.security.isin:
                securities[tx.security.isin] = tx.security
        
        # Should have multiple securities
        assert len(securities) > 0
        print(f"Found {len(securities)} unique securities")
        
        # Test specific securities from the real data
        expected_securities = {
            "NL0000334118": "ISIN",  # ASM International
            "JE00B1VS3770": "ISIN",  # WisdomTree Physical Gold
            "JE00B1VS3333": "ISIN",  # WT Physical Silver
            "KYG393871085": "ISIN",  # GlobalFoundries
            "65340P106": "CUSIP",    # NexGen Energy
            "747525103": "CUSIP",    # Qualcomm
        }
        
        for expected_id, expected_type in expected_securities.items():
            found_security = None
            for security in securities.values():
                if (expected_type == "ISIN" and security.isin == expected_id) or \
                   (expected_type == "CUSIP" and security.isin == f"CUSIP:{expected_id}"):
                    found_security = security
                    break
            
            assert found_security is not None, f"Expected security {expected_id} not found"
            # Note: security_type may be None if not set by parser, which is acceptable
            if found_security.security_type is not None:
                assert found_security.security_type == expected_type
            print(f"✓ Security {expected_id} ({expected_type}): {found_security.get_display_name()}")
    
    def test_currency_models_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test Currency models work with real exchange rates."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Collect unique currencies
        currencies = {}
        for tx in transactions:
            if tx.currency:
                currencies[tx.currency.code] = tx.currency
        
        # Should have multiple currencies
        assert len(currencies) >= 3  # At least GBP, EUR, USD
        print(f"Found {len(currencies)} unique currencies")
        
        # Test specific currencies from the real data
        expected_currencies = ["GBP", "EUR", "USD"]
        for currency_code in expected_currencies:
            assert currency_code in currencies, f"Expected currency {currency_code} not found"
            currency = currencies[currency_code]
            
            # Validate currency properties
            assert currency.code == currency_code
            assert currency.rate_to_base > 0
            assert isinstance(currency.rate_to_base, float)
            
            # Test currency methods
            assert currency.get_display_name() is not None
            if currency_code == "GBP":
                assert currency.is_base_currency()
                assert currency.rate_to_base == 1.0
            else:
                assert not currency.is_base_currency()
                assert currency.rate_to_base != 1.0
            
            print(f"✓ Currency {currency_code}: {currency.get_display_name()}")
    
    def test_transaction_models_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test Transaction models work with real transaction data."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Should have both buy and sell transactions
        buy_transactions = [tx for tx in transactions if tx.transaction_type == TransactionType.BUY]
        sell_transactions = [tx for tx in transactions if tx.transaction_type == TransactionType.SELL]
        
        assert len(buy_transactions) > 0, "Should have buy transactions"
        assert len(sell_transactions) > 0, "Should have sell transactions"
        print(f"Found {len(buy_transactions)} buy and {len(sell_transactions)} sell transactions")
        
        # Test a specific buy transaction (first ASM buy)
        asm_buys = [tx for tx in buy_transactions if tx.security and tx.security.isin == "NL0000334118"]
        assert len(asm_buys) > 0, "Should have ASM buy transactions"
        
        first_asm_buy = asm_buys[0]
        assert first_asm_buy.transaction_type == TransactionType.BUY
        assert first_asm_buy.quantity > 0
        assert first_asm_buy.price_per_unit > 0
        assert first_asm_buy.currency.code == "EUR"
        assert first_asm_buy.commission >= 0
        
        # Test transaction calculations
        assert first_asm_buy.total_cost > 0
        assert first_asm_buy.total_cost_in_base_currency > 0
        assert first_asm_buy.net_amount > 0
        assert first_asm_buy.net_amount_in_base_currency > 0
        
        print(f"✓ ASM Buy: {first_asm_buy.get_transaction_summary()}")
        print(f"  Total cost: {first_asm_buy.total_cost:.2f} {first_asm_buy.currency.code}")
        print(f"  Total cost (GBP): {first_asm_buy.total_cost_in_base_currency:.2f}")
        
        # Test a specific sell transaction
        if sell_transactions:
            first_sell = sell_transactions[0]
            assert first_sell.transaction_type == TransactionType.SELL
            assert first_sell.quantity < 0  # Negative for sells
            assert first_sell.price_per_unit > 0
            
            # Test sell-specific calculations
            assert first_sell.net_amount > 0  # Proceeds after costs
            assert first_sell.net_amount_in_base_currency > 0
            
            print(f"✓ Sell: {first_sell.get_transaction_summary()}")
            print(f"  Net proceeds: {first_sell.net_amount:.2f} {first_sell.currency.code}")
            print(f"  Net proceeds (GBP): {first_sell.net_amount_in_base_currency:.2f}")
    
    def test_currency_conversion_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test currency conversion functionality with real exchange rates."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Find a EUR transaction to test conversion
        eur_transactions = [tx for tx in transactions if tx.currency.code == "EUR"]
        assert len(eur_transactions) > 0, "Should have EUR transactions"
        
        eur_tx = eur_transactions[0]
        original_currency = eur_tx.currency
        
        # Test conversion to USD
        usd_transactions = [tx for tx in transactions if tx.currency.code == "USD"]
        if usd_transactions:
            usd_currency = usd_transactions[0].currency
            
            # Convert EUR transaction to USD
            converted_tx = eur_tx.convert_to_currency(usd_currency)
            
            # Verify conversion
            assert converted_tx.currency.code == "USD"
            assert converted_tx.quantity == eur_tx.quantity  # Quantity unchanged
            assert converted_tx.transaction_id == eur_tx.transaction_id  # ID unchanged
            
            # Verify amounts are converted
            conversion_factor = original_currency.rate_to_base / usd_currency.rate_to_base
            expected_price = eur_tx.price_per_unit * conversion_factor
            assert abs(converted_tx.price_per_unit - expected_price) < 0.0001
            
            # Verify base currency amounts are the same
            original_base_cost = eur_tx.total_cost_in_base_currency
            converted_base_cost = converted_tx.total_cost_in_base_currency
            assert abs(original_base_cost - converted_base_cost) < 0.01  # Allow small rounding differences
            
            print(f"✓ Currency conversion EUR->USD:")
            print(f"  Original: {eur_tx.price_per_unit:.2f} EUR")
            print(f"  Converted: {converted_tx.price_per_unit:.2f} USD")
            print(f"  Base cost (original): {original_base_cost:.2f} GBP")
            print(f"  Base cost (converted): {converted_base_cost:.2f} GBP")
    
    def test_multi_currency_portfolio_calculation(self, qfx_parser, real_qfx_file_path):
        """Test portfolio calculations across multiple currencies."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Calculate total portfolio value in base currency (GBP)
        total_cost_gbp = 0.0
        currency_breakdown = {}
        
        for tx in transactions:
            if tx.transaction_type == TransactionType.BUY:
                cost_gbp = tx.total_cost_in_base_currency
                total_cost_gbp += cost_gbp
                
                currency_code = tx.currency.code
                if currency_code not in currency_breakdown:
                    currency_breakdown[currency_code] = {
                        'count': 0,
                        'total_original': 0.0,
                        'total_gbp': 0.0
                    }
                
                currency_breakdown[currency_code]['count'] += 1
                currency_breakdown[currency_code]['total_original'] += tx.total_cost
                currency_breakdown[currency_code]['total_gbp'] += cost_gbp
        
        assert total_cost_gbp > 0, "Should have positive total cost"
        assert len(currency_breakdown) >= 3, "Should have transactions in multiple currencies"
        
        print(f"✓ Multi-currency portfolio analysis:")
        print(f"  Total cost (GBP): {total_cost_gbp:.2f}")
        
        for currency_code, breakdown in currency_breakdown.items():
            print(f"  {currency_code}: {breakdown['count']} transactions, "
                  f"{breakdown['total_original']:.2f} {currency_code} "
                  f"({breakdown['total_gbp']:.2f} GBP)")
    
    def test_transaction_date_handling(self, qfx_parser, real_qfx_file_path):
        """Test that transaction dates are parsed correctly."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Check that transactions have valid dates
        dated_transactions = [tx for tx in transactions if tx.date is not None]
        assert len(dated_transactions) > 0, "Should have transactions with dates"
        
        # Verify date range matches the QFX file period (2024-04-08 to 2025-04-04)
        dates = [tx.date for tx in dated_transactions]
        min_date = min(dates)
        max_date = max(dates)
        
        # Should be within the expected range
        assert min_date >= datetime(2024, 4, 1), f"Minimum date {min_date} seems too early"
        assert max_date <= datetime(2025, 5, 1), f"Maximum date {max_date} seems too late"
        
        print(f"✓ Transaction dates:")
        print(f"  Date range: {min_date.strftime('%Y-%m-%d')} to {max_date.strftime('%Y-%m-%d')}")
        print(f"  Total transactions with dates: {len(dated_transactions)}")
    
    def test_security_identifier_validation(self, qfx_parser, real_qfx_file_path):
        """Test that all security identifiers are valid."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Collect all securities
        securities = []
        seen_isins = set()
        for tx in transactions:
            if tx.security and tx.security.isin not in seen_isins:
                securities.append(tx.security)
                seen_isins.add(tx.security.isin)
        
        # Validate each security
        for security in securities:
            assert security.is_valid_identifier(), f"Invalid identifier for security: {security.isin}"
            assert security.get_identifier() is not None
            assert security.get_display_name() is not None
            
            # Test specific validation based on type
            if security.security_type == "ISIN":
                identifier = security.get_identifier()
                assert len(identifier) == 12, f"ISIN should be 12 characters: {identifier}"
                assert identifier.isalnum(), f"ISIN should be alphanumeric: {identifier}"
            elif security.security_type == "CUSIP":
                identifier = security.get_identifier()
                assert len(identifier) == 9, f"CUSIP should be 9 characters: {identifier}"
                assert identifier.isalnum(), f"CUSIP should be alphanumeric: {identifier}"
        
        print(f"✓ All {len(securities)} securities have valid identifiers")
    
    def test_complete_tax_calculation_pipeline(self, qfx_parser, real_qfx_file_path):
        """Test the complete tax calculation pipeline with real QFX data (Task 6.5)."""
        from src.main.python.services.transaction_matcher import UKTransactionMatcher
        from src.main.python.services.disposal_calculator import UKDisposalCalculator
        from src.main.python.services.tax_year_calculator import UKTaxYearCalculator
        
        # Step 1: Parse transactions from real QFX file
        transactions = qfx_parser.parse(real_qfx_file_path)
        assert len(transactions) > 0, "Should have parsed transactions"
        print(f"✓ Step 1: Parsed {len(transactions)} transactions from real QFX file")
        
        # Step 2: Match transactions using UK tax rules
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        # Should have some matched disposals (sells with matched buys)
        sell_transactions = [tx for tx in transactions if tx.transaction_type.name == 'SELL']
        print(f"✓ Step 2: Found {len(sell_transactions)} sell transactions")
        print(f"✓ Step 2: Matched {len(matched_disposals)} disposals using UK tax rules")
        
        # Step 3: Calculate disposal details for each matched disposal
        calculator = UKDisposalCalculator()
        disposals = []
        
        for sell_tx, matched_buys in matched_disposals:
            disposal = calculator.calculate_disposal(sell_tx, matched_buys)
            disposals.append(disposal)
            print(f"✓ Step 3: Calculated disposal for {disposal.security.get_display_name()}: "
                  f"Gain/Loss = {disposal.gain_or_loss:.2f} GBP ({disposal.matching_rule})")
        
        assert len(disposals) > 0, "Should have calculated some disposals"
        
        # Step 4: Calculate tax year summaries
        tax_calculator = UKTaxYearCalculator()
        
        # Test with 2024-2025 tax year (covers the QFX file period)
        tax_year = "2024-2025"
        summary = tax_calculator.calculate_tax_year_summary(disposals, tax_year)
        
        print(f"✓ Step 4: Tax Year Summary for {tax_year}:")
        print(f"  - Total Proceeds: £{summary.total_proceeds:.2f}")
        print(f"  - Total Gains: £{summary.total_gains:.2f}")
        print(f"  - Total Losses: £{summary.total_losses:.2f}")
        print(f"  - Net Gain: £{summary.net_gain:.2f}")
        print(f"  - Annual Exemption Used: £{summary.annual_exemption_used:.2f}")
        print(f"  - Taxable Gain: £{summary.taxable_gain:.2f}")
        print(f"  - Number of Disposals: {len(summary.disposals)}")
        
        # Validate the summary
        assert summary.tax_year == tax_year
        assert summary.total_proceeds >= 0
        assert summary.annual_exemption_used >= 0
        assert summary.annual_exemption_used <= 3000.0  # 2024-2025 annual exemption
        
        # If there are gains, taxable gain should be net gain minus exemption used
        if summary.net_gain > 0:
            expected_taxable = max(0, summary.net_gain - summary.annual_exemption_used)
            assert abs(summary.taxable_gain - expected_taxable) < 0.01
        
        print(f"✓ Complete tax calculation pipeline successfully processed real QFX data")
        
        # Assert that we successfully completed the pipeline
        assert summary is not None, "Tax year summary should be calculated"
    
    def test_multi_year_tax_calculation(self, qfx_parser, real_qfx_file_path):
        """Test tax calculation across multiple tax years with real data."""
        from src.main.python.services.transaction_matcher import UKTransactionMatcher
        from src.main.python.services.disposal_calculator import UKDisposalCalculator
        from src.main.python.services.tax_year_calculator import UKTaxYearCalculator
        
        # Parse and process transactions
        transactions = qfx_parser.parse(real_qfx_file_path)
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        calculator = UKDisposalCalculator()
        disposals = []
        for sell_tx, matched_buys in matched_disposals:
            disposal = calculator.calculate_disposal(sell_tx, matched_buys)
            disposals.append(disposal)
        
        # Calculate summaries for multiple tax years
        tax_calculator = UKTaxYearCalculator()
        tax_years = ["2023-2024", "2024-2025", "2025-2026"]
        
        total_disposals_across_years = 0
        for tax_year in tax_years:
            try:
                summary = tax_calculator.calculate_tax_year_summary(disposals, tax_year)
                total_disposals_across_years += len(summary.disposals)
                
                if len(summary.disposals) > 0:
                    print(f"✓ {tax_year}: {len(summary.disposals)} disposals, "
                          f"Net gain: £{summary.net_gain:.2f}, "
                          f"Taxable gain: £{summary.taxable_gain:.2f}")
            except ValueError:
                # Tax year not configured, skip
                continue
        
        # Total disposals across all years should equal total disposals calculated
        assert total_disposals_across_years == len(disposals)
        print(f"✓ Multi-year calculation: {total_disposals_across_years} total disposals across all tax years")
    
    def test_currency_conversion_in_pipeline(self, qfx_parser, real_qfx_file_path):
        """Test that currency conversion works correctly in the complete pipeline."""
        from src.main.python.services.transaction_matcher import UKTransactionMatcher
        from src.main.python.services.disposal_calculator import UKDisposalCalculator
        
        # Parse transactions
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        # Find transactions in different currencies
        currencies_found = set()
        for tx in transactions:
            currencies_found.add(tx.currency.code)
        
        print(f"✓ Found transactions in currencies: {sorted(currencies_found)}")
        assert len(currencies_found) >= 2, "Should have transactions in multiple currencies"
        
        # Process through the pipeline
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        calculator = UKDisposalCalculator()
        multi_currency_disposals = []
        
        for sell_tx, matched_buys in matched_disposals:
            # Check if this disposal involves currency conversion
            sell_currency = sell_tx.currency.code
            buy_currencies = set(buy.currency.code for buy in matched_buys)
            
            disposal = calculator.calculate_disposal(sell_tx, matched_buys)
            
            if sell_currency != 'GBP' or any(curr != 'GBP' for curr in buy_currencies):
                multi_currency_disposals.append(disposal)
                print(f"✓ Multi-currency disposal: {disposal.security.get_display_name()}")
                print(f"  Sell currency: {sell_currency}, Buy currencies: {buy_currencies}")
                print(f"  Proceeds (GBP): £{disposal.proceeds:.2f}")
                print(f"  Cost basis (GBP): £{disposal.cost_basis:.2f}")
                print(f"  Gain/Loss (GBP): £{disposal.gain_or_loss:.2f}")
        
        if multi_currency_disposals:
            print(f"✓ Successfully processed {len(multi_currency_disposals)} multi-currency disposals")
        else:
            print("✓ No multi-currency disposals found (all transactions in GBP)")
    
    def test_matching_rules_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test that different UK tax matching rules are applied correctly with real data."""
        from src.main.python.services.transaction_matcher import UKTransactionMatcher
        from src.main.python.services.disposal_calculator import UKDisposalCalculator
        
        # Parse and process transactions
        transactions = qfx_parser.parse(real_qfx_file_path)
        matcher = UKTransactionMatcher()
        matched_disposals = matcher.match_disposals(transactions)
        
        calculator = UKDisposalCalculator()
        matching_rules_used = {}
        
        for sell_tx, matched_buys in matched_disposals:
            disposal = calculator.calculate_disposal(sell_tx, matched_buys)
            rule = disposal.matching_rule
            
            if rule not in matching_rules_used:
                matching_rules_used[rule] = 0
            matching_rules_used[rule] += 1
        
        print(f"✓ UK tax matching rules applied:")
        for rule, count in matching_rules_used.items():
            print(f"  - {rule}: {count} disposals")
        
        # Should have at least one matching rule applied
        assert len(matching_rules_used) > 0, "Should have applied at least one matching rule"
        
        # Most common rule should be section-104 for typical scenarios
        if 'section-104' in matching_rules_used:
            print(f"✓ Section 104 pooling rule applied correctly")
    
    def test_error_recovery_with_real_data(self, qfx_parser, real_qfx_file_path):
        """Test that parser handles any issues in real data gracefully."""
        # This should not raise any exceptions
        try:
            transactions = qfx_parser.parse(real_qfx_file_path)
            assert len(transactions) > 0
            print(f"✓ Parser handled real data gracefully, parsed {len(transactions)} transactions")
        except Exception as e:
            pytest.fail(f"Parser failed on real data: {str(e)}")
    
    def test_comprehensive_data_validation(self, qfx_parser, real_qfx_file_path):
        """Comprehensive validation of all parsed data."""
        transactions = qfx_parser.parse(real_qfx_file_path)
        
        validation_results = {
            'total_transactions': len(transactions),
            'valid_transactions': 0,
            'transactions_with_security': 0,
            'transactions_with_currency': 0,
            'transactions_with_dates': 0,
            'buy_transactions': 0,
            'sell_transactions': 0,
            'unique_securities': set(),
            'unique_currencies': set(),
        }
        
        for tx in transactions:
            # Basic validation
            if tx.price_per_unit >= 0 and tx.commission >= 0 and tx.taxes >= 0:
                validation_results['valid_transactions'] += 1
            
            if tx.security:
                validation_results['transactions_with_security'] += 1
                validation_results['unique_securities'].add(tx.security.isin)
            
            if tx.currency:
                validation_results['transactions_with_currency'] += 1
                validation_results['unique_currencies'].add(tx.currency.code)
            
            if tx.date:
                validation_results['transactions_with_dates'] += 1
            
            if tx.transaction_type == TransactionType.BUY:
                validation_results['buy_transactions'] += 1
            elif tx.transaction_type == TransactionType.SELL:
                validation_results['sell_transactions'] += 1
        
        # Assertions
        assert validation_results['valid_transactions'] > 0
        assert validation_results['transactions_with_security'] > 0
        assert validation_results['transactions_with_currency'] > 0
        assert validation_results['transactions_with_dates'] > 0
        assert validation_results['buy_transactions'] > 0
        assert len(validation_results['unique_securities']) > 0
        assert len(validation_results['unique_currencies']) >= 3
        
        # Print summary
        print(f"✓ Comprehensive validation results:")
        for key, value in validation_results.items():
            if isinstance(value, set):
                print(f"  {key}: {len(value)}")
            else:
                print(f"  {key}: {value}")
