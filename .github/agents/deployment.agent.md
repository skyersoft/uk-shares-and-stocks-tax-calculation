---
name: deployment
description: AWS deployment for Lambda, S3, CloudFront with verification. Manages both CloudFormation and future Terraform migrations.
tools: ['edit', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'todos', 'runSubagent', 'runTests']
target: vscode
handoffs:
  - label: Feature Complete
    agent: manager
    prompt: Deployment successful and verified. Feature is live in production
    send: false
---

# Deployment Agent - AWS Production Deployment

## Responsibilities
Deploy backend and frontend changes to AWS production environment with verification. Support both CloudFormation (current) and Terraform (future) deployment strategies.

## Prerequisites
- @backend-impl completed and tested
- @frontend-impl completed and tested
- @qa-tester all tests passing
- @ui-tester all E2E tests passing

## Deployment Workflow

### Phase 1: Pre-Deployment Checks

**CRITICAL: Activate Conda Environment First**
```bash
# ALWAYS activate ibkr-tax conda environment before any deployment operations
conda activate ibkr-tax

# Verify correct Python environment
python --version  # Should be Python 3.13.x
which python      # Should be /usr/local/anaconda3/envs/ibkr-tax/bin/python
```

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

**IMPORTANT: Run from project root, NOT from deployment/ directory**

```bash
# Ensure you're in project root directory
cd /Users/myuser/development/ibkr-tax-calculator

# Run packaging script (script copies src/ directory)
./deployment/01-package.sh
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

**Note: This project uses direct AWS Lambda update, not stack-based deployment**

```bash
# Option 1: Use AWS CLI directly (recommended for this project)
aws lambda update-function-code \
    --function-name ibkr-tax-calculator-prod-us-east-1 \
    --zip-file fileb://lambda-deployment.zip \
    --region us-east-1 \
    --profile goker

# Option 2: Use deployment script (if stack-outputs.env exists)
./deployment/03-deploy-code.sh
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

---

## Infrastructure Management

### Current State: CloudFormation + Manual Lambda Updates

**Known Issue**: Lambda code updates bypass CloudFormation stack, causing state drift.

Current architecture:
- **Infrastructure**: CloudFormation stack (`ibkr-tax-useast1-complete`)
- **Lambda Code**: Direct AWS CLI updates (not in stack)
- **Frontend**: Manual S3 sync + CloudFront invalidation
- **State Drift**: Lambda code version not tracked in CloudFormation

### Future Migration: Terraform (Recommended)

#### Why Terraform?

**Benefits**:
1. **Unified State Management**: Fixes Lambda code drift issue
2. **Single Command Deployment**: Replace 4-step process with `terraform apply`
3. **Better Rollbacks**: Atomic state management with automatic dependency resolution
4. **Multi-Environment**: Easy staging/dev environment creation
5. **Drift Detection**: Built-in detection of manual AWS console changes
6. **Future-Proof**: Support for non-AWS services (Auth0, Stripe, etc.)

**Costs**:
- Migration effort: ~5 days
- Ongoing: $1/month (S3 + DynamoDB state backend)
- Learning curve: Team needs to learn HCL

#### Terraform Migration Plan

**Phase 1: Setup Backend (1 day)**
```bash
# Create S3 state bucket
aws s3 mb s3://ibkr-tax-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket ibkr-tax-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --profile goker
```

**Phase 2: Import Existing Resources (2 days)**
```bash
# Initialize Terraform
cd deployment/terraform
terraform init

# Import existing resources (no recreation/downtime)
terraform import aws_s3_bucket.website ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo
terraform import aws_lambda_function.calculator ibkr-tax-calculator-prod-us-east-1
terraform import aws_cloudfront_distribution.cdn E3CPZK9XL7GR6Q
terraform import aws_api_gateway_rest_api.api <API_ID>

# Verify no changes needed
terraform plan  # Should show "No changes"
```

**Phase 3: First Terraform Deployment (1 day)**
```bash
# Test with code change
./deployment/01-package.sh  # Create lambda-deployment.zip
terraform apply -var="lambda_code_hash=$(sha256sum lambda-deployment.zip | cut -d' ' -f1)"

# Verify deployment
curl -I https://cgttaxtool.uk/prod/health
```

**Phase 4: Cleanup (1 day)**
```bash
# After successful Terraform deployment
aws cloudformation delete-stack \
  --stack-name ibkr-tax-useast1-complete \
  --region us-east-1 \
  --profile goker

# Update documentation
# Remove old CloudFormation scripts
```

#### Terraform Deployment Workflow (Post-Migration)

**Simplified Process**:
```bash
# 1. Package Lambda (still needed)
./deployment/01-package.sh

# 2. Deploy everything (infrastructure + code + frontend)
cd deployment/terraform
terraform apply -auto-approve

# That's it! Frontend sync included in Terraform.
```

**Rollback**:
```bash
# Simple revert to previous state
terraform apply -var="lambda_code_hash=<PREVIOUS_HASH>"
```

#### Terraform Project Structure

```
deployment/terraform/
├── main.tf                    # Main configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values (API URL, CloudFront ID, etc.)
├── backend.tf                 # S3 backend config
├── lambda.tf                  # Lambda function resource
├── api_gateway.tf             # API Gateway resources
├── cloudfront.tf              # CloudFront + S3 bucket
├── iam.tf                     # IAM roles and policies
├── terraform.tfvars           # Production values
├── environments/
│   ├── prod.tfvars           # Production environment
│   ├── staging.tfvars        # Staging environment
└── modules/
    └── serverless-app/        # Reusable module (future)
```

#### Example Terraform Resources

**Lambda with Automatic Code Updates**:
```hcl
# deployment/terraform/lambda.tf
resource "aws_lambda_function" "calculator" {
  filename         = "../lambda-deployment.zip"
  function_name    = "ibkr-tax-calculator-prod-${var.region}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_handler.lambda_handler"
  
  # Triggers redeployment when code changes
  source_code_hash = filebase64sha256("../lambda-deployment.zip")
  
  runtime      = "python3.10"
  timeout      = 300
  memory_size  = 1024

  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }
}
```

**S3 + CloudFront**:
```hcl
# deployment/terraform/cloudfront.tf
resource "aws_s3_bucket" "website" {
  bucket = "ibkr-tax-${var.region}-website"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"
  
  aliases = [var.domain_name, "www.${var.domain_name}"]
  
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website.id}"
  }
  
  origin {
    domain_name = "${aws_api_gateway_rest_api.api.id}.execute-api.${var.region}.amazonaws.com"
    origin_id   = "APIGateway"
    
    custom_origin_config {
      http_port              = 443
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    viewer_protocol_policy = "redirect-to-https"
    
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  ordered_cache_behavior {
    path_pattern           = "/prod/*"
    target_origin_id       = "APIGateway"
    viewer_protocol_policy = "redirect-to-https"
    
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
```

#### Terraform Commands Reference

```bash
# Initialize (first time only)
terraform init

# Preview changes
terraform plan

# Apply changes (with approval prompt)
terraform apply

# Apply without prompt (CI/CD)
terraform apply -auto-approve

# Target specific resource
terraform apply -target=aws_lambda_function.calculator

# Show current state
terraform show

# Detect drift
terraform plan -refresh-only

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Destroy all resources (DANGEROUS)
terraform destroy
```

### Decision Point: When to Migrate?

**Migrate to Terraform if**:
- ✅ Need staging/dev environments
- ✅ Frequent deployments (>2 per week)
- ✅ Team comfortable with learning new IaC tool
- ✅ Planning multi-cloud or non-AWS integrations
- ✅ Lambda code drift is causing issues

**Stay with CloudFormation if**:
- ✅ Rare deployments (<1 per month)
- ✅ Small team, AWS-only focus
- ✅ No budget for migration effort
- ✅ Fix Lambda deployment to use CloudFormation's built-in code management

**Immediate Fix (Without Terraform)**:
Update CloudFormation stack to manage Lambda code:
```yaml
# deployment/single-region-complete.yaml
LambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    # ... existing properties
    Code:
      S3Bucket: !Ref CodeBucket
      S3Key: !Sub "lambda-code-${CodeVersion}.zip"
```

This eliminates state drift without full Terraform migration.

---
