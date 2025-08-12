#!/bin/bash

# Step 3: Deploy application code to Lambda function
# This script uploads the deployment package to the Lambda function

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 Step 3: Deploying application code...${NC}"

# Check if deployment package exists
if [ ! -f "lambda-deployment.zip" ]; then
    echo -e "${RED}❌ Deployment package not found. Please run 01-package.sh first.${NC}"
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
PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)
echo -e "${GREEN}📦 Package size: ${PACKAGE_SIZE}${NC}"

# Update Lambda function code
echo -e "${YELLOW}📤 Uploading code to Lambda function...${NC}"
aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://lambda-deployment.zip \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table

# Update function configuration
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

# Test the function
echo -e "${YELLOW}🧪 Testing Lambda function...${NC}"
TEST_RESULT=$(aws lambda invoke \
    --function-name $LAMBDA_NAME \
    --payload '{"httpMethod":"GET","path":"/","headers":{},"queryStringParameters":null,"body":null}' \
    --region $REGION \
    --profile $AWS_PROFILE \
    response.json \
    --output text)

if [ -f "response.json" ]; then
    STATUS_CODE=$(cat response.json | python -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 'unknown'))")
    if [ "$STATUS_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Function test passed! Status code: ${STATUS_CODE}${NC}"
    else
        echo -e "${YELLOW}⚠️ Function test returned status code: ${STATUS_CODE}${NC}"
        echo -e "${YELLOW}Response preview:${NC}"
        head -c 200 response.json
        echo ""
    fi
    rm -f response.json
else
    echo -e "${RED}❌ Function test failed${NC}"
fi

echo -e "${GREEN}🎉 Step 3 completed! Application code deployed.${NC}"
echo -e "${GREEN}🌐 Your application is available at: ${API_URL}${NC}"
