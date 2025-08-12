#!/bin/bash

# Step 2: Deploy AWS infrastructure using CloudFormation
# This script creates the Lambda function, API Gateway, and IAM roles

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ibkr-tax-calculator"
REGION="eu-west-1"
STAGE="prod"
AWS_PROFILE="goker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️ Step 2: Deploying AWS infrastructure...${NC}"

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
if aws cloudformation describe-stacks --stack-name $PROJECT_NAME --region $REGION --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${YELLOW}🔄 Stack exists. Updating...${NC}"
    OPERATION="update"
else
    echo -e "${YELLOW}🆕 Stack doesn't exist. Creating...${NC}"
    OPERATION="create"
fi

# Deploy CloudFormation stack
echo -e "${YELLOW}🚀 Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file deployment/cloudformation-template.yaml \
    --stack-name $PROJECT_NAME \
    --parameter-overrides ProjectName=$PROJECT_NAME Stage=$STAGE \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --profile $AWS_PROFILE

echo -e "${GREEN}✅ CloudFormation stack deployed successfully!${NC}"

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $PROJECT_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name $PROJECT_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
    --output text)

LAMBDA_NAME=$(aws cloudformation describe-stacks \
    --stack-name $PROJECT_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "${GREEN}🌐 API Gateway URL: ${API_URL}${NC}"
echo -e "${GREEN}⚡ Lambda Function: ${LAMBDA_NAME}${NC}"
echo -e "${GREEN}🔗 Lambda ARN: ${LAMBDA_ARN}${NC}"

# Save outputs to file for next step
cat > deployment/stack-outputs.env << EOF
API_URL=${API_URL}
LAMBDA_ARN=${LAMBDA_ARN}
LAMBDA_NAME=${LAMBDA_NAME}
PROJECT_NAME=${PROJECT_NAME}
REGION=${REGION}
AWS_PROFILE=${AWS_PROFILE}
EOF

echo -e "${GREEN}💾 Stack outputs saved to deployment/stack-outputs.env${NC}"
echo -e "${GREEN}🎉 Step 2 completed! Infrastructure is ready.${NC}"
