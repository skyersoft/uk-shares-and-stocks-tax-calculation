#!/bin/bash

# Multi-region IBKR Tax Calculator Infrastructure Cleanup
# This script removes all infrastructure across regions

set -e

# Configuration
STACK_NAME="ibkr-tax-calculator-multi-region"
PROFILE="goker"
DOMAIN_NAME="cgttaxtool.uk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting multi-region infrastructure cleanup...${NC}"

# Function to check if stack exists
stack_exists() {
    local stack_name=$1
    local region=$2
    aws cloudformation describe-stacks --stack-name "$stack_name" --region "$region" --profile "$PROFILE" >/dev/null 2>&1
}

# Function to wait for stack deletion
wait_for_stack_deletion() {
    local stack_name=$1
    local region=$2
    
    echo -e "${YELLOW}Waiting for stack deletion to complete in $region...${NC}"
    aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region "$region" --profile "$PROFILE"
    echo -e "${GREEN}Stack deleted successfully in $region${NC}"
}

# Function to empty S3 bucket
empty_s3_bucket() {
    local bucket_name=$1
    echo -e "${YELLOW}Emptying S3 bucket: $bucket_name${NC}"
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket "$bucket_name" --profile "$PROFILE" 2>/dev/null; then
        # Delete all objects
        aws s3 rm s3://"$bucket_name" --recursive --profile "$PROFILE"
        echo -e "${GREEN}S3 bucket emptied: $bucket_name${NC}"
    else
        echo -e "${YELLOW}S3 bucket not found or already deleted: $bucket_name${NC}"
    fi
}

# Step 1: Get S3 bucket name before deleting stacks
echo -e "${BLUE}Step 1: Getting S3 bucket information...${NC}"
if stack_exists "$STACK_NAME-api" "eu-west-1"; then
    S3_BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-api" \
        --region eu-west-1 \
        --profile "$PROFILE" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$S3_BUCKET_NAME" ]; then
        echo -e "${GREEN}Found S3 bucket: $S3_BUCKET_NAME${NC}"
        empty_s3_bucket "$S3_BUCKET_NAME"
    fi
fi

# Step 2: Delete CloudFront stack in us-east-1 first (has dependencies)
echo -e "${BLUE}Step 2: Deleting CloudFront stack in us-east-1...${NC}"
if stack_exists "$STACK_NAME-cdn" "us-east-1"; then
    aws cloudformation delete-stack \
        --stack-name "$STACK_NAME-cdn" \
        --region us-east-1 \
        --profile "$PROFILE"
    
    wait_for_stack_deletion "$STACK_NAME-cdn" "us-east-1"
else
    echo -e "${YELLOW}CloudFront stack not found in us-east-1${NC}"
fi

# Step 3: Delete API Gateway stack in eu-west-1
echo -e "${BLUE}Step 3: Deleting API Gateway stack in eu-west-1...${NC}"
if stack_exists "$STACK_NAME-api" "eu-west-1"; then
    aws cloudformation delete-stack \
        --stack-name "$STACK_NAME-api" \
        --region eu-west-1 \
        --profile "$PROFILE"
    
    wait_for_stack_deletion "$STACK_NAME-api" "eu-west-1"
else
    echo -e "${YELLOW}API Gateway stack not found in eu-west-1${NC}"
fi

# Step 4: Clean up any remaining resources manually if needed
echo -e "${BLUE}Step 4: Checking for any remaining resources...${NC}"

# Check for any remaining S3 buckets
echo "Checking for remaining S3 buckets..."
REMAINING_BUCKETS=$(aws s3 ls --profile "$PROFILE" | grep -i ibkr | grep -i "$DOMAIN_NAME" || true)
if [ -n "$REMAINING_BUCKETS" ]; then
    echo -e "${YELLOW}Found remaining S3 buckets:${NC}"
    echo "$REMAINING_BUCKETS"
    echo -e "${YELLOW}You may need to delete these manually if they weren't created by CloudFormation.${NC}"
fi

# Check for any remaining CloudFront distributions
echo "Checking for remaining CloudFront distributions..."
REMAINING_CF=$(aws cloudfront list-distributions --profile "$PROFILE" --query "DistributionList.Items[?contains(Aliases.Items[0], '$DOMAIN_NAME')].{Id:Id,Domain:DomainName,Status:Status}" --output table 2>/dev/null || true)
if [ -n "$REMAINING_CF" ] && [ "$REMAINING_CF" != "None" ]; then
    echo -e "${YELLOW}Found remaining CloudFront distributions:${NC}"
    echo "$REMAINING_CF"
    echo -e "${YELLOW}These may be from earlier deployments. Check if they need manual cleanup.${NC}"
fi

# Final summary
echo -e "${GREEN}
===========================================
Multi-Region Cleanup Complete!
===========================================

Cleaned up:
- $STACK_NAME-cdn stack (us-east-1)
- $STACK_NAME-api stack (eu-west-1)
- S3 bucket contents

Note: 
- Route 53 hosted zone is preserved
- Existing Lambda function is preserved
- SSL certificates may take time to fully delete

Your cgttaxtool.uk domain is now available for 
redeployment with: ./deployment/deploy-multi-region.sh
===========================================${NC}"
