#!/bin/bash

# Deploy S3 + CloudFront static site for IBKR Tax Calculator
# This script creates S3 bucket and CloudFront distribution for static hosting

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ibkr-tax-calculator"
REGION="us-east-1"  # CloudFront certificates must be in us-east-1
STACK_NAME="${PROJECT_NAME}-static-site"
AWS_PROFILE="goker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌐 Deploying S3 + CloudFront static site...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured with the profile
echo -e "${YELLOW}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured for profile '$AWS_PROFILE'.${NC}"
    echo -e "${YELLOW}Please run 'aws sso login --profile $AWS_PROFILE' first.${NC}"
    exit 1
fi

# Get account info
ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query 'Account' --output text)
USER_ARN=$(aws sts get-caller-identity --profile $AWS_PROFILE --query 'Arn' --output text)

echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo -e "${GREEN}📋 Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}👤 User: ${USER_ARN}${NC}"

# Check if stack already exists
echo -e "${YELLOW}🔍 Checking if CloudFormation stack exists...${NC}"
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${YELLOW}🔄 Stack exists. Updating...${NC}"
    OPERATION="update"
else
    echo -e "${YELLOW}🆕 Stack doesn't exist. Creating...${NC}"
    OPERATION="create"
fi

# Deploy CloudFormation stack
echo -e "${YELLOW}🚀 Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file deployment/s3-cloudfront-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides ProjectName=$PROJECT_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --profile $AWS_PROFILE

echo -e "${GREEN}✅ CloudFormation stack deployed successfully!${NC}"

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Static site infrastructure deployed successfully!${NC}"
echo -e "${GREEN}🪣 S3 Bucket: ${BUCKET_NAME}${NC}"
echo -e "${GREEN}☁️ CloudFront ID: ${CLOUDFRONT_ID}${NC}"
echo -e "${GREEN}🌐 CloudFront Domain: ${CLOUDFRONT_DOMAIN}${NC}"
echo -e "${GREEN}🔗 Website URL: ${WEBSITE_URL}${NC}"

# Save outputs to file for next step
cat > deployment/static-site-outputs.env << EOF
BUCKET_NAME=${BUCKET_NAME}
CLOUDFRONT_ID=${CLOUDFRONT_ID}
CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}
WEBSITE_URL=${WEBSITE_URL}
PROJECT_NAME=${PROJECT_NAME}
REGION=${REGION}
AWS_PROFILE=${AWS_PROFILE}
EOF

echo -e "${GREEN}💾 Static site outputs saved to deployment/static-site-outputs.env${NC}"

# Upload static files
echo -e "${YELLOW}📤 Uploading static files to S3...${NC}"
aws s3 sync static/ s3://$BUCKET_NAME/ \
    --region $REGION \
    --profile $AWS_PROFILE \
    --delete \
    --cache-control "max-age=3600"

echo -e "${GREEN}✅ Static files uploaded successfully!${NC}"

# Invalidate CloudFront cache
echo -e "${YELLOW}🔄 Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --profile $AWS_PROFILE \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ CloudFront invalidation created: ${INVALIDATION_ID}${NC}"
echo -e "${GREEN}🎉 Static site deployment completed!${NC}"
echo -e "${GREEN}🌐 Your site will be available at: ${WEBSITE_URL}${NC}"
echo -e "${GREEN}📝 Note: DNS propagation may take a few minutes to complete.${NC}"
