# Project Plan: UK Capital Gains Tax Calculator for Stocks and Shares

## Overview

This project implements a comprehensive UK capital gains tax calculator for stocks and shares, supporting both QFX and CSV file formats from major brokers like Interactive Brokers and Sharesight. The system follows HMRC tax rules and provides detailed reporting for tax compliance.

## Architecture

### Backend (Python)
- **Core Engine**: SOLID-compliant tax calculation with dependency injection
- **Parsers**: QFX and CSV file processing with robust error handling
- **Models**: Domain objects for securities, transactions, and tax calculations
- **Services**: Business logic for share pooling, matching rules, and tax computation

### Frontend (Static HTML/JS + React SPA)
- **Static Interface**: Production-ready HTML/JS with Bootstrap styling
- **React Migration**: Modern SPA implementation in development
- **File Upload**: Drag-and-drop interface for QFX/CSV files
- **Results Display**: Interactive tables and charts for tax calculations

### Infrastructure
- **AWS Lambda**: Serverless computation with API Gateway
- **CloudFront**: CDN for static assets with custom domain
- **CI/CD**: Automated testing and deployment pipeline
- **Testing**: 699+ tests across unit, integration, and E2E suites

## Development Phases

### Phase 1: Core Backend (COMPLETED)
- ✅ QFX file parsing with XML node processing
- ✅ Domain models (Security, Transaction, Currency)
- ✅ Share pool management with Section 104 rules
- ✅ Transaction matching (same-day, 30-day, pool rules)
- ✅ Tax calculation engine with HMRC compliance
- ✅ CLI interface with argument parsing

### Phase 2: Extended Support (COMPLETED)
- ✅ CSV parser for Sharesight and similar formats
- ✅ Currency conversion and exchange rate handling
- ✅ Report generation (CSV/JSON formats)
- ✅ System integration testing
- ✅ Performance optimization

### Phase 3: Web Interface (COMPLETED)
- ✅ Flask web application with file upload
- ✅ Bootstrap-based responsive UI
- ✅ Results visualization with tables and charts
- ✅ Error handling and user feedback
- ✅ Production deployment to AWS

### Phase 4: React Migration (IN PROGRESS)
- ✅ Component library with 339 tests (12 components)
- ✅ TypeScript integration and modern tooling
- ✅ SEO optimization and content management
- ✅ Google Ads integration with privacy compliance
- ✅ Testing framework with 699+ total tests
- 🚧 Affiliate marketing system (in development)

## Current Status

### Completed Features
- **File Processing**: QFX and CSV format support
- **Tax Calculations**: HMRC-compliant CGT calculations
- **Web Interface**: Production-ready static site
- **Testing**: Comprehensive test suite (699+ tests)
- **Deployment**: AWS infrastructure with CI/CD
- **Monetization**: Google AdSense integration

### Active Development
- **React SPA**: Modern frontend migration (ui_tasks.md)
- **Affiliate System**: Amazon Associates integration
- **Content Management**: Blog system with MDX support

## Quality Metrics

- **Test Coverage**: 76%+ across statements/branches/functions/lines
- **Code Quality**: SOLID principles, dependency injection
- **Performance**: Sub-second processing for typical files
- **Reliability**: Production deployment with monitoring
- **User Experience**: Mobile-responsive design

## Next Priorities

1. **Complete React SPA Migration** - Finish ui_tasks.md implementation
2. **Affiliate Marketing** - Implement Amazon Associates system
3. **Content Enhancement** - Expand blog with tax education
4. **Performance Monitoring** - Add application analytics
5. **User Feedback** - Implement feedback collection

## Sprint Structure

This project uses agile development with focused sprints. Each sprint delivers working software with comprehensive testing.

---

### Sprint 1: Core Parsing & Models ✅ COMPLETED

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
| 8.8   | CapitalGainsCalculator | Fix failing test: test_calculate_with_csv_file_type - report generator not called | Unit | 8.1-8.3 | Done |

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

### Sprint 5: CSV Parser Implementation

#### CSV Sample Management

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 11.1  | Test Infrastructure    | Extract CSV sample from Sharesight.csv to test fixtures                   | Infrastructure | None     | Done    |
| 11.2  | Test Infrastructure    | Create CSV sample loader utility for tests                                | Infrastructure | 11.1     | Done    |
| 11.3  | Test Infrastructure    | Document CSV sample structure and column mapping                           | Infrastructure | 11.2     | Done    |
| 11.4  | Test Infrastructure    | Create minimal test CSV files for different transaction types              | Infrastructure | 11.1-11.3 | Done    |

#### CSV Parser Interface and Component Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 12.1  | CsvParserInterface     | Design interface for CSV parser compatible with existing FileParserInterface | Unit     | None        | Done    |
| 12.2  | CsvParserInterface     | Test CSV parser interface with mock implementations                        | Unit       | 12.1        | Done    |
| 12.3  | CsvSecurityFactory     | Test creating Security objects from CSV row data                           | Unit       | 12.1-12.2   | Done    |
| 12.4  | CsvSecurityFactory     | Implement security factory for CSV with ID type handling                    | Unit       | 12.3        | Done    |
| 12.5  | CsvTransactionFactory  | Test creating Transaction objects from CSV row data                        | Unit       | 12.4        | Done    |
| 12.6  | CsvTransactionFactory  | Implement transaction factory for CSV with currency support                 | Unit       | 12.5        | Done    |
| 12.7  | CsvParser              | Test parsing CSV headers and column validation                             | Unit       | 12.1-12.6   | Done    |
| 12.8  | CsvParser              | Test CSV row parsing with different transaction types                      | Unit       | 12.7        | Done    |
| 12.9  | CsvParser              | Implement CSV parser using component factories                              | Unit       | 12.7-12.8   | Done    |
| 12.10 | CsvParser              | Test currency conversion transactions handling                             | Unit       | 12.9        | Done    |
| 12.11 | CsvParser              | Implement special case handling for currency transactions                   | Unit       | 12.10       | Done    |
| 12.12 | CsvParser              | Integration test for full CSV file parsing                                 | Integration| 12.1-12.11  | Done    |

#### Calculator Integration Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 14.1  | CapitalGainsCalculator | Update calculator to accept file type parameter                           | Unit       | 12.1-12.12   | Done    |
| 14.2  | CapitalGainsCalculator | Test calculator with CSV input                                             | Integration| 14.1         | Done    |
| 14.3  | CLI                    | Update CLI to support CSV files with explicit type selection              | Unit       | 14.1-14.2    | Done    |
| 14.4  | CLI                    | Test CLI with CSV input                                                    | Integration| 14.3         | Done    |

#### System Testing Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 15.1  | System                 | End-to-end system test with CSV file                                      | System     | 11.1-14.4    | Done    |
| 15.2  | System                 | Performance testing with large CSV files                                  | System     | 15.1         | Done    |
| 15.3  | System                 | Test explicit file type selection parameter                               | System     | 15.1-15.2    | Done    |

#### Documentation Tasks

| ID    | Component               | Task Description                                                           | Test Type  | Dependencies | Status |
|-------|------------------------|---------------------------------------------------------------------------|------------|--------------|---------|
| 16.1  | Documentation          | Update README with CSV file support                                       | Doc        | 15.1-15.3    | Done    |
| 16.2  | Documentation          | Document CSV file format requirements and column mapping                    | Doc        | 16.1         | Done    |
| 16.3  | Documentation          | Document file type selection parameter in CLI                              | Doc        | 16.2         | Done    |

### Implementation Notes for CSV Parser

- CSV parser should implement the same interface as QFX parser for plug-and-play compatibility
- Use Python's CSV module or pandas for CSV parsing
- Handle the Sharesight CSV format's specific columns:
  - Map "BUY"/"SELL" in Buy/Sell column to TransactionType
  - Extract security information from Symbol, SecurityID, SecurityIDType columns
  - Handle currency conversion using CurrencyPrimary and FXRateToBase
  - Filter out currency exchange transactions or handle them appropriately
- Follow existing patterns:
  - Factory classes for creating domain objects
  - Dependency injection for testability
  - Robust error handling and validation
- Explicit file type selection by user rather than automatic detection
- Ensure backwards compatibility with existing QFX parsing

### Test Strategy for CSV Parser

- Unit tests:
  - Test each component in isolation with mock CSV data
  - Test edge cases: missing columns, currency transactions, zero quantities
  - Test validation of required fields
- Integration tests:
  - Test with real Sharesight CSV files
  - Verify proper mapping of all transaction fields
  - Test end-to-end parsing pipeline
- System tests:
  - Test full tax calculation with CSV input
  - Compare results with QFX-based calculations for consistency

_Last updated: 2025-06-23_
