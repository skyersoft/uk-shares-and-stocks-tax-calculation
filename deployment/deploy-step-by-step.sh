#!/bin/bash

# Simple step-by-step infrastructure deployment
set -e

STACK_NAME="ibkr-tax-step1-s3"
PROFILE="goker"
REGION="eu-west-1"
TEMPLATE_FILE="deployment/minimal-infrastructure.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Deploying S3 bucket only...${NC}"

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name "$1" --region "$2" --profile "$3" >/dev/null 2>&1
}

# Deploy or update stack
if stack_exists "$STACK_NAME" "$REGION" "$PROFILE"; then
    echo -e "${YELLOW}Updating existing stack...${NC}"
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue=cgttaxtool.uk \
        --region "$REGION" \
        --profile "$PROFILE"
    
    echo -e "${YELLOW}Waiting for stack update to complete...${NC}"
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --profile "$PROFILE"
else
    echo -e "${YELLOW}Creating new stack...${NC}"
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=DomainName,ParameterValue=cgttaxtool.uk \
        --region "$REGION" \
        --profile "$PROFILE"
    
    echo -e "${YELLOW}Waiting for stack creation to complete...${NC}"
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --profile "$PROFILE"
fi

# Get outputs
echo -e "${BLUE}Getting stack outputs...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

BUCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}
===========================================
Step 1 Complete: S3 Bucket Created!
===========================================

Bucket Name: $BUCKET_NAME
Bucket URL: $BUCKET_URL

Next steps:
1. Upload static files: aws s3 sync web_app/static/ s3://$BUCKET_NAME/ --profile $PROFILE
2. Test bucket: curl $BUCKET_URL

To add API Gateway: Edit the template and re-run this script
===========================================${NC}"
