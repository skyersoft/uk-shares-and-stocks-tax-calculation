#!/bin/bash

# Deploy code to existing Lambda function
# Use this after manual setup or when updating code

set -e  # Exit on any error

# Configuration
LAMBDA_FUNCTION_NAME="ibkr-tax-calculator-prod"
REGION="eu-west-1"
AWS_PROFILE="goker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 IBKR Tax Calculator                         ║"
echo "║                   Code Deployment                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}🚀 Deploying code to existing Lambda function...${NC}"

# Step 1: Package if needed
if [ ! -f "lambda-deployment.zip" ]; then
    echo -e "${YELLOW}📦 Creating deployment package...${NC}"
    ./deployment/01-package.sh
fi

# Step 2: Check if Lambda function exists
echo -e "${YELLOW}🔍 Checking if Lambda function exists...${NC}"
if ! aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${RED}❌ Lambda function '$LAMBDA_FUNCTION_NAME' not found.${NC}"
    echo -e "${YELLOW}Please follow the manual setup guide first:${NC}"
    echo -e "${YELLOW}   cat deployment/MANUAL_SETUP_GUIDE.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Lambda function found${NC}"

# Step 3: Deploy code
echo -e "${YELLOW}📤 Uploading code to Lambda function...${NC}"

# Get package size
PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)
echo -e "${GREEN}📦 Package size: ${PACKAGE_SIZE}${NC}"

# Update Lambda function code
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://lambda-deployment.zip \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table

# Update function configuration
echo -e "${YELLOW}⚙️ Updating Lambda function configuration...${NC}"
aws lambda update-function-configuration \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime python3.10 \
    --handler lambda_handler.lambda_handler \
    --memory-size 1024 \
    --timeout 30 \
    --region $REGION \
    --profile $AWS_PROFILE \
    --environment Variables="{STAGE=prod}" \
    --output table

# Wait for function to be ready
echo -e "${YELLOW}⏳ Waiting for function to be ready...${NC}"
aws lambda wait function-updated \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $REGION \
    --profile $AWS_PROFILE

echo -e "${GREEN}✅ Lambda function updated successfully!${NC}"

# Test the function
echo -e "${YELLOW}🧪 Testing Lambda function...${NC}"
TEST_RESULT=$(aws lambda invoke \
    --function-name $LAMBDA_FUNCTION_NAME \
    --payload '{"httpMethod":"GET","path":"/","headers":{},"queryStringParameters":null,"body":null}' \
    --region $REGION \
    --profile $AWS_PROFILE \
    response.json \
    --output text)

if [ -f "response.json" ]; then
    STATUS_CODE=$(cat response.json | python -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 'unknown'))" 2>/dev/null || echo "unknown")
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

# Try to get API Gateway URL if stack outputs exist
if [ -f "deployment/stack-outputs.env" ]; then
    source deployment/stack-outputs.env
    echo -e "\n${GREEN}🌐 Your application should be available at: ${API_URL}${NC}"
else
    echo -e "\n${YELLOW}💡 To get your API Gateway URL:${NC}"
    echo -e "${YELLOW}   1. Go to AWS API Gateway Console${NC}"
    echo -e "${YELLOW}   2. Find 'ibkr-tax-calculator-api'${NC}"
    echo -e "${YELLOW}   3. Go to Stages → prod${NC}"
    echo -e "${YELLOW}   4. Copy the Invoke URL${NC}"
fi

echo -e "\n${GREEN}🎉 Code deployment completed!${NC}"

# Show next steps
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo -e "${YELLOW}1. Test your application with the API Gateway URL${NC}"
echo -e "${YELLOW}2. Set up Google AdSense and replace YOUR_ADSENSE_ID in templates${NC}"
echo -e "${YELLOW}3. Set up Amazon Associates and replace affiliate links${NC}"
echo -e "${YELLOW}4. Run ./deployment/04-test-deployment.sh to verify everything works${NC}"

echo -e "\n${GREEN}✨ Happy calculating! ✨${NC}"
