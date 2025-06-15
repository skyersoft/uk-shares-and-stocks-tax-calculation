# OFX Test Samples

This directory contains OFX (Open Financial Exchange) sample files extracted from the test suite. These files are used for testing the QFX parser functionality.

## Sample Files

### Valid Transaction Samples
- `basic_buy_transaction.ofx` - Simple buy transaction with ISIN security ID
- `buy_with_commission.ofx` - Buy transaction with commission and currency information
- `sell_transaction.ofx` - Sell transaction with commission and currency
- `missing_price.ofx` - Transaction with zero unit price (tests price calculation)
- `cusip_security.ofx` - Transaction using CUSIP security identifier
- `multiple_transactions.ofx` - Multiple transactions in single file
- `mixed_security_types.ofx` - Mix of buy/sell with different security ID types

### Header and Structure Samples
- `header_only.ofx` - OFX file with only header information
- `invalid_structure.ofx` - Invalid OFX structure for error testing

### Error Handling Samples
- `malformed_xml.ofx` - Malformed XML for parser error testing
- `error_recovery.ofx` - Mix of valid and invalid transactions for error recovery testing
- `empty_file.ofx` - Empty file for empty file handling tests

## Usage

These files should be used by test cases instead of embedding OFX content directly in test code. This approach:

1. Keeps test code clean and readable
2. Makes OFX samples reusable across different tests
3. Allows easy modification of test data without changing test code
4. Provides a central location for all test OFX samples

## Important Notes

- **DO NOT MODIFY** these files during implementation
- Create new files for new test cases
- These files represent the extracted samples from the original test suite
- File extensions use `.ofx` to clearly identify them as OFX format files
