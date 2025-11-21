# 🧪 IBKR Tax Calculator - Testing Guide

This comprehensive guide covers all testing aspects of the IBKR Tax Calculator, including unit tests, integration tests, E2E tests, and testing infrastructure.

## 📊 Test Overview

### Test Statistics
- **Total Tests**: 699 passing tests across 39 suites
- **Coverage**: 76%+ (statements/branches/functions/lines)
- **Test Types**: Unit, Integration, E2E, System
- **Languages**: Python (backend), JavaScript (frontend), Playwright (E2E)

### Test Organization
```
tests/
├── unit/              # Fast unit tests (no external dependencies)
├── integration/       # API integration tests (may skip in CI)
├── e2e/              # End-to-end Playwright tests
├── system/           # Full system tests
├── debug/            # Debug scripts and analysis tools
├── responses/        # Test fixtures and sample responses
└── fixtures/         # Test data (OFX samples, CSV samples)
```

## 🏃‍♂️ Running Tests

### Quick Test Commands
```bash
# Run all tests
make test-all

# Run unit tests only (fast)
make test

# Run with coverage report
pytest --cov=src tests/ --cov-report=html

# Run specific test file
pytest tests/unit/test_capital_gains_calculator.py -v

# Run E2E tests
npm test
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
- Unit Tests: pytest tests/unit/ (fast, always run)
- Integration Tests: pytest tests/integration/ (can skip with SKIP_LIVE_API_TESTS=1)
- E2E Tests: Playwright in headless mode (CI=1)
- System Tests: Full workflow verification
- Matrix Testing: Python 3.9, 3.10, 3.11
```

### Test Categories

#### Unit Tests (Fast, Isolated)
- **Python Backend**: 200+ unit tests for business logic
- **Coverage**: Individual functions, classes, error handling
- **Mocking**: External dependencies (file I/O, network calls)
- **Performance**: <1ms per test, run in <30 seconds

#### Integration Tests (API Layer)
- **API Endpoints**: Lambda handler integration
- **Data Flow**: End-to-end calculation pipeline
- **File Processing**: QFX/CSV parsing with real files
- **Error Scenarios**: Network failures, malformed data

#### E2E Tests (Full User Workflow)
- **Playwright Framework**: Browser automation
- **User Journeys**: File upload → calculation → results display
- **Critical Bug Prevention**: Duplicate file upload test
- **Cross-browser**: Chrome, Firefox, Safari

#### System Tests (Production Validation)
- **Load Testing**: Large file processing
- **Performance**: Response time validation
- **Reliability**: Error recovery and edge cases

## 🛠️ Testing Infrastructure

### Test Fixtures
```python
# OFX Sample Files (tests/fixtures/ofx_samples/)
- basic_buy_transaction.ofx
- buy_with_commission.ofx
- sell_transaction.ofx
- multiple_transactions.ofx
- error_recovery.ofx

# CSV Sample Files (tests/fixtures/csv_samples/)
- sample_trades.csv
- sharesight_export.csv
```

### Test Utilities
```python
# Custom test helpers
def create_test_transaction(type, quantity, price):
    """Factory for test transaction objects"""

def mock_api_response(status_code, data):
    """Mock API responses for integration tests"""

def assert_tax_calculation(expected_gains, actual_result):
    """Custom assertions for tax calculation results"""
```

### Test Data Management
- **Version Control**: Sample files committed to git
- **Immutability**: Test files never modified during testing
- **Documentation**: Each sample file documented with expected results
- **Updates**: Annual review for tax rule changes

## 🎯 Test Quality Standards

### Code Coverage Requirements
- **Statements**: 76%+ coverage achieved
- **Branches**: 73%+ coverage (if/else paths)
- **Functions**: 73%+ coverage (all functions called)
- **Lines**: 77%+ coverage (executable lines)

### Test Quality Metrics
- **Test Independence**: Each test runs in isolation
- **Test Clarity**: Self-documenting test names and assertions
- **Test Performance**: Unit tests <1ms, integration <5s
- **Test Stability**: No flaky tests, deterministic results

### Test-Driven Development (TDD)
```python
# TDD Cycle Example
def test_calculate_capital_gains():
    # 1. RED: Write failing test first
    calculator = CapitalGainsCalculator()
    result = calculator.calculate([])
    assert result.total_gains == 0  # Fails initially

    # 2. GREEN: Implement minimal code to pass
    def calculate(self, transactions):
        return CalculationResult(total_gains=0)

    # 3. REFACTOR: Improve implementation while keeping tests green
    # Add proper calculation logic, error handling, etc.
```

## 🔍 Critical Test Cases

### Tax Calculation Tests
```python
def test_same_day_matching():
    """Test HMRC same-day disposal matching rules"""
    transactions = [
        create_buy_transaction(date="2024-01-15", quantity=100, price=10.0),
        create_sell_transaction(date="2024-01-15", quantity=50, price=12.0)
    ]
    result = calculator.calculate(transactions)
    assert result.matched_by == "same_day"
    assert result.allowable_costs == 500.0  # 50 * 10.0

def test_section_104_pooling():
    """Test share pool accumulation and cost averaging"""
    # Multiple buys at different prices
    # Verify average cost calculation
    # Test remaining shares carry forward
```

### File Processing Tests
```python
def test_qfx_parsing_error_recovery():
    """Test robust parsing with malformed QFX data"""
    malformed_qfx = load_sample("error_recovery.ofx")
    transactions = parser.parse(malformed_qfx)
    assert len(transactions) > 0  # Successfully parsed valid transactions
    # Invalid transactions logged but don't break parsing

def test_csv_currency_conversion():
    """Test multi-currency CSV processing"""
    csv_data = load_sample("multi_currency.csv")
    transactions = parser.parse(csv_data)
    # Verify GBP conversion using exchange rates
    # Check commission handling in different currencies
```

### E2E Workflow Tests
```python
def test_complete_tax_calculation_workflow(page):
    """Playwright E2E test for full user journey"""
    # Navigate to calculator
    page.goto("https://cgttaxtool.uk")

    # Upload QFX file
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')

    # Select tax year
    page.select_option('select[name="tax_year"]', '2024-2025')

    # Submit calculation
    page.click('button[type="submit"]')

    # Verify results display
    page.wait_for_selector('.tax-results')
    assert page.is_visible('.portfolio-table')
    assert page.is_visible('.disposal-table')

    # Verify no duplicate holdings (regression test)
    holdings = page.query_selector_all('.holding-row')
    assert len(holdings) == 6  # Should show 6 individual securities
```

## 🐛 Bug Prevention Tests

### Duplicate File Upload Test
```javascript
// static/js/__tests__/duplicate-file-fix.test.js
describe('File Upload Bug Prevention', () => {
  test('prevents duplicate FormData.append calls', () => {
    const formData = new FormData();
    const file = new File(['test'], 'test.csv');

    // Simulate the fixed upload logic
    formData.append('file', file);
    formData.append('tax_year', '2024-2025');

    // Verify only one file appended
    const formDataEntries = Array.from(formData.entries());
    const fileEntries = formDataEntries.filter(([key]) => key === 'file');
    expect(fileEntries).toHaveLength(1);
  });
});
```

### Data Aggregation Prevention
```python
def test_prevents_data_aggregation():
    """Regression test for duplicate file upload bug"""
    # Simulate duplicate file submission
    duplicate_files = [sample_qfx, sample_qfx]  # Same file twice

    with pytest.raises(ValueError, match="Duplicate file detected"):
        calculator.calculate_from_files(duplicate_files)

    # Verify individual securities preserved
    result = calculator.calculate_from_files([sample_qfx])
    assert len(result.holdings) == 6  # Individual securities
    assert result.holdings[0].symbol != result.holdings[1].symbol
```

## 📈 Performance Testing

### Load Testing
```python
def test_large_portfolio_processing():
    """Test performance with large transaction files"""
    large_file = load_sample("large_portfolio.qfx")  # 1000+ transactions

    start_time = time.time()
    result = calculator.calculate_from_file(large_file)
    duration = time.time() - start_time

    assert duration < 30.0  # Should process in under 30 seconds
    assert len(result.transactions) > 1000
    assert result.total_gains > 0
```

### Memory Usage Testing
```python
def test_memory_efficiency():
    """Ensure no memory leaks in large file processing"""
    import psutil
    import os

    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss

    # Process large file multiple times
    for _ in range(10):
        result = calculator.calculate_from_file(large_file)

    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory

    # Allow reasonable memory increase, but detect leaks
    assert memory_increase < 50 * 1024 * 1024  # <50MB increase
```

## 🔧 Test Maintenance

### Adding New Tests
1. **Identify Test Type**: Unit, integration, or E2E
2. **Follow Naming Convention**: `test_[feature]_[scenario]_[expected_result]`
3. **Add to Appropriate Directory**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
4. **Include Documentation**: Docstring explaining test purpose
5. **Update Coverage**: Ensure new code is tested

### Test Data Updates
- **Annual Review**: Update tax rates and rules annually
- **Sample Files**: Add new edge cases as discovered
- **Documentation**: Update test data README files
- **CI Validation**: Ensure all tests pass with updates

### Test Debugging
```bash
# Run single failing test with debug output
pytest tests/unit/test_calculator.py::test_tax_calculation -v -s

# Run with coverage for specific file
pytest --cov=src/main/python/calculator.py tests/unit/test_calculator.py

# Debug E2E test with visible browser
npm run test:e2e:debug
```

## 📊 Test Reporting

### Coverage Reports
```bash
# Generate HTML coverage report
pytest --cov=src --cov-report=html

# View report in browser
open htmlcov/index.html
```

### Test Results Analysis
```bash
# Show slowest tests
pytest --durations=10

# Show test summary with failures
pytest --tb=short -q

# Generate JUnit XML for CI
pytest --junitxml=test-results.xml
```

### Quality Metrics
- **Test Pass Rate**: 100% (all tests passing)
- **Coverage Trend**: Monitor coverage over time
- **Performance Baseline**: Track test execution time
- **Flakiness Detection**: Identify unstable tests

## 🎯 Best Practices

### Test Organization
- **One Concept Per Test**: Each test verifies one specific behavior
- **Descriptive Names**: Test names explain what they verify
- **Arrange-Act-Assert**: Clear test structure
- **Independent Tests**: No test depends on others

### Test Data Management
- **Realistic Data**: Use actual broker export formats
- **Edge Cases**: Include boundary conditions and error scenarios
- **Version Control**: Test data committed with code
- **Documentation**: Explain test data purpose and expected results

### CI/CD Integration
- **Fast Feedback**: Unit tests run on every commit
- **Quality Gates**: Coverage and quality requirements
- **Parallel Execution**: Tests run in parallel for speed
- **Artifact Storage**: Test reports and coverage stored

---

*This testing guide consolidates information from JAVASCRIPT_UNIT_TESTS_SUMMARY.md, context.md, README.md, and ui_tasks.md into a single comprehensive reference.*

*Last Updated: 2025-10-14*
