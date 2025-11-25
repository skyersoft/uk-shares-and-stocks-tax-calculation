#!/bin/bash

# OBSOLETE: This script is no longer needed
# Lambda deployment is now handled by Terraform
#
# Use: cd deployment/terraform && terraform apply

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 Step 3: Deploying API application code...${NC}"

# Check if API deployment package exists
if [ ! -f "api-lambda-deployment.zip" ]; then
    echo -e "${RED}❌ API deployment package not found. Please run 01-package-api.sh first.${NC}"
    exit 1
fi

# Check if stack outputs exist
if [ ! -f "deployment/stack-outputs.env" ]; then
    echo -e "${RED}❌ Stack outputs not found. Please run 02-deploy-infrastructure.sh first.${NC}"
    exit 1
fi

# Load stack outputs
source deployment/stack-outputs.env

echo -e "${GREEN}📋 Using configuration:${NC}"
echo -e "${GREEN}   Project: ${PROJECT_NAME}${NC}"
echo -e "${GREEN}   Region: ${REGION}${NC}"
echo -e "${GREEN}   Profile: ${AWS_PROFILE}${NC}"
echo -e "${GREEN}   Lambda: ${LAMBDA_NAME}${NC}"

# Get package size
PACKAGE_SIZE=$(du -h api-lambda-deployment.zip | cut -f1)
echo -e "${GREEN}📦 Package size: ${PACKAGE_SIZE}${NC}"

# Update Lambda function code
echo -e "${YELLOW}📤 Uploading API code to Lambda function...${NC}"
aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://api-lambda-deployment.zip \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table

# Wait for the function code update to complete before changing configuration
echo -e "${YELLOW}⏳ Waiting for function code update to complete...${NC}"
aws lambda wait function-updated \
    --function-name $LAMBDA_NAME \
    --region $REGION \
    --profile $AWS_PROFILE

# Update function configuration for API-only handler
echo -e "${YELLOW}⚙️ Updating Lambda function configuration...${NC}"
aws lambda update-function-configuration \
    --function-name $LAMBDA_NAME \
    --runtime python3.10 \
    --handler lambda_handler.lambda_handler \
    --memory-size 1024 \
    --timeout 30 \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table

# Wait for function to be ready
echo -e "${YELLOW}⏳ Waiting for function to be ready...${NC}"
aws lambda wait function-updated \
    --function-name $LAMBDA_NAME \
    --region $REGION \
    --profile $AWS_PROFILE

echo -e "${GREEN}✅ Lambda function updated successfully!${NC}"

# Test the API function
echo -e "${YELLOW}🧪 Testing API Lambda function...${NC}"
TEST_RESULT=$(aws lambda invoke \
    --function-name $LAMBDA_NAME \
    --payload fileb://test-payload.json \
    --region $REGION \
    --profile $AWS_PROFILE \
    response.json \
    --output text)

echo -e "${GREEN}🔍 Test result: ${TEST_RESULT}${NC}"

if [ -f "response.json" ]; then
    echo -e "${GREEN}📄 Lambda response:${NC}"
    cat response.json | python3 -m json.tool
    echo ""
fi

# Show API Gateway URL
echo -e "${GREEN}✅ API deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 API Gateway URL: ${API_URL}${NC}"
echo -e "${GREEN}🔗 Test endpoints:${NC}"
echo -e "${GREEN}   Health: ${API_URL}/health${NC}"
echo -e "${GREEN}   Calculate: ${API_URL}/calculate (POST)${NC}"
echo -e "${GREEN}   Download Report: ${API_URL}/download-report (POST)${NC}"

echo -e "${GREEN}🎉 Step 3 completed! API is ready for testing.${NC}"
