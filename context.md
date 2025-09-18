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

### Frontend (Static HTML/JS + React SPA in development)
```
static/
├── index.html                 # Landing page
├── calculate.html             # File upload interface  
├── results.html               # Tax calculation results display
├── js/
│   ├── app.js                # Main application logic and API calls
│   ├── results.js            # Results page data processing and display
│   └── file-upload.js        # Drag & drop file upload handling
└── css/                      # Bootstrap-based styling

frontend/                     # React SPA (in development)
├── src/                      # React components and context
└── vite.config.js           # Vite build configuration
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

# Frontend API integration
static/js/app.js       # File upload and API calls
static/js/results.js   # Results display and data processing

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
3. **Static Assets**: Syncs HTML/CSS/JS files to S3
4. **CloudFront Invalidation**: Clears CDN cache for immediate updates

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

## 🔧 Current Issues & Debugging

### Critical Bug: Results Display
**Issue**: Tax calculation API returns correct data but frontend shows aggregated results instead of individual holdings.

**Debugging Steps**:
1. API test: `curl https://cgttaxtool.uk/prod/health` ✅ Working
2. Calculation test: Upload sample QFX file ✅ API returns 4 holdings
3. Frontend display: Shows 1 aggregated row ❌ Bug in results.js

**Investigation Points**:
- `static/js/results.js` - `normalizeData()` function
- Symbol extraction from API response structure
- Holdings aggregation logic

### Common Development Issues

#### Import Errors in Lambda
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
- [ ] Fix results display bug in `results.js`
- [ ] Add comprehensive error handling
- [ ] Implement loading states and user feedback

### Short Term (1-3 months)  
- [ ] Complete React SPA migration
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
3. Update frontend validation in `static/js/app.js`
4. Add test files to `data/sample_files/`

#### New Tax Rules
1. Update calculation logic in `services/tax_calculator.py`
2. Add unit tests in `tests/unit/test_tax_calculator.py`
3. Update documentation in `README.md`

#### Frontend Changes
1. Test locally with `python run_webapp.py`
2. Update static files in `static/` directory
3. Deploy with `./deployment/deploy.sh`
4. Verify with E2E tests

### Code Quality Standards
- **Python**: Follow PEP 8, use type hints
- **JavaScript**: ES6+, async/await for API calls
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

## 🐛 Critical Bug Fixes & Lessons Learned

### Duplicate File Upload Bug (January 2025)

**Issue**: Tax calculation results showing single aggregated holding instead of individual securities
- **Symptoms**: 6 individual stocks (ASM, ASML, RR., BSX, NVDA, TSLA) appeared as 1 aggregated row
- **Impact**: Users couldn't see detailed breakdown of their holdings
- **Root Cause**: Duplicate file form fields in JavaScript causing backend to aggregate data

**Investigation Process**:
1. ✅ Backend API verification: `curl` tests confirmed API returns 6 holdings correctly
2. ✅ Network layer: Browser DevTools showed API response contains 6 holdings  
3. ✅ Data processing: Frontend correctly processes 6 holdings from API response
4. 🔍 **Root Cause Found**: JavaScript form handling bug with duplicate `FormData.append()`

**Technical Details**:
```javascript
// BUG: Duplicate file form fields in static/js/app.js
const formData = new FormData(form);        // Adds file from form input
formData.append('file', uploadedFile);      // DUPLICATE: Adds same file again
formData.append('tax_year', taxYear);

// Backend receives duplicate files, returns aggregated data instead of individual holdings
```

**Fix Applied**:
```javascript
// FIXED: Single file source with proper form synchronization
function handleFileSelection(file) {
    uploadedFile = file;
    // Synchronize HTML form input with selected file
    const fileInput = document.getElementById('file-input');
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
}

// Form submission uses only form data (no duplicate append)
const formData = new FormData(form);
formData.append('tax_year', taxYear);
```

**Verification**:
- ✅ Portfolio table: Now displays 6 individual holdings with correct symbols
- ✅ Disposal table: Shows 3 disposals (RR., NXE, AMZN) with proper symbols  
- ✅ Dividend table: Displays 7 dividends with correct company symbols
- ✅ End-to-end test: Playwright automation confirms full workflow

**Key Lessons**:
1. **Frontend form bugs can cause backend data aggregation** - Always check form data structure
2. **Systematic debugging approach**: Backend → Network → Frontend → Form handling
3. **Browser DevTools are crucial**: Network tab shows actual API responses vs UI display
4. **Test automation prevents regression**: Comprehensive E2E tests catch similar issues

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