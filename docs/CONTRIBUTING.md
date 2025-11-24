# 🤝 Contributing to IBKR Tax Calculator

Developer guide for contributing to the UK Capital Gains Tax Calculator project.

## 🎯 Project Overview

**Purpose**: Provide accurate UK capital gains tax calculations for stocks and shares, ensuring HMRC compliance and comprehensive portfolio analysis.

**Tech Stack**:
- **Backend**: Python 3.10+, AWS Lambda, pytest
- **Frontend**: React + TypeScript + Vite, Bootstrap
- **Infrastructure**: AWS (Lambda, API Gateway, S3, CloudFront, Route53), Terraform
- **Testing**: pytest (Python), Playwright (E2E), Jest (JS unit tests)
- **Local Dev**: LocalStack, Docker, docker-compose

**Architecture**: Serverless React SPA (S3 + CloudFront) + Python Lambda (API Gateway)

## 🚀 Getting Started

### Prerequisites

- Python 3.10+ with conda
- Node.js 18+ and npm
- AWS CLI configured with profile `goker`
- Docker and docker-compose
- Terraform (for infrastructure changes)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd ibkr-tax-calculator

# Set up Python environment
conda create -n ibkr-tax python=3.10
conda activate ibkr-tax
pip install -r requirements.txt

# Set up frontend
cd frontend
npm install
cd ..

# Start LocalStack for local development
docker-compose up -d
```

## 📁 Project Structure

```
ibkr-tax-calculator/
├── src/                      # Python backend code
│   └── main/python/
│       ├── models/          # Data models
│       ├── parsers/         # QFX/CSV parsers
│       ├── services/        # Business logic
│       ├── interfaces/      # Abstractions
│       ├── config/          # Configuration
│       └── utils/           # Utilities
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── dist/                # Build output
├── deployment/               # Deployment scripts & configs
│   ├── terraform/           # Terraform IaC
│   ├── lambda_handler.py    # Lambda entry point
│   └── *.sh                 # Deployment scripts
├── tests/                    # Test suite
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── system/              # System tests
│   └── e2e/                 # E2E tests (Playwright)
├── data/                     # Test data files
└── docs/                     # Documentation
```

## 🔧 Development Workflow

### Running Locally

#### CLI Mode
```bash
conda activate ibkr-tax
python run_calculator.py --input data/U14657426_20240408_20250404.qfx --tax-year 2024-2025
```

#### Local Web App (LocalStack)
```bash
# Start LocalStack
docker-compose up -d

# Deploy to LocalStack
sh run-local-dev.sh

# Access at http://ibkr-tax-calculator-local-bucket.s3-website.us-east-1.amazonaws.com
```

#### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server at http://localhost:5173
```

### Running Tests

#### Python Tests
```bash
conda activate ibkr-tax

# All tests
pytest

# Specific test file
pytest tests/unit/test_tax_calculator.py

# With coverage
pytest --cov=src --cov-report=html
```

#### JavaScript Tests
```bash
cd frontend

# Unit tests (Jest)
npm run test:unit

# E2E tests (Playwright)
npm run test

# E2E with UI
npm run test:ui
```

## 🏗️ Development Conventions

### Python Backend

**Principles**:
- SOLID principles
- Dependency Injection
- Interface Segregation
- Strategy Pattern for tax calculations
- Factory Method for parser selection

**Code Style**:
- Follow PEP 8
- Type hints for all functions
- Docstrings for public APIs
- Maximum line length: 100 characters

**Testing**:
- Unit tests for all business logic
- Integration tests for parsers and services
- Minimum 80% code coverage

### Frontend (React/TypeScript)

**Principles**:
- Component-based architecture
- Separation of concerns (components, services, types)
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)

**Code Style**:
- TypeScript strict mode
- Functional components with hooks
- CSS modules or styled-components
- ESLint + Prettier for formatting

**Testing**:
- Unit tests for utility functions
- Component tests for UI logic
- E2E tests for critical user flows

## 📝 Making Changes

### Backend Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** in `src/main/python/`
   - **IMPORTANT**: Do NOT change backend code without user approval
   - Follow existing patterns and architecture
   - Add type hints and docstrings

3. **Write tests** in `tests/`
   ```bash
   pytest tests/unit/test_your_feature.py
   ```

4. **Test locally**
   ```bash
   python run_calculator.py --input data/test_file.qfx --tax-year 2024-2025
   ```

### Frontend Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/ui-enhancement
   ```

2. **Make changes** in `frontend/src/`
   - Follow React best practices
   - Use TypeScript for type safety
   - Keep components small and focused

3. **Test locally**
   ```bash
   cd frontend
   npm run dev
   npm run test:unit
   ```

4. **Build and verify**
   ```bash
   npm run build
   # Check dist/ output
   ```

### Infrastructure Changes

1. **Edit Terraform configs** in `deployment/terraform/`
2. **Plan changes**
   ```bash
   cd deployment/terraform
   terraform plan
   ```
3. **Get approval** before applying
4. **Apply changes**
   ```bash
   terraform apply
   ```

## 🚀 Deployment Process

### Backend Deployment

```bash
# 1. Package Lambda
conda activate ibkr-tax
./deployment/01-package.sh

# 2. Deploy code
./deployment/03-deploy-api-code.sh

# Or use Terraform
./deployment/terraform-deploy.sh
```

### Frontend Deployment

```bash
# 1. Build SPA
cd frontend
npm run build

# 2. Deploy to S3
aws s3 sync dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
  --profile goker \
  --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/*" \
  --profile goker
```

### Deployment Checklist

- [ ] All tests passing locally
- [ ] Code reviewed (if applicable)
- [ ] Backend: Lambda packaged and deployed
- [ ] Frontend: Built and synced to S3
- [ ] CloudFront cache invalidated
- [ ] Smoke test on production (https://cgttaxtool.uk)
- [ ] Monitor CloudWatch logs for 15-30 minutes
- [ ] Verify API health: `https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod/health`

## 🧪 Testing Guidelines

### Test Data

Use files in `data/` folder for testing:
- `U14657426_20240408_20250404.qfx` - Full dataset (20 transactions)
- `U11075163F_20240408_20250404.qfx` - Empty dataset (0 transactions)

### Writing Tests

**Python Unit Test Example**:
```python
import pytest
from src.main.python.services.tax_calculator import TaxCalculator

def test_capital_gains_calculation():
    calculator = TaxCalculator(tax_year="2024-2025")
    result = calculator.calculate_disposal(
        proceeds=1000,
        cost_basis=800,
        expenses=10
    )
    assert result.gain == 190
```

**Playwright E2E Test Example**:
```typescript
test('calculate tax for QFX file', async ({ page }) => {
  await page.goto('https://cgttaxtool.uk/#/calculator');
  await page.setInputFiles('input[type="file"]', 'data/test.qfx');
  await page.click('button:has-text("Calculate")');
  await expect(page.locator('.results-table')).toBeVisible();
});
```

## 🐛 Debugging

### Backend Debugging

```bash
# Check Lambda logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 --follow --profile goker

# Local debugging
python -m pdb run_calculator.py --input data/test.qfx --tax-year 2024-2025
```

### Frontend Debugging

- Use React DevTools browser extension
- Check browser console for errors
- Use Vite's built-in debugging: `npm run dev`

## 📚 Key Resources

- **Tax Rules**: [HMRC Capital Gains Tax](https://www.gov.uk/capital-gains-tax)
- **AWS Lambda**: [Python Lambda Guide](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- **React**: [React Documentation](https://react.dev/)
- **Terraform**: [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/)

## 🔐 Important Notes

### Security
- Never commit AWS credentials
- Use environment variables for sensitive data
- Follow principle of least privilege for IAM roles

### Data Privacy
- No permanent data storage (GDPR compliant)
- All calculations done in-memory
- User files never saved to disk/S3

### Code Quality
- Maintain test coverage above 80%
- Run linters before committing
- Follow existing code patterns
- Document complex logic

## 💡 Tips

- **Python Environment**: Always use `conda activate ibkr-tax`
- **Check Libraries**: Verify installed packages before adding new ones
- **Test Before Deploy**: Locally test implementation before AWS deployment
- **Real Data**: Use actual QFX files from `data/` folder for testing
- **AWS Session**: If AWS errors occur, run `aws sso login --profile goker`

---

*Last Updated: 2025-11-20*
