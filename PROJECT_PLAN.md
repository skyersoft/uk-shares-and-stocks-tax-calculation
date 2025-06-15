# Project Plan: UK Capital Gains Tax Calculator for Stocks and Shares

## Agile Backlog & Task Tracker

This project plan is structured for agile, test-driven development, and SOLID-compliant implementation. Do not fix formating issues such as line length. Each task is tracked with:
- **ID**: Unique identifier
- **Epic/Feature**: High-level grouping
- **Component**: Specific class/module being worked on
- **Task**: Concrete implementation or test
- **Test Type**: Unit / Integration / System
- **Dependencies**: What must be done first
- **Status**: Todo / In Progress / Done

---

### Sprint 1: Core Parsing & Models

#### QFX Parser Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 1.1   | SecurityFactory        | Test creating Security object from different ID types (ISIN/CUSIP)        | Unit       | None         | Done    |
| 1.2   | SecurityFactory        | Implement SecurityFactory with ID type handling and validation            | Unit       | 1.1          | Done    |
| 1.3   | TransactionFactory     | Test creating Transaction with currency and commission handling           | Unit       | 1.2          | Done    |
| 1.4   | TransactionFactory     | Implement TransactionFactory with price calculation                      | Unit       | 1.3          | Done    |
| 1.5   | QfxNodeParser         | Test XML node parsing for buy/sell transactions                          | Unit       | None         | Done    |
| 1.6   | QfxNodeParser         | Implement XML node parsing with error recovery                           | Unit       | 1.5          | Done    |
| 1.7   | QfxParser             | Test high-level QFX parsing with error cases                             | Unit       | 1.2,1.4,1.6  | Done    |
| 1.8   | QfxParser             | Implement main QFX parser using component factories                       | Unit       | 1.7          | Done    |
| 1.9   | QfxParser             | Integration test for full QFX file parsing                               | Integration| 1.8          | Done    |

#### Domain Models Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 2.1   | Security               | Test Security model validation and ID handling                            | Unit       | None         | Done    |
| 2.2   | Security               | Implement Security model with ID type support                             | Unit       | 2.1          | Done    |
| 2.3   | Transaction            | Test Transaction model calculations                                       | Unit       | 2.2          | Done    |
| 2.4   | Transaction            | Implement Transaction model with currency support                         | Unit       | 2.3          | Done    |
| 2.5   | Currency               | Test Currency model conversions                                           | Unit       | None         | Done    |
| 2.6   | Currency               | Implement Currency model with rate handling                               | Unit       | 2.5          | Done    |
| 2.7   | Integration            | Test real QFX data with implemented models (2.1-2.6)                     | Integration| 2.1-2.6      | Done    |

### Sprint 2: UK Tax Calculation Services

#### Share Pool Management Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 3.1   | SharePoolManager       | Test share pool creation and management                                   | Unit       | 2.1-2.7      | Done    |
| 3.2   | SharePoolManager       | Implement share pool with Section 104 holding rules                      | Unit       | 3.1          | Done    |
| 3.3   | SharePoolManager       | Test adding shares to pool with average cost calculation                  | Unit       | 3.2          | Done    |
| 3.4   | SharePoolManager       | Test removing shares from pool with proportional cost basis              | Unit       | 3.3          | Done    |

#### Transaction Matching Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 4.1   | TransactionMatcher     | Test same-day matching rule implementation                                | Unit       | 2.1-2.7      | Done    |
| 4.2   | TransactionMatcher     | Test 30-day bed & breakfast rule implementation                          | Unit       | 4.1          | Done    |
| 4.3   | TransactionMatcher     | Test Section 104 pool matching for remaining shares                      | Unit       | 4.2,3.1-3.4  | Done    |
| 4.4   | TransactionMatcher     | Implement complete matching algorithm with all rules                     | Unit       | 4.1-4.3      | Done    |

#### Disposal Calculator Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 5.1   | DisposalCalculator     | Test disposal calculation with allowable costs                           | Unit       | 4.1-4.4      | Done    |
| 5.2   | DisposalCalculator     | Test gain/loss calculation with currency conversion                      | Unit       | 5.1          | Done    |
| 5.3   | DisposalCalculator     | Implement disposal calculator with HMRC rules                            | Unit       | 5.1-5.2      | Done    |

#### Tax Year Calculator Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 6.1   | TaxYearCalculator      | Test UK tax year determination (April 6 - April 5)                       | Unit       | 2.1-2.7      | Done    |
| 6.2   | TaxYearCalculator      | Test annual exemption application                                         | Unit       | 6.1          | Done    |
| 6.3   | TaxYearCalculator      | Test tax year summary generation                                          | Unit       | 6.1-6.2,5.3  | Done    |
| 6.4   | TaxYearCalculator      | Implement complete tax year calculation                                   | Unit       | 6.1-6.3      | Done    |
| 6.5   | Integration            | Test complete tax calculation pipeline with real QFX data                | Integration| 3.1-6.4      | Done    |

#### Report Generator Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 7.1   | ReportGenerator        | Test CSV report generation                                                | Unit       | 6.1-6.4      | Done    |
| 7.2   | ReportGenerator        | Test JSON report generation                                               | Unit       | 7.1          | Done    |
| 7.3   | ReportGenerator        | Implement report generator with multiple formats                         | Unit       | 7.1-7.2      | Done    |

### Sprint 3: Main Calculator & CLI

#### Main Calculator Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 8.1   | CapitalGainsCalculator | Test main calculator orchestration                                        | Unit       | 3.1-7.3      | Done    |
| 8.2   | CapitalGainsCalculator | Test end-to-end calculation with real data                               | Integration| 8.1          | Done    |
| 8.3   | CapitalGainsCalculator | Implement main calculator with dependency injection                      | Unit       | 8.1-8.2      | Done    |
| 8.4   | QfxNodeParser          | Fix timezone-aware date parsing for QFX timestamps                      | Unit       | 1.5-1.6      | Done    |
| 8.5   | QfxParser              | Fix security_type field not being set on Security objects               | Unit       | 1.8          | Done    |
| 8.6   | CapitalGainsCalculator | Fix failing tests: test_calculate_with_json_format and test_calculate_logging | Unit   | 8.1-8.3      | Done    |
| 8.7   | TestRealQfxData        | Fix pytest warning: test method returning value instead of using assertions | Unit   | 6.5          | Done    |

#### CLI Interface Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 9.1   | CLI                    | Test command line argument parsing                                        | Unit       | 8.1-8.3      | Done    |
| 9.2   | CLI                    | Test CLI error handling and validation                                   | Unit       | 9.1          | Done    |
| 9.3   | CLI                    | Implement complete CLI interface                                          | Unit       | 9.1-9.2      | Done    |
| 9.4   | CLI                    | Integration test with real QFX file and CLI                              | Integration| 9.1-9.3      | Done    |

### Sprint 4: System Integration & Testing

#### System Integration Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 10.1  | System                 | End-to-end system test with complete tax calculation                     | System     | 1.1-9.4      | Done    |
| 10.2  | System                 | Performance testing with large QFX files                                 | System     | 10.1         | Done    |
| 10.3  | System                 | Test edge cases and error scenarios                                      | System     | 10.1-10.2    | Done    |


### Detailed Task Breakdown for QFX Parser

#### SecurityFactory (1.1-1.2)
- Create SecurityFactory interface
- Implement methods:
  - create_from_isin(isin: str) -> Security
  - create_from_cusip(cusip: str) -> Security
  - create_from_xml_node(node: Element) -> Security
- Unit tests:
  - test_create_from_valid_isin
  - test_create_from_valid_cusip
  - test_create_from_empty_id
  - test_create_from_malformed_id

#### TransactionFactory (1.3-1.4)
- Create TransactionFactory interface
- Implement methods:
  - create_from_xml_node(node: Element) -> Transaction
  - calculate_price_per_unit(total: float, quantity: float) -> float
  - validate_transaction(tx: Transaction) -> bool
- Unit tests:
  - test_create_buy_transaction
  - test_create_sell_transaction
  - test_calculate_missing_price
  - test_validate_transaction_fields

#### QfxNodeParser (1.5-1.6)
- Create QfxNodeParser interface
- Implement methods:
  - parse_buy_node(node: Element) -> Dict
  - parse_sell_node(node: Element) -> Dict
  - extract_security_info(node: Element) -> Dict
  - extract_transaction_info(node: Element) -> Dict
- Unit tests:
  - test_parse_valid_buy_node
  - test_parse_valid_sell_node
  - test_parse_malformed_node
  - test_extract_security_fields
  - test_extract_transaction_fields

#### QfxParser (1.7-1.9)
- Update QfxParser to use new components
- Implement methods:
  - parse(file_path: str) -> List[Transaction]
  - _parse_manually(file_path: str) -> List[Transaction]
  - _convert_ofx_transaction(ofx_tx) -> Transaction
  - _convert_investment_transaction(inv_tx) -> Transaction
- Unit tests:
  - test_parse_valid_file
  - test_parse_missing_price
  - test_parse_multiple_security_ids
  - test_parse_error_recovery
  - test_manual_parsing_fallback

---

### Implementation Notes
- Each component should have its own file
- Use dependency injection for factories and parsers
- Follow SOLID principles:
  - Single Responsibility: Each class has one job
  - Open/Closed: Use interfaces for extensibility
  - Liskov Substitution: Factories should be interchangeable
  - Interface Segregation: Keep interfaces focused
  - Dependency Inversion: Depend on abstractions

### Test Strategy
- Unit tests:
  - Test each component in isolation
  - Use mocking for dependencies
  - Test edge cases and error conditions
- Integration tests:
  - Test components working together
  - Use real QFX files
  - Verify end-to-end parsing

## Progress Tracking
- Mark tasks as "In Progress" when starting
- Move to "Done" only after:
  - All tests pass
  - Code review complete
  - Documentation updated

### Test Data Management

#### OFX Sample Extraction Task

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 0.1   | Test Infrastructure    | Extract OFX samples from test files to separate fixture files            | Infrastructure | None     | Done    |
| 0.2   | Test Infrastructure    | Create OFX sample loader utility for tests                               | Infrastructure | 0.1      | Done    |
| 0.3   | Test Infrastructure    | Document OFX sample usage and guidelines                                  | Infrastructure | 0.2      | Done    |
| 0.4   | Test Infrastructure    | Update test files to use new samples under fixtures/ofx_samples folder   | Infrastructure | 0.1-0.3  | Done    |

#### OFX Sample Files Created
- `tests/fixtures/ofx_samples/basic_buy_transaction.ofx` - Simple buy transaction with ISIN
- `tests/fixtures/ofx_samples/buy_with_commission.ofx` - Buy with commission and currency
- `tests/fixtures/ofx_samples/sell_transaction.ofx` - Sell transaction with commission
- `tests/fixtures/ofx_samples/missing_price.ofx` - Transaction with zero unit price (extracted from test_qfx_parser.py)
- `tests/fixtures/ofx_samples/cusip_security.ofx` - Transaction using CUSIP identifier (extracted from test_qfx_parser.py)
- `tests/fixtures/ofx_samples/multiple_transactions.ofx` - Multiple transactions in single file
- `tests/fixtures/ofx_samples/mixed_security_types.ofx` - Mix of buy/sell with different ID types
- `tests/fixtures/ofx_samples/header_only.ofx` - OFX file with only header information
- `tests/fixtures/ofx_samples/invalid_structure.ofx` - Invalid OFX structure for error testing
- `tests/fixtures/ofx_samples/malformed_xml.ofx` - Malformed XML for parser error testing
- `tests/fixtures/ofx_samples/error_recovery.ofx` - Mix of valid/invalid transactions (extracted from test_qfx_parser.py)
- `tests/fixtures/ofx_samples/empty_file.ofx` - Empty file for empty file handling tests

#### Sample Loader Utility
- Created `tests/fixtures/ofx_samples/__init__.py` with utility functions:
  - `get_sample_path(filename)` - Get full path to sample file
  - `load_sample_content(filename)` - Load sample file content
  - `list_available_samples()` - List all available samples
  - `get_sample_info()` - Get sample descriptions
  - Constants for commonly used samples (BASIC_BUY, SELL_TRANSACTION, etc.)

#### Usage Guidelines
- **DO NOT MODIFY** extracted sample files during implementation
- Create new sample files for new test cases
- Use the sample loader utility in tests instead of embedding OFX content
- All samples are documented in `tests/fixtures/ofx_samples/README.md`

---

_Last updated: 2025-06-13_
