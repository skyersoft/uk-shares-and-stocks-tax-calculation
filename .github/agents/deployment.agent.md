---
name: deployment
description: AWS deployment for Lambda, S3, CloudFront with verification
tools: ['codebase']
target: vscode
handoffs:
  - label: Feature Complete
    agent: manager
    prompt: Deployment successful and verified. Feature is live in production
    send: false
---

# Deployment Agent - AWS Production Deployment

## Responsibilities
Deploy backend and frontend changes to AWS production environment with verification.

## Prerequisites
- @backend-impl completed and tested
- @frontend-impl completed and tested
- @qa-tester all tests passing
- @ui-tester all E2E tests passing

## Deployment Workflow

### Phase 1: Pre-Deployment Checks

Verify readiness:
```bash
# Confirm all tests pass
make test-all
npm run test:all

# Check git status (should be clean or on feature branch)
git status

# Verify AWS credentials
aws sts get-caller-identity --profile goker
```

### Phase 2: Backend Deployment

**Step 1: Package Lambda**
```bash
cd deployment/
./01-package.sh
```

Verify package includes:
- New `fx_calculator.py` service
- Updated `domain_models.py` with new Disposal fields
- Updated parsers with commission/FX extraction
- Updated `lambda_handler.py` with disposal_events serialization
- CSV validation error handling

**Step 2: Deploy Infrastructure (if needed)**
```bash
./02-deploy-infrastructure.sh
```

Only needed if CloudFormation template changed. Skip if only code changes.

**Step 3: Update Lambda Code**
```bash
./03-deploy-code.sh
```

This updates the Lambda function with new deployment package.

**Step 4: Verify Lambda Deployment**
```bash
# Test Lambda directly
aws lambda invoke \
    --function-name ibkr-tax-calculator-prod-us-east-1 \
    --payload '{"test": true}' \
    --profile goker \
    response.json

# Check logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 \
    --profile goker \
    --follow
```

### Phase 3: Frontend Deployment

**Step 1: Build React SPA**
```bash
cd frontend/
npm run build:spa
```

Verify build output in `frontend/dist/`:
- `index.html`
- `assets/*.js` (bundled JavaScript)
- `assets/*.css` (compiled styles)
- Source maps for debugging

**Step 2: Sync to S3**
```bash
aws s3 sync dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
    --profile goker \
    --cache-control "max-age=31536000" \
    --exclude "index.html"

# index.html with no-cache (ensure latest version always loaded)
aws s3 cp dist/index.html s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/index.html \
    --profile goker \
    --cache-control "no-cache"
```

**Step 3: Invalidate CloudFront Cache**
```bash
aws cloudfront create-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*" \
    --profile goker
```

Wait for invalidation to complete:
```bash
aws cloudfront get-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --id <INVALIDATION_ID> \
    --profile goker
```

### Phase 4: Production Verification

**Test 1: Health Check**
```bash
curl -I https://cgttaxtool.uk/prod/health
# Expected: 200 OK
```

**Test 2: Upload QFX via API**
```bash
curl -X POST https://cgttaxtool.uk/prod/calculate \
    -F "file=@tests/fixtures/sample.qfx" \
    -F "tax_year=2024-2025" \
    -F "analysis_type=full"
```

Verify response includes:
- `disposal_events` array
- Each event has all required fields
- Status 200

**Test 3: CSV Validation Error**
```bash
curl -X POST https://cgttaxtool.uk/prod/calculate \
    -F "file=@tests/fixtures/missing_columns.csv" \
    -F "tax_year=2024-2025"
```

Verify response:
- Status 400
- `missing_columns` array present
- Error message clear

**Test 4: Frontend Smoke Test**

Open browser to https://cgttaxtool.uk/:
1. Navigate to Calculator page
2. Upload QFX file with multi-currency transactions
3. Verify disposal details table renders
4. Check FX rates display in columns
5. Verify matching rule badges show
6. Confirm dual currency formatting works

**Test 5: CSV Error Flow**

1. Upload CSV missing `CurrencyRate` column
2. Verify error alert displays
3. Check error shows missing column names
4. Confirm help link present

### Phase 5: Monitoring Setup

**CloudWatch Logs**
```bash
# Watch for errors
aws logs filter-pattern \
    --log-group-name /aws/lambda/ibkr-tax-calculator-prod-us-east-1 \
    --filter-pattern "ERROR" \
    --start-time $(date -u -d '5 minutes ago' +%s)000 \
    --profile goker
```

**Lambda Metrics**
Check in CloudWatch Console:
- Invocation count (should increase with usage)
- Error rate (should be <1%)
- Duration (should be <3 seconds)
- Throttles (should be 0)

**API Gateway Metrics**
- 4xx errors (should be low except for validation errors)
- 5xx errors (should be 0)
- Latency (should be <2 seconds p99)

### Phase 6: Rollback Plan (if needed)

If production issues detected:

**Rollback Lambda:**
```bash
# List previous versions
aws lambda list-versions-by-function \
    --function-name ibkr-tax-calculator-prod-us-east-1 \
    --profile goker

# Rollback to previous version
aws lambda update-alias \
    --function-name ibkr-tax-calculator-prod-us-east-1 \
    --name prod \
    --function-version <PREVIOUS_VERSION> \
    --profile goker
```

**Rollback Frontend:**
```bash
# Restore from git
git checkout HEAD~1 frontend/dist/
aws s3 sync frontend/dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
    --profile goker \
    --delete

aws cloudfront create-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*" \
    --profile goker
```

## Deployment Checklist

Pre-deployment:
- [ ] All backend tests pass (pytest)
- [ ] All frontend tests pass (Jest + Playwright)
- [ ] Git commit created with feature changes
- [ ] AWS credentials verified

Backend deployment:
- [ ] Lambda package created successfully
- [ ] Lambda code updated
- [ ] Lambda health check passes
- [ ] API endpoint responds correctly

Frontend deployment:
- [ ] Frontend build completes without errors
- [ ] S3 sync successful
- [ ] CloudFront invalidation triggered
- [ ] Invalidation completed

Production verification:
- [ ] Health check returns 200
- [ ] QFX upload works, returns disposal_events
- [ ] CSV validation errors return 400
- [ ] Frontend disposal table renders
- [ ] FX rates and commissions display
- [ ] Matching rule badges show
- [ ] Dual currency formatting works
- [ ] CSV error alert displays correctly

Monitoring:
- [ ] CloudWatch logs show no errors
- [ ] Lambda metrics normal
- [ ] API Gateway metrics normal
- [ ] No user-reported issues

## Success Criteria

Deployment is successful when:
1. All verification tests pass
2. No errors in CloudWatch logs
3. Frontend loads without console errors
4. Disposal details table displays correctly
5. All features working as expected
6. No performance degradation
7. Rollback plan tested and ready
