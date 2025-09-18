---
applyTo: '**'
---

# IBKR Tax Calculator - Copilot System Instructions

## 🎯 Project Context
This is a UK Capital Gains Tax Calculator for stocks and shares, processing QFX/CSV files from trading platforms like Interactive Brokers. It's a Python-based financial application with a Flask web interface and AWS Lambda deployment.

## 🏗️ Architecture & Technology Stack

### Backend (Python)
- **Framework**: Flask web application with Celery for background tasks
- **Testing**: pytest for unit/integration tests, Playwright for E2E UI testing
- **Parsing**: ofxparse for QFX files, custom CSV parsers
- **Environment**: `conda activate ibkr-tax` (always active as default)
- **Key Libraries**: pydantic, typer, rich, python-dateutil

### Frontend (JavaScript/React)
- **Framework**: React 18 with Vite for build tooling
- **Testing**: Jest for unit tests, Playwright for E2E testing
- **Structure**: Static files in `/static/` directory for Flask serving

### Infrastructure
- **Deployment**: AWS Lambda + API Gateway with CloudFront CDN
- **Local Development**: Docker Compose with LocalStack for AWS simulation
- **CI/CD**: Automated testing and deployment pipeline

## 🧱 SOLID Principles & Design Patterns

### 1. Single Responsibility Principle (SRP)
- Each class should have ONE reason to change
- Separate parsing, calculation, and reporting concerns
- Example: `QfxParser` only handles QFX parsing, `TaxYearCalculator` only handles tax calculations

### 2. Open/Closed Principle (OCP)
- Classes should be open for extension, closed for modification
- Use Factory patterns for creating Securities and Transactions
- Example: `SecurityFactory` can create different security types without modifying existing code

### 3. Liskov Substitution Principle (LSP)
- Derived classes must be substitutable for their base classes
- All parsers should implement the same interface
- Example: CSV and QFX parsers should be interchangeable

### 4. Interface Segregation Principle (ISP)
- Clients shouldn't depend on interfaces they don't use
- Create specific interfaces for different operations
- Example: Separate interfaces for parsing vs. calculation

### 5. Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use dependency injection for external services
- Example: Inject parsers and calculators rather than hardcoding

### Design Patterns to Use
- **Factory Pattern**: For creating Securities, Transactions, Parsers
- **Strategy Pattern**: For different tax calculation methods
- **Observer Pattern**: For progress tracking and notifications
- **Repository Pattern**: For data access abstraction
- **Command Pattern**: For UI actions and undo functionality

## 🧪 Test-Driven Development (TDD) Guidelines

### TDD Cycle (Red-Green-Refactor)
1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code while keeping tests green

### Test Hierarchy (Follow existing structure in `/tests/`)
```
tests/
├── unit/           # Fast, isolated unit tests
├── integration/    # Component interaction tests
├── system/         # End-to-end system tests
├── e2e/           # Browser-based E2E tests
└── web/           # Web interface specific tests
```

### Test Naming Convention
- **Unit Tests**: `test_[component]_[behavior]_[expected_result]`
- **Integration Tests**: `test_[feature]_integration`
- **E2E Tests**: `test_[user_scenario]_e2e`

### Test Quality Rules
1. **Test Independence**: Each test should run independently
2. **Test Clarity**: Tests should be self-documenting
3. **Test Coverage**: Aim for >90% code coverage
4. **Test Performance**: Unit tests should run in <1ms each
5. **Test Stability**: Tests should not be flaky

### Test-First Development Process
```python
# 1. Write failing test
def test_share_pool_calculates_average_cost():
    pool = SharePoolManager()
    pool.add_shares(100, 10.0)  # 100 shares at £10 each
    pool.add_shares(50, 12.0)   # 50 shares at £12 each
    
    assert pool.average_cost == 10.67  # (1000 + 600) / 150
    assert pool.total_shares == 150

# 2. Implement minimal code to pass
# 3. Refactor while keeping tests green
```

## 📋 Task Management System

### Primary Task Tracking: `tasks.md` Files
Use dedicated markdown files for task tracking:
- **Main Tasks**: `/tasks.md` (project-level tasks)
- **Feature Tasks**: `/ui_tasks.md`, `/enhancement_tasks.md` etc.
- **Sprint Tasks**: Reference existing `/PROJECT_PLAN.md` structure

### Task File Format
```markdown
# [Feature Name] Tasks

## 📊 Current Sprint Status
- **Sprint Goal**: [What we're trying to achieve]
- **Due Date**: [When it should be complete]
- **Related Tests**: [Link to test files]

## 🎯 Tasks

### In Progress
- [ ] **Task Title** - Brief description
  - **Component**: `ClassName` 
  - **Test File**: `tests/unit/test_component.py`
  - **Status**: In Progress
  - **Notes**: Any blockers or decisions needed

### Todo
- [ ] **Next Task** - Description
  - **Dependencies**: [List of tasks that must be done first]
  - **Estimated Effort**: [Small/Medium/Large]

### Done
- [x] **Completed Task** - Description ✅
  - **Completed**: 2025-09-18
  - **Test Results**: All passing
```

### Internal Todo List for Subtasks
Use Copilot's internal todo management for breaking down tasks:
```markdown
Example: For task "Implement SharePoolManager"
1. Design SharePoolManager interface
2. Write unit tests for adding shares
3. Write unit tests for removing shares  
4. Write unit tests for average cost calculation
5. Implement SharePoolManager class
6. Run tests and fix any failures
7. Update tasks.md with completion
```

### Linking Tasks to Tests
Every task should reference its associated test file:
- **Component**: Which class/module is being worked on
- **Test File**: Exact path to the test file
- **Test Coverage**: What aspects are being tested

## 🔧 Code Quality Standards

### Naming Conventions
- **Classes**: PascalCase (`SharePoolManager`, `TaxYearCalculator`)
- **Functions/Methods**: snake_case (`calculate_disposal`, `parse_qfx_file`)
- **Variables**: snake_case (`annual_exemption`, `total_shares`)
- **Constants**: UPPER_SNAKE_CASE (`UK_TAX_YEAR_START`, `DEFAULT_CURRENCY`)
- **Files**: snake_case (`tax_calculator.py`, `share_pool_manager.py`)

### Documentation Standards
```python
class SharePoolManager:
    """Manages UK Section 104 share pools for capital gains calculations.
    
    The SharePoolManager handles the pooling of identical shares according
    to UK tax rules, calculating average costs and managing disposals.
    
    Attributes:
        total_shares (int): Total number of shares in the pool
        total_cost (Decimal): Total cost basis of all shares
        average_cost (Decimal): Average cost per share
    
    Example:
        >>> pool = SharePoolManager()
        >>> pool.add_shares(100, Decimal('10.50'))
        >>> pool.remove_shares(25)
        ShareDisposal(shares=25, cost=Decimal('262.50'))
    """
```

### Error Handling Patterns
```python
# Use specific exceptions
class QfxParsingError(Exception):
    """Raised when QFX file cannot be parsed."""
    pass

# Use context managers for resources
with open(file_path, 'r') as file:
    content = file.read()

# Validate inputs early
def calculate_disposal(shares: int, price: Decimal) -> Decimal:
    if shares <= 0:
        raise ValueError("Shares must be positive")
    if price <= 0:
        raise ValueError("Price must be positive")
    
    return shares * price
```

## 🚀 Development Workflow

### Before Starting Any Work
1. **Activate Environment**: Ensure `conda activate ibkr-tax` is active
2. **Update Tasks**: Add/update task in appropriate `tasks.md` file
3. **Review Tests**: Check existing test coverage for the area
4. **Plan Approach**: Break down task into subtasks using internal todos

### Development Process
1. **Write Failing Tests**: Start with test cases that capture requirements
2. **Implement Minimal Code**: Write just enough code to pass tests
3. **Run Tests**: Execute relevant test suite (`pytest tests/unit/test_[component].py`)
4. **Refactor**: Improve code structure while keeping tests green
5. **Run All Tests**: Ensure no regressions (`pytest`)
6. **Update Tasks**: Mark subtasks complete, update main task status

### Testing Commands
```bash
# Run all tests
pytest

# Run specific test file  
pytest tests/unit/test_share_pool_manager.py

# Run with coverage
pytest --cov=src tests/

# Run UI tests (Playwright)
playwright test

# Run web tests specifically
pytest tests/web/
```

## 🌐 Web Development Guidelines

### Frontend Structure
- **Static Files**: `/static/` directory for CSS, JS, images
- **Templates**: Flask Jinja2 templates for server-side rendering  
- **React Components**: Modern React patterns with hooks
- **Build Process**: Vite for development and production builds

### JavaScript/React Standards
```javascript
// Use modern ES6+ syntax
const SharePoolManager = {
  addShares: (shares, price) => {
    // Implementation
  },
  
  calculateAverageCost: () => {
    // Implementation  
  }
};

// Use React hooks for state management
const TaxCalculator = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleFileUpload = async (file) => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return <div>{/* Component JSX */}</div>;
};
```

### UI Testing with Playwright
```python
def test_file_upload_functionality(page):
    """Test complete file upload and results flow."""
    page.goto('http://localhost:5000/calculate')
    
    # Upload file
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')
    page.click('button[type="submit"]')
    
    # Wait for results
    page.wait_for_url('**/results**')
    
    # Verify results display
    assert page.is_visible('.tax-calculation-results')
    assert page.get_by_text('Capital Gains Summary').is_visible()
```

## ☁️ AWS Deployment & Infrastructure

### Local Development
- **LocalStack**: Use Docker Compose for local AWS simulation
- **Environment**: All AWS services available at `http://localhost:4566`
- **AWS CLI**: Pre-configured at `/usr/local/bin/aws`

### Deployment Pipeline
1. **Package Lambda**: Create deployment packages for Python functions
2. **Deploy Infrastructure**: Use AWS CLI or CDK for resource creation
3. **Update Code**: Deploy application code to Lambda functions  
4. **Test Deployment**: Run integration tests against deployed environment
5. **Monitor**: Check CloudWatch logs and metrics

### Infrastructure as Code
```bash
# Deploy to AWS
aws cloudformation deploy --template-file infrastructure.yaml --stack-name ibkr-tax-calculator

# Update Lambda function
aws lambda update-function-code --function-name tax-calculator --zip-file fileb://deployment.zip
```

## 🔍 Continuous Integration

### Pre-commit Checks
1. **Linting**: Run flake8 and pylint on Python code
2. **Type Checking**: Use mypy for static type analysis  
3. **Security**: Run bandit for security vulnerability scanning
4. **Testing**: All tests must pass before commit

### Automated Testing Pipeline
1. **Unit Tests**: Fast feedback on individual components
2. **Integration Tests**: Verify component interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Ensure acceptable response times
5. **Security Tests**: Verify no vulnerabilities introduced

## 📝 Communication & Collaboration

### Code Review Guidelines
- **Small Changes**: Keep pull requests focused and small
- **Clear Descriptions**: Explain what changed and why
- **Test Evidence**: Include test results and coverage reports
- **Documentation**: Update relevant documentation

### Commit Message Format
```
[Component] Brief description of change

- Specific change 1
- Specific change 2

Tests: [Pass/Fail] - [Number] tests, [Coverage]%
Related: [Task/Issue reference]
```

### Progress Updates
- **Daily**: Update task status in `tasks.md` files
- **Weekly**: Review completed tasks and plan next sprint
- **Monthly**: Assess overall project progress and goals

---

## 🎯 Summary Checklist

Before completing any task, ensure:
- [ ] Tests written and passing (TDD approach)
- [ ] Code follows SOLID principles
- [ ] Task updated in appropriate `tasks.md` file
- [ ] All tests run and pass (`pytest`)
- [ ] UI changes tested with Playwright (if applicable)
- [ ] Documentation updated (if needed)
- [ ] No regressions introduced
- [ ] Code reviewed for security and performance