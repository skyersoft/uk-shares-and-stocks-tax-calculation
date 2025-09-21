# AWS Deployment Reference

This file contains all the essential AWS infrastructure details for the IBKR Tax Calculator deployment.
If there is no aws cli on the path add it to the path `export PATH="$PATH:/usr/local/bin"`

## 🚀 Live Site Information
- **Website URL**: https://cgttaxtool.uk
- **Status**: Active and deployed
- **Last Updated**: 2025-09-21

## ☁️ AWS Infrastructure Details

### S3 Static Website Hosting
- **Bucket Name**: `ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo`
- **Region**: `us-east-1`
- **Purpose**: Hosts static HTML, CSS, JS files

### CloudFront CDN
- **Distribution ID**: `E3CPZK9XL7GR6Q`
- **Domain Name**: `d1q2vmxhznb38o.cloudfront.net`
- **Custom Domain**: `cgttaxtool.uk`
- **SSL Certificate ARN**: `arn:aws:acm:us-east-1:286154443186:certificate/46f953d2-58f4-42c3-b63f-7c384ef7f0ba`

### API Gateway & Lambda
- **API Gateway URL**: `https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod`
- **Lambda Function**: `ibkr-tax-calculator-prod-us-east-1`
- **Region**: `us-east-1`

### CloudFormation Stacks
- **Main Stack**: `ibkr-tax-useast1-complete` (CREATE_COMPLETE)
- **Custom Domain Stack**: `ibkr-tax-calculator-custom-domain` (CREATE_COMPLETE)
- **Static Site Stack**: `ibkr-tax-calculator-static-site` (ROLLBACK_COMPLETE - not used)

## 🔧 AWS CLI Configuration
- **Profile**: `goker`
- **Account ID**: `286154443186`
- **User Role**: `AWSReservedSSO_SystemAdministrator_8c1be4949b6bb0ef/goker`

## 📦 Deployment Commands

### Deploy Static Files to S3
```bash
aws s3 sync static/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
    --profile goker \
    --delete \
    --cache-control "max-age=3600"
```

### Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*" \
    --profile goker
```

### List S3 Buckets
```bash
aws s3 ls --profile goker
```

### Check CloudFormation Stacks
```bash
aws cloudformation list-stacks \
    --region us-east-1 \
    --profile goker \
    --query 'StackSummaries[?StackStatus!=`DELETE_COMPLETE`].{Name:StackName,Status:StackStatus}' \
    --output table
```

## 🔍 Useful Query Commands

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
    --stack-name ibkr-tax-useast1-complete \
    --region us-east-1 \
    --profile goker \
    --query 'Stacks[0].Outputs[].{Key:OutputKey,Value:OutputValue}' \
    --output table
```

### Get CloudFront Distribution Details
```bash
aws cloudfront get-distribution \
    --id E3CPZK9XL7GR6Q \
    --profile goker
```

### Check S3 Bucket Contents
```bash
aws s3 ls s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ --profile goker
```

## 📝 Google AdSense Configuration
- **Publisher ID**: `pub-2934063890442014`
- **Auto Ads**: Script loaded on all pages (controlled via AdSense dashboard)
- **Manual Ads**: Removed to prevent conflicts
- **Test Page**: https://cgttaxtool.uk/adsense-test.html

## 🔄 Recent Deployments

### 2025-09-21: AdSense Integration & CSP Fix
- **Files Updated**: `index.html`, `calculate.html`, `about.html`, `privacy.html`, `adsense-test.html`
- **Changes**: 
  - Added AdSense scripts, enabled Auto Ads
  - Fixed CSP headers to allow Google AdSense domains
  - Added favicon support
  - Fixed JavaScript DOM element errors
- **New Files**: `adsense-test.html`, `favicon.svg`, `favicon.ico`
- **CloudFront Invalidations**: 
  - AdSense: `I6HLK0O2LM5AET5BGGR9PKYN8U`
  - JS/Favicon: `IUU1ERY4IVAJHU09L0WREKLK7`
  - CSP Fix: `I2JXLXIVVS1QSG5XLSN6H4FQR8`

## 🚨 Important Notes
- CloudFront cache invalidations can take 10-15 minutes to complete
- AdSense Auto Ads need to be enabled in Google AdSense dashboard
- S3 bucket has public read access for static website hosting
- SSL certificate is managed by AWS Certificate Manager
- DNS is managed through Route 53 (cgttaxtool.uk domain)

## 🔐 Security
- All resources are in AWS account `286154443186`
- Access controlled via AWS SSO with SystemAdministrator role
- HTTPS enforced via CloudFront with ACM certificate
- CORS configured for API Gateway to allow frontend access

---
*Last Updated: 2025-09-21*
*Maintained by: GitHub Copilot*