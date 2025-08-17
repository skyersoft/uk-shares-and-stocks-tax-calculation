#!/bin/bash

# Multi-region IBKR Tax Calculator Infrastructure Deployment
# This script deploys the complete infrastructure across regions properly

set -e

# Configuration
STACK_NAME="ibkr-tax-calculator-multi-region"
PROFILE="goker"
DOMAIN_NAME="cgttaxtool.uk"
LAMBDA_ARN="arn:aws:lambda:eu-west-1:286154443186:function:ibkr-tax-calculator-prod"
TEMPLATE_FILE="deployment/simple-multi-region.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting multi-region infrastructure deployment...${NC}"

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
    
    # Check final status
    local status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --region "$region" --profile "$PROFILE" --query 'Stacks[0].StackStatus' --output text)
    if [[ "$status" == *"COMPLETE"* && "$status" != *"ROLLBACK"* ]]; then
        echo -e "${GREEN}Stack $operation completed successfully in $region${NC}"
        return 0
    else
        echo -e "${RED}Stack $operation failed in $region with status: $status${NC}"
        return 1
    fi
}

# Step 1: Deploy API Gateway and S3 in eu-west-1 (primary region)
echo -e "${BLUE}Step 1: Deploying API Gateway and S3 bucket in eu-west-1...${NC}"

if stack_exists "$STACK_NAME-api" "eu-west-1"; then
    echo "Updating existing stack in eu-west-1..."
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME-api" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                    ParameterKey=Environment,ParameterValue=prod \
        --capabilities CAPABILITY_IAM \
        --region eu-west-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME-api" "eu-west-1" "update"
else
    echo "Creating new stack in eu-west-1..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME-api" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                    ParameterKey=Environment,ParameterValue=prod \
        --capabilities CAPABILITY_IAM \
        --region eu-west-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME-api" "eu-west-1" "create"
fi

# Get outputs from eu-west-1 stack
echo -e "${YELLOW}Getting API Gateway URL from eu-west-1...${NC}"
API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME-api" \
    --region eu-west-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

S3_BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME-api" \
    --region eu-west-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

echo -e "${GREEN}API Gateway URL: $API_GATEWAY_URL${NC}"
echo -e "${GREEN}S3 Bucket: $S3_BUCKET_NAME${NC}"

# Step 2: Deploy CloudFront, SSL, and DNS in us-east-1
echo -e "${BLUE}Step 2: Deploying CloudFront, SSL, and DNS in us-east-1...${NC}"

if stack_exists "$STACK_NAME-cdn" "us-east-1"; then
    echo "Updating existing stack in us-east-1..."
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME-cdn" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                    ParameterKey=Environment,ParameterValue=prod \
        --capabilities CAPABILITY_IAM \
        --region us-east-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME-cdn" "us-east-1" "update"
else
    echo "Creating new stack in us-east-1..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME-cdn" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                    ParameterKey=Environment,ParameterValue=prod \
        --capabilities CAPABILITY_IAM \
        --region us-east-1 \
        --profile "$PROFILE"
    
    wait_for_stack "$STACK_NAME-cdn" "us-east-1" "create"
fi

# Get outputs from us-east-1 stack
echo -e "${YELLOW}Getting CloudFront distribution details...${NC}"
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME-cdn" \
    --region us-east-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME-cdn" \
    --region us-east-1 \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}CloudFront URL: $CLOUDFRONT_URL${NC}"
echo -e "${GREEN}Website URL: $WEBSITE_URL${NC}"

# Step 3: Upload static files to S3 bucket
echo -e "${BLUE}Step 3: Uploading static files to S3...${NC}"

if [ -d "web_app/static" ]; then
    echo "Uploading static files..."
    aws s3 sync web_app/static/ s3://"$S3_BUCKET_NAME"/ \
        --profile "$PROFILE" \
        --delete \
        --cache-control "max-age=86400"
    echo -e "${GREEN}Static files uploaded successfully${NC}"
else
    echo -e "${YELLOW}Warning: web_app/static directory not found. You'll need to upload static files manually.${NC}"
fi

# Step 4: Invalidate CloudFront cache
echo -e "${BLUE}Step 4: Invalidating CloudFront cache...${NC}"
CLOUDFRONT_ID=$(aws cloudfront list-distributions \
    --profile "$PROFILE" \
    --query "DistributionList.Items[?Aliases.Items[0]=='$DOMAIN_NAME'].Id" \
    --output text)

if [ -n "$CLOUDFRONT_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --profile "$PROFILE"
    echo -e "${GREEN}CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}Warning: Could not find CloudFront distribution for cache invalidation${NC}"
fi

# Final summary
echo -e "${GREEN}
===========================================
Multi-Region Deployment Complete!
===========================================

Resources Created:
- eu-west-1: API Gateway, S3 Bucket, Lambda permissions
- us-east-1: CloudFront, SSL Certificate, DNS records

URLs:
- Website: https://$DOMAIN_NAME
- API: $API_GATEWAY_URL
- CloudFront: https://$CLOUDFRONT_URL

Stacks Created:
- $STACK_NAME-api (eu-west-1)
- $STACK_NAME-cdn (us-east-1)

Next Steps:
1. Upload your static website files to: $S3_BUCKET_NAME
2. Test the website: https://$DOMAIN_NAME
3. Test the API: $API_GATEWAY_URL/health

Cleanup Command:
./deployment/cleanup-multi-region.sh
===========================================${NC}"
