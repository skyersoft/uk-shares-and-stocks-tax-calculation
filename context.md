# IBKR Tax Calculator - Developer Context Guide

## 📋 Project Overview

**UK Capital Gains Tax Calculator for Stocks and Shares** - A serverless web application that processes QFX and CSV files from brokers like Interactive Brokers to calculate UK capital gains tax according to HMRC rules.

### Key Features
- **File Processing**: Supports QFX (Quicken) and CSV formats from major brokers
- **Tax Calculations**: Implements UK HMRC capital gains tax rules including same-day/30-day matching
- **Portfolio Analysis**: Shows current holdings, unrealized gains, dividends
- **Responsive UI**: Mobile-friendly Bootstrap interface with drag & drop file upload
- **Monetization**: Google AdSense integration for revenue generation

### Live Deployment
- **Website**: https://cgttaxtool.uk/
- **API Endpoint**: https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/
- **Status**: Production-ready, actively serving users

## 🏗️ Business Feature Definitions

### Core Business Logic
- **Capital Gains Tax Calculation**: HMRC-compliant CGT calculations with proper matching rules
- **Share Pool Management**: Section 104 holding pools with average cost basis
- **Transaction Matching**: Same-day, 30-day bed & breakfast, and pool matching rules
- **Currency Conversion**: Multi-currency support with proper GBP conversion
- **Annual Exemption**: £3,000 tax-free allowance application
- **Report Generation**: CSV/JSON export formats for tax records

### File Processing
- **QFX Parser**: Quicken format support for Interactive Brokers exports
- **CSV Parser**: Sharesight and similar broker CSV format support
- **Error Recovery**: Robust parsing with fallback strategies
- **Validation**: Comprehensive data validation and error reporting

### Web Interface
- **File Upload**: Drag-and-drop interface with progress indicators
- **Results Display**: Interactive tables with sorting and filtering
- **Responsive Design**: Mobile-first Bootstrap implementation
- **Error Handling**: User-friendly error messages and recovery options

## 🏗️ Architecture Overview

### Backend (Python 3.10+)
```
deployment/
├── lambda_handler.py          # AWS Lambda entry point and routing
├── cloudformation-template.yaml # Infrastructure as Code
└── deploy.sh                  # Automated deployment script

src/main/python/
├── capital_gains_calculator.py # Main calculation engine
├── models/                     # Domain models (Transaction, Security, etc.)
├── parsers/                    # QFX and CSV file parsers
├── services/                   # Business logic services
└── utils/                      # Helper functions and utilities
```

### Frontend (React SPA)
```
frontend/
├── src/
│   ├── components/           # React components
│   ├── pages/                # Page components (Landing, Calculator, Results)
│   ├── context/              # React context providers
│   ├── services/             # API client and services
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Helper functions
│   └── index.html            # SPA entry point
├── public/                   # Static assets (favicon, ads.txt)
├── dist/                     # Production build output
└── vite.config.ts            # Vite build configuration
```

### AWS Infrastructure
- **Lambda Function**: Serverless compute for tax calculations
- **API Gateway**: RESTful API with CORS support
- **CloudFront**: CDN for static assets with custom domain
- **S3 Bucket**: Static website hosting
- **Route 53**: DNS management for cgttaxtool.uk
- **Certificate Manager**: SSL/TLS certificates

## 🚀 Development Setup

### Prerequisites
```bash
# Python environment (recommended: conda)
conda create -n ibkr-tax python=3.10
conda activate ibkr-tax

# Install Python dependencies
pip install -r requirements.txt        # Backend
pip install -r web_requirements.txt    # Web-specific

# Node.js dependencies (for testing and React SPA)
npm install
```

### Local Development
```bash
# Run local Flask development server
python run_webapp.py

# Run React SPA development server (when ready)
npm run dev:spa

# Run tests
npm test                    # Playwright E2E tests
npm run test:unit          # Jest unit tests  
python -m pytest tests/   # Python unit tests
```

### File Structure for Development
```
# Core calculation logic
src/main/python/capital_gains_calculator.py

# File parsing (add new broker support here)
src/main/python/parsers/qfx_parser.py
src/main/python/parsers/csv_parser.py

# Frontend SPA
frontend/src/pages/CalculatorPage.tsx  # File upload and calculation
frontend/src/pages/ResultsPage.tsx     # Results display
frontend/src/services/api.ts           # API client
frontend/src/types/calculation.ts      # Type definitions

# Tests
tests/unit/           # Python unit tests
tests/e2e/           # Playwright end-to-end tests
tests/integration/   # API and integration tests
```

## 📦 Deployment Process

### Automated Deployment
```bash
# Complete deployment to AWS
cd deployment/
./deploy.sh

# Manual function update only
aws lambda update-function-code \
    --function-name ibkr-tax-calculator-prod \
    --zip-file fileb://lambda-deployment.zip
```

### Deployment Components
1. **Package Lambda**: Creates `lambda-deployment.zip` with all dependencies
2. **CloudFormation Stack**: Deploys/updates AWS infrastructure
3. **Build SPA**: `npm run build` in frontend directory creates production bundle
4. **Sync Frontend**: Upload `frontend/dist/` to S3 bucket
5. **CloudFront Invalidation**: Clears CDN cache for immediate updates

### Environment Configuration
```bash
# AWS credentials (SSO-based authentication)
aws sso login --profile goker

# Alternative: Traditional credentials setup
aws configure
# AWS Access Key ID: [Your Key]
# AWS Secret Access Key: [Your Secret] 
# Default region: eu-west-1
# Default output format: json

# Note: If you get credential errors, always run:
aws sso login --profile goker
```

## 🔧 Common Development Issues

### Import Errors in Lambda
```python
# Lambda handler structure
sys.path.append('/opt/python')  # Lambda layer path
sys.path.append('.')
sys.path.append('./main/python')
```

#### CORS Issues
```javascript
// API Gateway automatically handles CORS
// Frontend origin: https://cgttaxtool.uk  
// API endpoint: https://cgttaxtool.uk/prod/* (routed via CloudFront)
```

#### File Upload Size Limits
- **Lambda**: 6MB request payload limit
- **API Gateway**: 10MB payload limit  
- **Frontend**: 50MB file size validation
- **Solution**: Large files processed via pre-signed S3 URLs (future enhancement)

## 🧪 Testing Strategy

### End-to-End Testing (Playwright)
```bash
# Run full test suite
npm test

# Specific test files
npx playwright test tests/e2e/test_calculation_e2e.py
npx playwright test tests/e2e/test_results_inspection.py
```

### Unit Testing
```bash
# Python backend tests
python -m pytest tests/unit/ -v

# JavaScript frontend tests (when implemented)
npm run test:unit
```

### Manual Testing Files
```
data/sample_files/
├── U11075163_202409_202409.qfx    # Sample QFX from IBKR
├── sample_trades.csv              # Sample CSV format
└── large_portfolio.qfx            # Performance testing
```

## 📊 Monitoring & Analytics

### AWS CloudWatch Metrics
- **Lambda Duration**: Function execution time
- **Lambda Errors**: Exception count and types
- **API Gateway 4XX/5XX**: Client and server errors
- **CloudFront Cache Hit Ratio**: CDN performance

### Revenue Tracking
- **Google AdSense**: RPM, click-through rates
- **Amazon Associates**: Conversion rates
- **User Analytics**: Google Analytics for traffic patterns

### Performance Benchmarks
- **Small files** (<1MB): <2 seconds processing
- **Medium files** (1-10MB): <10 seconds processing  
- **Large files** (>10MB): <60 seconds processing
- **Lambda timeout**: 15 minutes maximum

## 🔐 Security & Compliance

### Data Handling
- **No Persistent Storage**: Files processed in memory only
- **Temporary Files**: Deleted after processing
- **No User Data**: No PII stored or logged
- **HTTPS Only**: All communications encrypted

### AWS Security
- **IAM Roles**: Least privilege access
- **VPC**: Lambda runs in AWS managed VPC
- **CloudTrail**: API call logging
- **WAF**: Web Application Firewall (future enhancement)

## 🚀 Future Roadmap

### Immediate (Next 1-2 weeks)
- [ ] Add comprehensive error handling in SPA
- [ ] Implement loading states and user feedback
- [ ] Enhanced results visualization

### Short Term (1-3 months)  
- [ ] Add support for additional file formats
- [ ] Implement user account system (optional)
- [ ] Enhanced tax optimization suggestions

### Long Term (3-6 months)
- [ ] Multi-year tax planning tools
- [ ] Integration with HMRC Self Assessment
- [ ] Support for other investment types (bonds, funds)
- [ ] Mobile app (React Native)

## 💡 Development Tips

### Adding New Features

#### New File Format Support
1. Create parser in `src/main/python/parsers/new_format_parser.py`
2. Add to factory in `capital_gains_calculator.py`
3. Update frontend validation in `frontend/src/config/fileUpload.ts`
4. Add test files to `data/sample_files/`

#### New Tax Rules
1. Update calculation logic in `services/tax_calculator.py`
2. Add unit tests in `tests/unit/test_tax_calculator.py`
3. Update documentation in `README.md`

#### Frontend Changes
1. Test locally with `npm run dev` in frontend directory
2. Build production bundle with `npm run build`
3. Deploy with `./deployment/deploy-useast1.sh`
4. Verify with E2E tests

### Code Quality Standards
- **Python**: Follow PEP 8, use type hints
- **TypeScript/JavaScript**: Use TypeScript, async/await for API calls
- **Tests**: Minimum 80% coverage for new code
- **Documentation**: Update README for user-facing changes

### Useful Commands
```bash
# Check API health
curl https://cgttaxtool.uk/prod/health

# Test calculation with file
curl -X POST https://cgttaxtool.uk/prod/calculate \
     -F "file=@data/sample.qfx" \
     -F "tax_year=2024-2025"

# View Lambda logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod --follow

# Update CloudFront distribution
aws cloudfront create-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*"
```

## 🧪 Test Automation Infrastructure

### Test Organization (January 2025)
Moved from scattered test files in project root to organized structure:

```
tests/
├── unit/              # Fast unit tests (no external dependencies)
├── integration/       # API integration tests (may skip in CI)
├── e2e/              # End-to-end Playwright tests  
├── system/           # Full system tests
├── debug/            # Debug scripts and analysis tools
└── responses/        # Test fixtures and sample responses
```

### CI/CD Pipeline (.github/workflows/test.yml)
```yaml
- Unit Tests: pytest tests/unit/ (fast, always run)
- Integration Tests: pytest tests/integration/ (can skip with SKIP_LIVE_API_TESTS=1)
- E2E Tests: Playwright in headless mode (CI=1)
- System Tests: Full workflow verification
- Matrix Testing: Python 3.9, 3.10, 3.11
```

### Test Commands (Makefile)
```bash
make test              # Unit tests only
make test-all          # All tests including live API calls
make test-all-skip-live # All tests except live API (for CI)
make verify-fix        # Test duplicate file upload fix specifically
make debug-e2e         # Debug E2E with visible browser
```

### Playwright E2E Test
Comprehensive workflow test covering:
- File upload (QFX format)
- Tax calculation processing  
- Portfolio table verification (6 individual holdings)
- Disposal table verification (3 disposals with symbols)
- Dividend table verification (7 dividends)
- Error handling and edge cases

---

*This context guide is maintained as the single source of truth for development workflows and project understanding.*

*Last Updated: 2025-01-28*
*Next Review: Monthly after major fixes*
