# IBKR Tax Calculator - Development Tasks

## 📊 Current Status
- **Project**: UK Capital Gains Tax Calculator for Stocks and Shares
- **Deployment**: Live on AWS (API Gateway + Lambda + CloudFront)
- **Domain**: https://cgttaxtool.uk/
- **API**: https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/
- **Last Updated**: 2025-01-28

## ✅ Recently Completed (January 2025)

### Critical Bug Fixes
- [x] **FIXED: Duplicate file upload bug causing data aggregation** - Critical frontend form handling issue (legacy static HTML) ✅
  - **Issue**: Users saw 1 aggregated holding instead of 6 individual securities (ASM, ASML, RR., BSX, NVDA, TSLA)
  - **Root Cause**: JavaScript form handling created duplicate file form fields, causing backend to aggregate data
  - **Location**: Legacy `static/js/app.js` (now deleted, migrated to React SPA)
  - **Fix**: Removed duplicate file append, synchronized HTML form input with selected file
  - **Impact**: Portfolio table now correctly shows 6 individual holdings, disposal table shows 3 disposals with proper symbols
  - **Status**: Issue resolved in legacy code; SPA implementation uses proper React patterns
  - **Completed**: 2025-01-28

### Test Infrastructure & Quality
- [x] **Organized test automation infrastructure** - Moved from scattered test files to structured testing ✅
  - **Actions**: Moved 20+ test files from project root to proper `tests/` subdirectories
  - **Structure**: `tests/{unit,integration,e2e,system,debug,responses}/`
  - **CI/CD**: Created GitHub Actions workflow with matrix testing (Python 3.9-3.11)
  - **Tools**: Added Makefile with test commands (`make test`, `make verify-fix`, etc.)
  - **Coverage**: Playwright E2E test verifies complete workflow including the duplicate file fix
  - **Completed**: 2025-01-28

- [x] **JavaScript unit tests for duplicate file upload bug prevention** - Legacy code testing (now archived) ✅
  - **Component**: `static/js/__tests__/` - Jest-based JavaScript testing (deleted with legacy static code)
  - **Coverage**: FormData handling, file synchronization, validation logic
  - **Status**: Tests served their purpose for legacy code; SPA uses React Testing Library
  - **Completed**: 2025-01-28

### Active Development (PRIORITY)
- [x] **Complete React SPA migration** - Fully transitioned from static HTML to React SPA ✅
  - **Component**: `frontend/` directory - React + TypeScript + Vite
  - **Status**: SPA is now the primary frontend at https://cgttaxtool.uk/
  - **Cleanup**: Removed legacy `static/js/` and `static/css/` directories
  - **Build**: Production builds to `frontend/dist/` and deploys to S3
  - **Completed**: 2025-11-13

## 🚀 Technical Debt & Improvements

### Code Quality
- [ ] **Implement comprehensive logging system** - Add structured logging throughout the application
  - **Component**: Backend Lambda handler and calculation services
  - **Priority**: Medium
  - **Estimated Effort**: Medium

- [ ] **Add type hints to Python modules** - Improve code maintainability and IDE support
  - **Component**: `src/main/python/` modules
  - **Priority**: Low
  - **Estimated Effort**: Large

### Testing & Quality Assurance
- [x] **Enhanced end-to-end testing infrastructure** - Comprehensive test automation ✅
  - **Component**: `tests/e2e/test_playwright.py` - Full workflow verification
  - **Improvements**: Test now verifies individual holdings display (catches aggregation bugs)
  - **CI/CD**: GitHub Actions workflow with matrix testing and conditional E2E execution
  - **Coverage**: Tests file upload, API calls, portfolio table, disposal table, dividend table
  - **Completed**: 2025-01-28

### Performance & Monitoring
- [ ] **Add application monitoring** - CloudWatch dashboards and alerts
  - **Component**: AWS Lambda, API Gateway metrics
  - **Priority**: High (next priority after React SPA)
  - **Estimated Effort**: Medium
  - **Requirements**: Usage tracking, error rate monitoring, performance metrics
  - **Deliverables**: CloudWatch dashboard, SNS alerts for failures, cost monitoring

### User Experience & Error Handling
- [ ] **Enhanced error handling and UX improvements** - Better user feedback and error recovery
  - **Component**: Frontend JavaScript and backend error responses
  - **Priority**: High (follows monitoring setup)
  - **Estimated Effort**: Medium
  - **Requirements**: Loading states, progress indicators, timeout handling, user-friendly error messages
  - **Deliverables**: Improved error messages, file upload progress, better validation feedback

## 📚 Reference Information

### Architecture Overview
- **Backend**: Python 3.10+ with AWS Lambda serverless architecture
- **Frontend**: Static HTML/JS served via CloudFront, React SPA in development
- **Database**: Stateless - processes files on-demand, no persistent storage
- **File Processing**: Supports QFX (Quicken) and CSV formats from brokers like IBKR
- **Tax Calculations**: Implements UK HMRC rules for capital gains tax

### Deployment Architecture
- **AWS Lambda**: Processes tax calculations (`deployment/lambda_handler.py`)
- **API Gateway**: RESTful API with CORS support (`/prod/calculate`, `/prod/health`)
- **CloudFront**: CDN for static assets with custom domain
- **S3**: Static website hosting for HTML/CSS/JS files
- **Route 53**: DNS management for cgttaxtool.uk domain

### Key Components
- **Main Calculator**: `src/main/python/capital_gains_calculator.py`
- **File Parsers**: `src/main/python/parsers/` (QFX and CSV)
- **Frontend SPA**: `frontend/src/` (React + TypeScript components)
- **API Service**: `frontend/src/services/api.ts` (handles file upload and API calls)
- **Results Display**: `frontend/src/pages/ResultsPage.tsx` (processes and displays calculation results)
- **Tests**: `tests/` (unit, integration, and e2e Playwright tests)

## ✅ Completed Work

### Infrastructure & Deployment (2025-09-17/18)
- [x] **AWS deployment with custom domain** - Full serverless deployment ✅
- [x] **CloudFront CDN setup** - Static asset optimization ✅  
- [x] **API Gateway integration** - RESTful API with proper CORS ✅
- [x] **Multi-region backup deployment** - EU-West-1 region ✅

### UI & Frontend (2025-09-16/17)
- [x] **File upload functionality** - Drag & drop CSV/QFX support ✅
- [x] **Results page implementation** - Tax calculation display ✅
- [x] **Responsive design** - Mobile-friendly Bootstrap UI ✅
- [x] **Advertisement integration** - AdSense monetization setup ✅

### Backend & Processing (2025-09-16)
- [x] **QFX and CSV parsers** - Support for broker export formats ✅
- [x] **UK tax calculation engine** - HMRC compliant calculations ✅
- [x] **Portfolio analysis** - Holdings, gains/losses, dividends ✅
- [x] **Error handling and validation** - Robust file processing ✅

## 🔄 Development Guidelines

### Git Workflow
- Main branch: `main` (auto-deployed to production)
- Feature branches: `feature/description` 
- Hot fixes: `hotfix/issue-description`

### Testing Strategy  
- **Unit Tests**: Python backend components
- **Integration Tests**: API endpoint functionality
- **E2E Tests**: Playwright for full user workflows
- **Manual Testing**: File upload with real QFX/CSV files

### Code Standards
- **Python**: Follow PEP 8, type hints preferred
- **TypeScript**: Strict mode, async/await for API calls
- **React**: Functional components with hooks
- **Documentation**: Update README.md for user-facing changes
- **Security**: No sensitive data in code, use environment variables

---

*Last Updated: 2025-09-18*
*Next Review: Weekly*