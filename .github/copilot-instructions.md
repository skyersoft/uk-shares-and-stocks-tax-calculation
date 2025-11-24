# UK CGT Calculator - AI Coding Agent Instructions

## Project Overview
UK Capital Gains Tax calculator processing QFX/CSV files from brokers (Interactive Brokers, Sharesight). Live at **https://cgttaxtool.uk** - AWS Lambda serverless architecture with React SPA frontend.

## Critical Architecture Patterns

### Dependency Injection via Interfaces
All business logic uses abstract interfaces (`src/main/python/interfaces/calculator_interfaces.py`):
```python
# Parsers implement FileParserInterface
from .interfaces.calculator_interfaces import FileParserInterface

class QfxParser(FileParserInterface):
    def parse(self, file_path: str) -> List[Transaction]: ...
    def supports_file_type(self, file_type: str) -> bool: ...
```

**When adding features**: Create interface first, then implementation. See existing patterns:
- `TransactionMatcherInterface` → `UKTransactionMatcher`
- `DisposalCalculatorInterface` → `UKDisposalCalculator`
- `SharePoolManagerInterface` → `SharePoolManager`

### Lambda Handler Request Routing
Entry point: `deployment/lambda_handler.py`
- API Gateway requests: `handle_api_gateway_request(event, context)`
- Handles multipart/form-data file uploads with base64 decoding
- CORS headers required: `Access-Control-Allow-Origin: *`
- Import paths use `sys.path.append('./main/python')` for Lambda packaging

## Essential Development Workflows

### Environment Setup
```bash
conda activate ibkr-tax  # Default Python environment
pip install -r requirements.txt web_requirements.txt

# Frontend (React SPA)
cd frontend && npm install
npm run dev:spa  # Vite dev server
```

### Running Tests (Use Makefile)
```bash
make test              # Unit tests (pytest tests/unit/)
make test-integration  # API integration tests
make test-e2e          # Playwright E2E tests
make test-all          # Full suite with coverage

# Frontend tests
npm run test:unit      # Jest tests (frontend/src/__tests__/)
npm test               # Playwright E2E
```

### AWS Deployment
```bash
cd deployment/
./deploy-all.sh        # Complete deployment (package → infra → code → test)

# Manual steps:
./01-package.sh        # Creates lambda-deployment.zip
./02-deploy-infrastructure.sh  # CloudFormation stack
./03-deploy-code.sh    # Update Lambda code

# Frontend deployment (React SPA)
cd frontend && npm run build     # Creates dist/
aws s3 sync dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
    --profile goker --delete
aws cloudfront create-invalidation --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*" --profile goker
```

**AWS Profile**: Always use `--profile goker` (Account: 286154443186)

## Project-Specific Conventions

### File Parsing Pattern
QFX and CSV parsers follow standardized error recovery:
```python
# src/main/python/parsers/qfx_parser.py
try:
    transactions = parse_primary_method(file_path)
except ParseError:
    transactions = fallback_parser(file_path)  # Multiple strategies
```

When price is missing/zero, calculate from total: `price = total_amount / quantity`

### Tax Calculation Flow
```
1. Parse file → List[Transaction]
2. UKTransactionMatcher.match_disposals() → Same-day/30-day/pool matching
3. SharePoolManager.process_transaction() → Section 104 pooling
4. UKDisposalCalculator.calculate_disposal() → Gains/losses per disposal
5. EnhancedTaxYearCalculator.calculate() → Annual summary with £3,000 exemption
```

### Frontend API Integration
React SPA uses centralized API client (`frontend/src/services/api.ts`):
```typescript
export async function submitCalculation({ file, taxYear, analysisType }) {
  const base = window.location.origin + '/prod';
  const form = new FormData();
  form.append('file', file);
  form.append('tax_year', taxYear);
  // ... returns normalized { raw } response
}
```

**Critical**: Production API path is `/prod/calculate`, local is `/calculate`

### Test Organization
```
tests/
├── unit/          # Fast, isolated (pytest, mocked dependencies)
├── integration/   # Real API calls to Lambda/local server
├── e2e/          # Playwright browser tests (full workflow)
├── system/       # End-to-end system validation
└── fixtures/     # Sample QFX/CSV files for testing
```

## Common Gotchas

1. **Duplicate File Upload Bug (FIXED)**: Legacy static HTML had FormData duplication. React SPA uses controlled file inputs properly.

2. **Lambda Import Paths**: Deployment package flattens structure. Use:
   ```python
   from main.python.capital_gains_calculator import create_enhanced_calculator
   ```

3. **Tax Year Format**: Always `"YYYY-YYYY"` (e.g., `"2024-2025"`). UK tax year: April 6 → April 5.

4. **Currency Handling**: All calculations in GBP. Exchange rates applied at transaction time.

5. **Vite Build**: Frontend build uses relative paths (`base: './'`). Polyfills required for Buffer (gray-matter dependency).

## TDD Workflow

1. **Write failing test first** in appropriate `tests/` subdirectory
2. **Implement minimal code** to pass
3. **Run relevant test suite**: `make test-unit` or `npm run test:unit`
4. **Refactor** while keeping tests green
5. **Run full suite** before commit: `make test-all && npm run test:all`

Coverage target: **90%+** (current: 76%+ statements/branches)

## Task Tracking

- **tasks.md**: Main development tasks (backend focus)
- **UI_ENHANCEMENT_TASKS.md**: Frontend/UX improvements
- **PROJECT_PLAN.md**: Agile sprint structure

Record bugs in task files, prioritize, then fix systematically. Always run tests before marking complete.

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Main calculator entry | `src/main/python/capital_gains_calculator.py` |
| Lambda handler | `deployment/lambda_handler.py` |
| Tax calculation engine | `src/main/python/calculator.py` |
| QFX parser | `src/main/python/parsers/qfx_parser.py` |
| CSV parser | `src/main/python/parsers/csv_parser.py` |
| React SPA entry | `frontend/src/main.tsx` |
| API client | `frontend/src/services/api.ts` |
| Calculator page | `frontend/src/pages/CalculatorPage.tsx` |
| Results page | `frontend/src/pages/ResultsPage.tsx` |
| Vite config | `frontend/vite.config.ts` |
| CloudFormation | `deployment/single-region-complete.yaml` |

## Documentation References

- **context.md**: Developer onboarding guide
- **GEMINI.md**: Comprehensive project overview
- **TESTING.md**: Detailed testing strategy
- **tasks.md**: Current development status
- **AWS_DEPLOYMENT_REFERENCE.md**: Infrastructure details (S3 bucket, CloudFront ID, etc.)

---

**Philosophy**: Write clean, testable code. TDD always. SOLID principles. Deploy confidently with comprehensive tests. Keep the customer happy with working software.
