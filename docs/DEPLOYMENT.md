# 🚀 Deployment Guide

Complete guide for deploying the IBKR Tax Calculator to AWS using Terraform.

## 📋 Prerequisites

### AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI installed and configured
- AWS profile `goker` configured (or update scripts with your profile)
- Terraform installed (v1.0+)

### Local Development Tools
- Python 3.10+ with conda
- Node.js 18+ and npm
- Docker and docker-compose (for LocalStack testing)

## ☁️ Production Infrastructure

### Current Deployment
- **Website**: https://cgttaxtool.uk
- **API Gateway**: `d1tr8kb7oh.execute-api.us-east-1.amazonaws.com`
- **Lambda Function**: `ibkr-tax-calculator-prod-us-east-1`
- **CloudFront Distribution**: `E3CPZK9XL7GR6Q`
- **S3 Bucket**: `ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo`
- **Region**: `us-east-1`

### Architecture Components
- **Frontend**: React SPA hosted on S3, served via CloudFront
- **Backend**: Python Lambda function + API Gateway
- **DNS**: Route 53 with custom domain
- **SSL**: ACM certificate for HTTPS
- **IaC**: Terraform (migrated from CloudFormation)

## 🚀 Deployment Workflow

### 1. Package Lambda Function

```bash
# Activate Python environment
conda activate ibkr-tax

# Package Lambda code
cd deployment
./01-package.sh
```

This creates `lambda-deployment.zip` with all dependencies.

### 2. Deploy Infrastructure with Terraform

```bash
# Deploy using the automated script
./deployment/terraform-deploy.sh

# Or manually:
cd deployment/terraform
terraform plan
terraform apply
```

The Terraform deployment handles:
- Lambda function
- API Gateway
- S3 bucket for frontend
- CloudFront distribution
- IAM roles and policies
- Route 53 DNS (if configured)

### 3. Deploy Frontend

```bash
# Build React SPA
cd frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
  --profile goker \
  --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/*" \
  --profile goker
```

## 🔧 Configuration

### CloudFront Content Security Policy

The CloudFront distribution uses custom response headers for security:

```yaml
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
  img-src 'self' data: https: http:;
  connect-src 'self' https://*.execute-api.us-east-1.amazonaws.com;
  frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;
```

### Favicon Configuration

Favicons are located in `frontend/public/`:
- `favicon.ico` - Standard ICO format
- `favicon.svg` - SVG version with £ symbol

These are automatically copied to `frontend/dist/` during build.

### ads.txt Configuration

For Google AdSense, `ads.txt` is served from `frontend/public/ads.txt`:
```
google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0
```

## 🧪 Local Development with LocalStack

### Start LocalStack

```bash
# Start LocalStack services
docker-compose up -d

# Run local development setup
sh run-local-dev.sh
```

### Access Points
- **Website**: `http://ibkr-tax-calculator-local-bucket.s3-website.us-east-1.amazonaws.com`
- **API**: `http://localhost:4566/restapis/<API_ID>/prod/_user_request_`

## 📊 Monitoring & Logs

### CloudWatch Logs

```bash
# Tail Lambda logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 \
  --follow \
  --profile goker

# Filter recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/ibkr-tax-calculator-prod-us-east-1 \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --profile goker
```

### API Gateway Metrics

```bash
# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=ibkr-tax-calculator-api \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --profile goker
```

## 🔒 Security Best Practices

### Data Protection
- No permanent data storage (GDPR compliant)
- HTTPS encryption for all communications
- Secure Lambda execution environment
- Content Security Policy headers
- CORS configured for API Gateway

### IAM Permissions
- Lambda execution role with minimal permissions
- S3 bucket policies for CloudFront access only
- API Gateway resource policies

## 🆘 Troubleshooting

### Lambda Function Errors

**Issue**: Lambda timeout or errors
```bash
# Check recent logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 --profile goker

# Increase timeout in Terraform if needed
# Edit deployment/terraform/lambda.tf
```

### CloudFront Cache Issues

**Issue**: Old content still showing after deployment
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/*" \
  --profile goker
```

### API Gateway 403 Errors

**Issue**: CORS or authentication errors
- Check API Gateway CORS configuration in Terraform
- Verify Lambda function permissions
- Check CloudWatch logs for detailed error messages

### Frontend Build Issues

**Issue**: Build fails or assets missing
```bash
# Clean and rebuild
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

## 📈 Performance Optimization

### Lambda Configuration
- **Memory**: 1024 MB (adjust in `deployment/terraform/lambda.tf`)
- **Timeout**: 30 seconds
- **Runtime**: Python 3.10

### CloudFront Caching
- Static assets: 1 hour cache (`max-age=3600`)
- API responses: No caching
- Compression: Enabled (gzip, brotli)

### Frontend Optimization
- Code splitting with Vite
- Asset minification
- Tree shaking for unused code
- Lazy loading for routes

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] Test locally with LocalStack
- [ ] Run all tests (`pytest` and `npm test`)
- [ ] Update version numbers if applicable
- [ ] Package Lambda function
- [ ] Apply Terraform changes
- [ ] Build and deploy frontend
- [ ] Invalidate CloudFront cache
- [ ] Verify website loads correctly
- [ ] Test API endpoints
- [ ] Check CloudWatch logs for errors
- [ ] Monitor for 15-30 minutes post-deployment

## 📞 Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/
- **UK Tax Rules**: https://www.gov.uk/capital-gains-tax

---

*Last Updated: 2025-11-20*
