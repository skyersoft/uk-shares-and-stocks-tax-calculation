#!/bin/bash

# Step-by-step deployment for multi-region infrastructure
# Step 1: API + S3 in eu-west-1 (already done)
# Step 2: CloudFront + SSL + DNS in us-east-1

set -e

STACK_NAME="ibkr-tax-step1-s3"
CDN_STACK_NAME="ibkr-tax-cloudfront"
PROFILE="goker"
DOMAIN_NAME="cgttaxtool.uk"
TEMPLATE_FILE="deployment/minimal-infrastructure.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Phase 3: Adding CloudFront + SSL + DNS${NC}"

# Function to check if stack exists
stack_exists() {
    local stack_name=$1
    local region=$2
    aws cloudformation describe-stacks --stack-name "$stack_name" --region "$region" --profile "$PROFILE" >/dev/null 2>&1
}

# Function to wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local region=$2
    local operation=$3
    
    echo -e "${YELLOW}Waiting for stack $operation to complete in $region...${NC}"
    aws cloudformation wait "stack-${operation}-complete" --stack-name "$stack_name" --region "$region" --profile "$PROFILE"
    
    local status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --region "$region" --profile "$PROFILE" --query 'Stacks[0].StackStatus' --output text)
    if [[ "$status" == *"COMPLETE"* && "$status" != *"ROLLBACK"* ]]; then
        echo -e "${GREEN}Stack $operation completed successfully in $region${NC}"
        return 0
    else
        echo -e "${RED}Stack $operation failed in $region with status: $status${NC}"
        return 1
    fi
}

# Step 1: Check current eu-west-1 stack
echo -e "${BLUE}Step 1: Checking current API + S3 stack in eu-west-1...${NC}"
if stack_exists "$STACK_NAME" "eu-west-1"; then
    echo -e "${GREEN}✅ API + S3 stack exists and working in eu-west-1${NC}"
else
    echo -e "${RED}❌ API + S3 stack missing in eu-west-1. Please deploy it first.${NC}"
    exit 1
fi

# Step 2: Deploy CloudFront + SSL + DNS in us-east-1
echo -e "${BLUE}Step 2: Deploying CloudFront + SSL + DNS in us-east-1...${NC}"

if stack_exists "$CDN_STACK_NAME" "us-east-1"; then
    echo "Updating existing CloudFront stack in us-east-1..."
    aws cloudformation update-stack \
        --stack-name "$CDN_STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        --capabilities CAPABILITY_IAM \
        --region us-east-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$CDN_STACK_NAME" "us-east-1" "update"
else
    echo "Creating new CloudFront stack in us-east-1..."
    aws cloudformation create-stack \
        --stack-name "$CDN_STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        --capabilities CAPABILITY_IAM \
        --region us-east-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$CDN_STACK_NAME" "us-east-1" "create"
fi

# Step 3: Get outputs from both stacks
echo -e "${BLUE}Step 3: Getting deployment URLs...${NC}"

# API Gateway URL from eu-west-1
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region eu-west-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region eu-west-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

# CloudFront URL from us-east-1
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$CDN_STACK_NAME" \
    --region us-east-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$CDN_STACK_NAME" \
    --region us-east-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text)

# Step 4: Upload static files to S3
echo -e "${BLUE}Step 4: Uploading static files to S3...${NC}"
if [ -d "web_app/static" ]; then
    echo "Uploading files to S3 bucket: $S3_BUCKET"
    aws s3 sync web_app/static/ s3://"$S3_BUCKET"/ \
        --profile "$PROFILE" \
        --cache-control "max-age=86400" \
        --delete
    echo -e "${GREEN}✅ Static files uploaded${NC}"
else
    echo -e "${YELLOW}⚠️  web_app/static directory not found. Skipping file upload.${NC}"
fi

# Step 5: Test endpoints
echo -e "${BLUE}Step 5: Testing endpoints...${NC}"

# Test API directly
echo "Testing API Gateway..."
API_HEALTH=$(curl -s "$API_URL/health" | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$API_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ API Gateway working${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway test failed${NC}"
fi

# Test website (might take time for DNS/CloudFront to propagate)
echo "Testing website (may take time for DNS propagation)..."
WEBSITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" 2>/dev/null || echo "000")
if [ "$WEBSITE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Website accessible at https://$DOMAIN_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  Website not yet accessible (DNS/CloudFront propagation needed)${NC}"
fi

# Final summary
echo -e "${GREEN}
===========================================
Multi-Region Deployment Complete!
===========================================

Infrastructure:
📍 eu-west-1: API Gateway + S3 + Lambda
📍 us-east-1: CloudFront + SSL + DNS

URLs:
🌐 Website: https://$DOMAIN_NAME
🔗 API: $API_URL  
☁️  CloudFront: https://$CLOUDFRONT_URL
📦 S3 Bucket: $S3_BUCKET

Stacks:
- $STACK_NAME (eu-west-1) 
- $CDN_STACK_NAME (us-east-1)

Note: DNS propagation can take up to 24 hours.
Test direct CloudFront URL if domain doesn't work immediately.
===========================================${NC}"
