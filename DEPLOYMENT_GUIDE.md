# 🚀 IBKR Tax Calculator - AWS Deployment Guide

This guide will help you deploy the IBKR Tax Calculator to AWS using Lambda + API Gateway with advertisement monetization.

## 📋 Prerequisites

### 1. AWS Account Setup
- Create an AWS account at https://aws.amazon.com/
- Ensure you're eligible for AWS Free Tier (12 months free)
- Set up billing alerts to monitor costs

### 2. Install Required Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 3. Configure AWS Credentials
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## 💰 Advertisement Setup (BEFORE Deployment)

### 1. Google AdSense Setup
1. **Apply for AdSense**: Visit https://www.google.com/adsense/
2. **Create Ad Units**:
   - Banner Ad (728x90 or responsive)
   - Sidebar Ad (300x250 or responsive)
   - Results Banner Ad (responsive)
   - Bottom Banner Ad (responsive)
3. **Get Your Publisher ID**: Format `ca-pub-XXXXXXXXXXXXXXXXX`
4. **Get Ad Slot IDs**: Each ad unit has a unique slot ID

### 1.1. ads.txt Configuration
The application automatically serves an ads.txt file at `/ads.txt` with your Google AdSense publisher ID:
```
google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0
```
This is configured in `deployment/lambda_handler.py` and will be available at:
- https://cgttaxtool.uk/ads.txt
- https://www.cgttaxtool.uk/ads.txt

### 2. Amazon Associates Setup
1. **Join Amazon Associates**: Visit https://affiliate-program.amazon.com/
2. **Get Your Affiliate ID**: Format `your-affiliate-id-20`
3. **Create Product Links** for:
   - UK Tax Planning books
   - Portfolio management software
   - Investment guides
   - Tax preparation tools

### 3. Font Awesome Setup
1. **Get Font Awesome Kit**: Visit https://fontawesome.com/
2. **Create free account** and get your kit code
3. **Copy the kit URL**: Format `https://kit.fontawesome.com/YOUR_KIT_ID.js`

## 🔧 Pre-Deployment Configuration

### 1. Update Advertisement IDs
Replace placeholders in the relevant template files with your actual advertisement IDs.

**In `deployment/templates/landing_page.py`:**
- Replace `YOUR_ADSENSE_ID` with your AdSense publisher ID.
- Replace `YOUR_BANNER_SLOT_ID` with your banner ad slot ID.
- Replace `YOUR_SIDEBAR_SLOT_ID` with your sidebar ad slot ID.
- Replace `YOUR_FONTAWESOME_KIT` with your Font Awesome kit ID.

**In `deployment/templates/results_page.py`:**
- Replace `YOUR_ADSENSE_ID` with your AdSense publisher ID.
- Replace `YOUR_RESULTS_BANNER_SLOT_ID` with your results banner ad slot ID.
- Replace `YOUR_SIDEBAR_SLOT_ID` with your sidebar ad slot ID.
- Replace `YOUR_FONTAWESOME_KIT` with your Font Awesome kit ID.

**In `deployment/templates/about_page.py`:**
- Replace `YOUR_ADSENSE_ID` with your AdSense publisher ID.
- Replace `YOUR_SIDEBAR_SLOT_ID` with your sidebar ad slot ID.

### 2. Update Amazon Affiliate Links
Replace placeholder affiliate links:
```python
# Replace these in all template files:
YOUR_AFFILIATE_LINK → your-actual-amazon-affiliate-links
YOUR_TAX_GUIDE_LINK → specific-product-affiliate-link
YOUR_PORTFOLIO_BOOK_LINK → specific-product-affiliate-link
YOUR_SOFTWARE_LINK → specific-product-affiliate-link
```

## 🚀 Deployment Steps

### 1. Quick Deployment (Recommended)
```bash
# Navigate to project directory
cd /path/to/ibkr-tax-calculator

# Run deployment script
./deployment/deploy.sh
```

### 2. Manual Deployment (Alternative)

#### Step 2a: Create Deployment Package
```bash
# Create deployment directory
mkdir deployment_package
cd deployment_package

# Copy source code
cp -r ../src/ .
cp ../deployment/lambda_handler.py .
cp -r ../deployment/templates/ .

# Install dependencies
pip install -r ../deployment/requirements.txt -t .

# Create ZIP package
zip -r ../lambda-deployment.zip . -x "*.pyc" "*/__pycache__/*"
cd ..
```

#### Step 2b: Deploy CloudFormation Stack
```bash
aws cloudformation deploy \
    --template-file deployment/cloudformation-template.yaml \
    --stack-name ibkr-tax-calculator \
    --parameter-overrides ProjectName=ibkr-tax-calculator Stage=prod \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1
```

#### Step 2c: Update Lambda Function
```bash
aws lambda update-function-code \
    --function-name ibkr-tax-calculator-prod \
    --zip-file fileb://lambda-deployment.zip \
    --region us-east-1
```

## 🌐 Post-Deployment Configuration

### 1. Get Your Application URL
```bash
aws cloudformation describe-stacks \
    --stack-name ibkr-tax-calculator \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text
```

### 2. Test Your Application
1. Visit the URL from step 1
2. Upload a sample CSV file
3. Verify tax calculations work
4. Check that ads are displaying correctly

### 3. Set Up Custom Domain (Automated)

#### Quick Custom Domain Setup
```bash
# Deploy custom domain using CloudFormation
./deployment/deploy-custom-domain.sh
```

#### Manual Custom Domain Setup (Alternative)
1. **Request SSL certificate** in ACM (same region as API Gateway)
2. **Create custom domain** in API Gateway
3. **Create base path mapping** to connect domain to API
4. **Create Route 53 A records** pointing to API Gateway

#### Verify Custom Domain
```bash
# Test the domain
curl -I https://cgttaxtool.uk
curl https://cgttaxtool.uk/ads.txt

# Should return:
# - 200 OK for main site
# - ads.txt content: google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0
```

## 💡 Monetization Optimization

### 1. AdSense Optimization
- **Ad Placement**: Place ads above the fold and near content
- **Responsive Ads**: Use responsive ad units for mobile compatibility
- **Ad Balance**: Don't overwhelm users with too many ads
- **Content Quality**: High-quality content improves ad revenue

### 2. Amazon Associates Optimization
- **Relevant Products**: Only recommend tax/finance related products
- **Product Reviews**: Add brief descriptions to increase click-through
- **Seasonal Promotions**: Update links during tax season
- **Track Performance**: Monitor which products generate revenue

### 3. Revenue Maximization Tips
- **Target Keywords**: Optimize for "UK tax calculator", "IBKR tax", etc.
- **SEO Optimization**: Add meta tags, structured data
- **Social Sharing**: Add social media sharing buttons
- **Email Capture**: Consider newsletter signup for return visitors

## 📊 Monitoring and Analytics

### 1. AWS CloudWatch
- Monitor Lambda function performance
- Set up alerts for errors or high latency
- Track API Gateway metrics

### 2. Google Analytics
Add Google Analytics to track:
- User behavior and engagement
- Popular pages and features
- Conversion rates for ads

### 3. Revenue Tracking
- **AdSense Dashboard**: Monitor daily/monthly revenue
- **Amazon Associates Dashboard**: Track affiliate commissions
- **Performance Reports**: Analyze which content drives revenue

## 🔒 Security and Compliance

### 1. Data Protection
- No permanent data storage (GDPR compliant)
- HTTPS encryption for all communications
- Secure file processing in Lambda

### 2. Legal Requirements
- **Privacy Policy**: Update with your contact information
- **Terms of Service**: Review and customize for your jurisdiction
- **Cookie Consent**: Consider adding cookie consent banner
- **Tax Disclaimer**: Ensure proper disclaimers are prominent

## 💰 Cost Estimation (AWS Free Tier)

### Monthly Costs (First 12 months - FREE)
- **Lambda**: 1M requests + 400,000 GB-seconds FREE
- **API Gateway**: 1M API calls FREE
- **CloudWatch**: Basic monitoring FREE
- **Data Transfer**: 1GB outbound FREE

### After Free Tier (Estimated for 10,000 monthly users)
- **Lambda**: ~$5-10/month
- **API Gateway**: ~$3-5/month
- **CloudWatch**: ~$1-2/month
- **Total**: ~$10-20/month

### Revenue Potential
- **AdSense**: $1-5 per 1,000 page views (RPM)
- **Amazon Associates**: 1-10% commission on sales
- **Target**: 10,000 monthly users = $50-200/month potential

## 🆘 Troubleshooting

### Common Issues

#### 1. Lambda Function Timeout
```bash
# Increase timeout
aws lambda update-function-configuration \
    --function-name ibkr-tax-calculator-prod \
    --timeout 60
```

#### 2. Memory Issues
```bash
# Increase memory
aws lambda update-function-configuration \
    --function-name ibkr-tax-calculator-prod \
    --memory-size 2048
```

#### 3. Import Errors
- Ensure all dependencies are in the deployment package
- Check Python version compatibility (3.10)
- Verify file paths in lambda_handler.py

#### 4. CORS Issues
- Check API Gateway CORS configuration
- Verify headers in Lambda responses

### Getting Help
- **AWS Documentation**: https://docs.aws.amazon.com/
- **AWS Support**: Use AWS Support Center for technical issues
- **Community Forums**: Stack Overflow, AWS Forums

## 🎯 Next Steps

1. **Deploy and Test**: Follow this guide to deploy your application
2. **Optimize Ads**: Monitor performance and adjust ad placements
3. **SEO Optimization**: Improve search engine visibility
4. **Feature Enhancements**: Add new features based on user feedback
5. **Scale Up**: Consider upgrading to paid tiers as usage grows

## 📞 Support

If you encounter issues during deployment:
1. Check AWS CloudWatch logs for error details
2. Verify all placeholder values have been replaced
3. Ensure AWS credentials have proper permissions
4. Test with a simple CSV file first

Good luck with your deployment! 🚀
