#!/bin/bash

# Step 2: Deploy AWS infrastructure using AWS CLI (simplified approach)
# This script creates the Lambda function and API Gateway without CloudFormation

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ibkr-tax-calculator"
REGION="us-east-1"
STAGE="prod"
AWS_PROFILE="goker"
LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-${STAGE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️ Step 2: Deploying AWS infrastructure (simplified)...${NC}"

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

# Check if deployment package exists
if [ ! -f "lambda-deployment.zip" ]; then
    echo -e "${RED}❌ Deployment package not found. Please run 01-package.sh first.${NC}"
    exit 1
fi

# Check if Lambda function already exists
echo -e "${YELLOW}🔍 Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${YELLOW}🔄 Lambda function exists. Will update code later.${NC}"
    LAMBDA_EXISTS=true
else
    echo -e "${YELLOW}🆕 Lambda function doesn't exist. Creating...${NC}"
    LAMBDA_EXISTS=false
fi

# Create Lambda function if it doesn't exist
if [ "$LAMBDA_EXISTS" = false ]; then
    echo -e "${YELLOW}⚡ Creating Lambda function...${NC}"
    
    # Create the function
    aws lambda create-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --runtime python3.10 \
        --role arn:aws:iam::$ACCOUNT_ID:role/lambda_basic_execution \
        --handler lambda_handler.lambda_handler \
        --zip-file fileb://lambda-deployment.zip \
        --memory-size 1024 \
        --timeout 30 \
        --region $REGION \
        --profile $AWS_PROFILE \
        --environment Variables="{STAGE=$STAGE}" \
        --output table
    
    echo -e "${GREEN}✅ Lambda function created successfully!${NC}"
else
    echo -e "${GREEN}✅ Lambda function already exists${NC}"
fi

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --profile $AWS_PROFILE --query 'Configuration.FunctionArn' --output text)

echo -e "${GREEN}⚡ Lambda Function ARN: ${LAMBDA_ARN}${NC}"

# Check if API Gateway exists
echo -e "${YELLOW}🔍 Checking if API Gateway exists...${NC}"
API_ID=$(aws apigateway get-rest-apis --region $REGION --profile $AWS_PROFILE --query "items[?name=='${PROJECT_NAME}-api'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo -e "${YELLOW}🆕 Creating API Gateway...${NC}"
    
    # Create API Gateway
    API_ID=$(aws apigateway create-rest-api \
        --name "${PROJECT_NAME}-api" \
        --description "API for IBKR Tax Calculator" \
        --region $REGION \
        --profile $AWS_PROFILE \
        --query 'id' \
        --output text)
    
    echo -e "${GREEN}✅ API Gateway created: ${API_ID}${NC}"
else
    echo -e "${GREEN}✅ API Gateway already exists: ${API_ID}${NC}"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --profile $AWS_PROFILE --query 'items[?path==`/`].id' --output text)

# Create proxy resource if it doesn't exist
PROXY_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --profile $AWS_PROFILE --query 'items[?pathPart==`{proxy+}`].id' --output text)

if [ -z "$PROXY_RESOURCE_ID" ] || [ "$PROXY_RESOURCE_ID" = "None" ]; then
    echo -e "${YELLOW}🔗 Creating proxy resource...${NC}"
    
    PROXY_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part '{proxy+}' \
        --region $REGION \
        --profile $AWS_PROFILE \
        --query 'id' \
        --output text)
    
    echo -e "${GREEN}✅ Proxy resource created: ${PROXY_RESOURCE_ID}${NC}"
else
    echo -e "${GREEN}✅ Proxy resource already exists: ${PROXY_RESOURCE_ID}${NC}"
fi

# Create methods and integrations
echo -e "${YELLOW}🔗 Setting up API Gateway methods...${NC}"

# Create ANY method for proxy resource
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table || echo "Method may already exist"

# Create integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table || echo "Integration may already exist"

# Create ANY method for root resource
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ROOT_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table || echo "Method may already exist"

# Create integration for root
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $ROOT_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table || echo "Integration may already exist"

# Add Lambda permission for API Gateway
echo -e "${YELLOW}🔐 Adding Lambda permissions...${NC}"
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*/*" \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table || echo "Permission may already exist"

# Deploy API
echo -e "${YELLOW}🚀 Deploying API...${NC}"
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output table

# Construct API URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "${GREEN}🌐 API Gateway URL: ${API_URL}${NC}"
echo -e "${GREEN}⚡ Lambda Function: ${LAMBDA_FUNCTION_NAME}${NC}"
echo -e "${GREEN}🔗 Lambda ARN: ${LAMBDA_ARN}${NC}"

# Save outputs to file for next step
cat > deployment/stack-outputs.env << EOF
API_URL=${API_URL}
LAMBDA_ARN=${LAMBDA_ARN}
LAMBDA_NAME=${LAMBDA_FUNCTION_NAME}
PROJECT_NAME=${PROJECT_NAME}
REGION=${REGION}
AWS_PROFILE=${AWS_PROFILE}
API_ID=${API_ID}
EOF

echo -e "${GREEN}💾 Stack outputs saved to deployment/stack-outputs.env${NC}"
echo -e "${GREEN}🎉 Step 2 completed! Infrastructure is ready.${NC}"
