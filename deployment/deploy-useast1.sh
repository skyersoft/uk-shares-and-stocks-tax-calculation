#!/bin/bash

# Single-region deployment in us-east-1
# Complete infrastructure: S3 + API Gateway + CloudFront + SSL + DNS

set -e

STACK_NAME="ibkr-tax-useast1-complete"
PROFILE="goker"
DOMAIN_NAME="cgttaxtool.uk"
TEMPLATE_FILE="single-region-complete.yaml"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Deploying complete infrastructure in us-east-1...${NC}"

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

# Deploy the complete stack
echo -e "${BLUE}Deploying complete infrastructure stack...${NC}"

if stack_exists "$STACK_NAME" "$REGION"; then
    echo "Updating existing stack..."
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        --capabilities CAPABILITY_IAM \
        --region "$REGION" \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME" "$REGION" "update"
else
    echo "Creating new stack..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
        --capabilities CAPABILITY_IAM \
        --region "$REGION" \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME" "$REGION" "create"
fi

# Get outputs
echo -e "${BLUE}Getting deployment URLs...${NC}"

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text)

# Upload static files
echo -e "${BLUE}Uploading static files to S3...${NC}"
if [ -d "web_app/static" ]; then
    echo "Uploading files to S3 bucket: $S3_BUCKET"
    aws s3 sync web_app/static/ s3://"$S3_BUCKET"/ \
        --profile "$PROFILE" \
        --cache-control "max-age=86400" \
        --delete
    echo -e "${GREEN}✅ Static files uploaded${NC}"
else
    echo -e "${YELLOW}⚠️  web_app/static directory not found. Uploading test file...${NC}"
    echo "<html><body><h1>IBKR Tax Calculator</h1><p>Infrastructure deployed successfully!</p></body></html>" > test-index.html
    aws s3 cp test-index.html s3://"$S3_BUCKET"/index.html --profile "$PROFILE"
    rm test-index.html
fi

# Test endpoints
echo -e "${BLUE}Testing endpoints...${NC}"

# Test API
echo "Testing API Gateway..."
API_HEALTH=$(curl -s "$API_URL/health" | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$API_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ API Gateway working${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway test failed${NC}"
fi

# Test CloudFront
echo "Testing CloudFront distribution..."
CF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFRONT_URL" 2>/dev/null || echo "000")
if [ "$CF_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ CloudFront distribution working${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront not yet ready (may take 10-15 minutes)${NC}"
fi

# Final summary
echo -e "${GREEN}
===========================================
Single-Region Deployment Complete!
===========================================

All infrastructure in us-east-1:
📍 S3 Bucket: $S3_BUCKET
📍 API Gateway: $API_URL
📍 CloudFront: https://$CLOUDFRONT_URL
📍 Website: $WEBSITE_URL

Stack: $STACK_NAME (us-east-1)

Test URLs:
- API Health: $API_URL/health
- CloudFront: https://$CLOUDFRONT_URL  
- Website: $WEBSITE_URL

Note: 
- SSL certificate validation may take 10-30 minutes
- DNS propagation can take up to 24 hours
- Test CloudFront URL first, then domain
===========================================${NC}"
