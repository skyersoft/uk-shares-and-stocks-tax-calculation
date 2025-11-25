# Deployment Guide

## Quick Start

### Package and Deploy

```bash
# 1. Activate conda environment
conda activate ibkr-tax

# 2. Package Lambda function
cd deployment
bash 01-package-api.sh

# 3. Rename package (required for Terraform)
mv api-lambda-deployment.zip ../lambda-deployment.zip

# 4. Deploy with Terraform
cd terraform
terraform apply
```

## Available Scripts

### ✅ Current (In Use)

- **`01-package-api.sh`** - Packages Lambda function with all dependencies
  - Creates `api-lambda-deployment.zip` (~29MB)
  - Includes: Lambda handler, Python dependencies, source code
  - Uses: `conda run -n ibkr-tax` for reliable dependency installation

### 🗑️ Obsolete (Do Not Use)

- **`01-package.sh`** - Old packaging script (DEPRECATED)
  - Reason: Slow dependency installation, inconsistent results
  - Use `01-package-api.sh` instead

- **`03-deploy-api-code.sh`** - Old deployment script (DEPRECATED)
  - Reason: Terraform now handles Lambda deployment
  - Use `terraform apply` instead

## Deployment Architecture

### Lambda Function
- **Handler**: `lambda_handler.lambda_handler`
- **Runtime**: Python 3.10
- **Memory**: 1024 MB
- **Timeout**: 300 seconds
- **Package Size**: ~29 MB

### API Endpoints
- `GET /health` - Health check
- `POST /calculate` - Tax calculation
- `POST /detect-broker` - Broker detection preview
- `POST /download-report` - Generate reports

### Key Fixes Applied

1. **Broker Detection Fix**:
   - Changed `ConverterFactory()` → `get_factory()` in `lambda_handler.py`
   - Ensures converters are properly registered

2. **Import Dependencies Fix**:
   - Removed `typer` import from `src/main/python/__init__.py`
   - Prevents heavy CLI dependencies from loading

3. **Handler Selection**:
   - Uses `deployment/lambda_handler.py` (has all endpoints)
   - Not `deployment/api_lambda_handler.py` (missing detect-broker)

## Troubleshooting

### Issue: "No module named 'typer'"
**Solution**: Ensure you're using `01-package-api.sh` which includes all dependencies

### Issue: "Endpoint not found"
**Solution**: Verify `deployment/lambda_handler.py` is used (not `api_lambda_handler.py`)

### Issue: "supported_brokers is empty"
**Solution**: Check that `get_factory()` is used instead of `ConverterFactory()` in handler

### Issue: Package too large
**Current size**: ~29MB is normal (includes pandas, numpy, etc.)
**Limit**: 50MB (direct upload) or 250MB (via S3)

## Testing

```bash
# Test health endpoint
curl https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod/health

# Test broker detection
curl -X POST https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod/detect-broker \
  -F "file=@path/to/file.csv"

# Test through CloudFront
curl -X POST https://cgttaxtool.uk/prod/detect-broker \
  -F "file=@path/to/file.csv"
```

## CloudFront Cache Invalidation

After deploying, invalidate CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/prod/*" \
  --profile goker
```

## Infrastructure Details

- **AWS Account**: 286154443186
- **AWS Profile**: `goker`
- **Region**: `us-east-1`
- **Website**: https://cgttaxtool.uk
- **API Gateway**: `d1tr8kb7oh`
- **CloudFront**: `E3CPZK9XL7GR6Q`
- **S3 Bucket**: `ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo`

## Frontend Deployment

```bash
# Build React SPA
cd frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
  --profile goker \
  --delete

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/*" \
  --profile goker
```

## See Also

- **Main Documentation**: `../docs/DEPLOYMENT.md`
- **Terraform Configuration**: `terraform/`
- **AWS Reference**: `../docs/AWS_DEPLOYMENT_REFERENCE.md`
