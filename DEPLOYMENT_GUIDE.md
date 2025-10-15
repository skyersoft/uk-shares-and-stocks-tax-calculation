# 🚀 IBKR Tax Calculator - AWS Deployment Guide

This comprehensive guide covers deploying the IBKR Tax Calculator to AWS with full monetization setup.

## 📋 Prerequisites

### AWS Account Setup
- Create AWS account at https://aws.amazon.com/ (Free Tier eligible)
- Set up billing alerts for cost monitoring
- Install AWS CLI and configure credentials

### Advertisement Setup (Required for Monetization)
1. **Google AdSense**: Apply at https://www.google.com/adsense/
   - Get Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXXX`)
   - Create ad units and note slot IDs

2. **Amazon Associates**: Join at https://affiliate-program.amazon.com/
   - Get affiliate ID for UK marketplace
   - Prepare product links for tax/investment books

3. **Font Awesome**: Get free kit at https://fontawesome.com/
   - Copy kit URL for icons

## ☁️ AWS Infrastructure Overview

### Current Live Deployment
- **Website**: https://cgttaxtool.uk (active)
- **API Gateway**: https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod
- **Lambda Function**: ibkr-tax-calculator-prod-us-east-1
- **CloudFront**: E3CPZK9XL7GR6Q
- **S3 Bucket**: ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo

### Architecture Components
- **Lambda + API Gateway**: Serverless backend processing
- **CloudFront + S3**: CDN and static file hosting
- **Route 53**: DNS management for custom domain
- **ACM**: SSL certificate management

## 🔧 Pre-Deployment Configuration

### 1. Update Advertisement Placeholders
Replace placeholders in `deployment/lambda_handler.py` and template files:

```python
# AdSense Configuration
ADSENSE_PUBLISHER_ID = "ca-pub-2934063890442014"  # Your publisher ID
BANNER_AD_SLOT = "YOUR_BANNER_SLOT_ID"
SIDEBAR_AD_SLOT = "YOUR_SIDEBAR_SLOT_ID"

# Amazon Associates
AFFILIATE_ID = "YOUR_AFFILIATE_ID"

# Font Awesome
FONTAWESOME_KIT = "https://kit.fontawesome.com/YOUR_KIT_ID.js"
```

### 2. Update ads.txt
The application serves ads.txt at `/ads.txt`:
```
google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0
```

## 🚀 Deployment Methods

### Quick Deployment (Recommended)
```bash
# Ensure advertisement IDs are configured
cd /path/to/ibkr-tax-calculator

# Run automated deployment
./deployment/deploy.sh
```

### Manual Deployment Steps

#### 1. Package Lambda Function
```bash
# Create deployment package
mkdir lambda_package
cd lambda_package

# Copy source files
cp -r ../src/ .
cp ../deployment/lambda_handler.py .
cp -r ../deployment/templates/ .

# Install dependencies
pip install -r ../deployment/requirements.txt -t .

# Create ZIP
zip -r ../lambda-deployment.zip . -x "*.pyc" "__pycache__/*"
```

#### 2. Deploy Infrastructure
```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file deployment/cloudformation-template.yaml \
    --stack-name ibkr-tax-calculator \
    --parameter-overrides ProjectName=ibkr-tax-calculator Stage=prod \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1 \
    --profile goker

# Update Lambda code
aws lambda update-function-code \
    --function-name ibkr-tax-calculator-prod-us-east-1 \
    --zip-file fileb://lambda-deployment.zip \
    --region us-east-1 \
    --profile goker
```

#### 3. Deploy Static Files
```bash
# Sync static files to S3
aws s3 sync static/ s3://ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo/ \
    --profile goker \
    --delete \
    --cache-control "max-age=3600"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id E3CPZK9XL7GR6Q \
    --paths "/*" \
    --profile goker
```

## 🌐 Custom Domain Setup

### Automated Setup
```bash
./deployment/deploy-custom-domain.sh
```

### Manual Setup
1. Request ACM certificate for your domain
2. Create API Gateway custom domain
3. Configure Route 53 DNS records
4. Update CloudFront distribution

## � Monetization Optimization

### AdSense Best Practices
- **Placement**: Above fold, near content, strategic locations
- **Responsive**: Use responsive ad units for mobile
- **Balance**: Avoid overwhelming users with ads
- **Content**: High-quality content improves RPM

### Amazon Associates Strategy
- **Relevant Products**: Tax planning, investment books, software
- **FTC Compliance**: Clear affiliate disclosures
- **Performance Tracking**: Monitor conversion rates
- **Content Integration**: Natural product recommendations

## 📊 Monitoring & Analytics

### AWS Monitoring
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 --follow --profile goker

# Monitor API Gateway metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApiGateway \
    --metric-name Count \
    --start-time 2025-01-01T00:00:00Z \
    --end-time 2025-12-31T23:59:59Z \
    --period 86400 \
    --statistics Sum
```

### Revenue Tracking
- **AdSense Dashboard**: Daily/monthly revenue reports
- **Amazon Associates**: Commission tracking and reports
- **Analytics**: Google Analytics for user behavior

## 🔒 Security & Compliance

### Data Protection
- No permanent data storage (GDPR compliant)
- HTTPS encryption for all communications
- Secure Lambda execution environment
- Privacy policy and terms of service included

### Cost Optimization
- **Free Tier**: 1M Lambda requests, 1M API calls free
- **Estimated Cost**: $10-20/month after free tier
- **Revenue Potential**: $50-200/month from ads

## 🆘 Troubleshooting

### Common Issues

#### Lambda Function Errors
```bash
# Check recent logs
aws logs filter-log-events \
    --log-group-name /aws/lambda/ibkr-tax-calculator-prod-us-east-1 \
    --start-time $(date -d '1 hour ago' +%s) \
    --profile goker
```

#### CloudFront Issues
```bash
# Check distribution status
aws cloudfront get-distribution --id E3CPZK9XL7GR6Q --profile goker
```

#### Ad Display Problems
- Verify AdSense publisher ID is correct
- Check that ads are enabled in AdSense dashboard
- Ensure CSP headers allow Google domains

### Performance Issues
- Increase Lambda memory if timeout occurs
- Check API Gateway throttling limits
- Monitor CloudWatch metrics for bottlenecks

## � Scaling & Optimization

### Performance Tuning
- **Lambda Memory**: Increase from 1024MB if needed
- **Timeout**: Extend to 60 seconds for large files
- **Caching**: Implement CloudFront caching strategies

### Feature Enhancements
- **File Size Limits**: Consider pre-signed S3 URLs for large files
- **Rate Limiting**: Implement API Gateway usage plans
- **Monitoring**: Add custom CloudWatch dashboards

## 🎯 Success Metrics

### Technical KPIs
- **Uptime**: 99.9%+ availability
- **Response Time**: <2 seconds for calculations
- **Error Rate**: <1% of requests

### Business KPIs
- **Monthly Revenue**: $50-200 from advertisements
- **User Growth**: 10,000+ monthly visitors
- **Conversion Rate**: 5%+ ad click-through rate

## 📞 Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **AdSense Help**: https://support.google.com/adsense/
- **Amazon Associates**: https://affiliate-program.amazon.com/help/
- **UK Tax Rules**: https://www.gov.uk/government/organisations/hm-revenue-customs

---

*This guide consolidates deployment information from DEPLOYMENT_GUIDE.md, DEPLOYMENT_SUMMARY.md, and AWS_DEPLOYMENT_REFERENCE.md into a single comprehensive reference.*

*Last Updated: 2025-10-14*
