#!/bin/bash

# IBKR Tax Calculator Deployment Script
# This script packages and deploys the application to AWS Lambda

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ibkr-tax-calculator"
REGION="us-east-1"  # Change to your preferred region
STAGE="prod"
LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-${STAGE}"
AWS_PROFILE="goker"  # SSO profile name

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of IBKR Tax Calculator${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured with the profile
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured for profile '$AWS_PROFILE'.${NC}"
    echo -e "${YELLOW}Please run 'aws sso login --profile $AWS_PROFILE' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured with profile: $AWS_PROFILE${NC}"

# Create deployment directory
DEPLOY_DIR="deployment_package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Copy source code
cp -r src/ $DEPLOY_DIR/
cp deployment/lambda_handler.py $DEPLOY_DIR/
cp -r deployment/templates/ $DEPLOY_DIR/

# Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
pip install -r deployment/requirements.txt -t $DEPLOY_DIR/

# Create ZIP package
echo -e "${YELLOW}🗜️  Creating ZIP package...${NC}"
cd $DEPLOY_DIR
zip -r ../lambda-deployment.zip . -x "*.pyc" "*/__pycache__/*"
cd ..

echo -e "${GREEN}✅ Deployment package created: lambda-deployment.zip${NC}"

# Check if Lambda function exists
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${YELLOW}🔄 Updating existing Lambda function...${NC}"

    # Update function code
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb://lambda-deployment.zip \
        --region $REGION \
        --profile $AWS_PROFILE

    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $LAMBDA_FUNCTION_NAME \
        --runtime python3.10 \
        --handler lambda_handler.lambda_handler \
        --memory-size 1024 \
        --timeout 30 \
        --region $REGION \
        --profile $AWS_PROFILE

    echo -e "${GREEN}✅ Lambda function updated${NC}"
else
    echo -e "${YELLOW}🆕 Creating new Lambda function...${NC}"

    # Deploy CloudFormation stack
    aws cloudformation deploy \
        --template-file deployment/cloudformation-template.yaml \
        --stack-name $PROJECT_NAME \
        --parameter-overrides ProjectName=$PROJECT_NAME Stage=$STAGE \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $REGION \
        --profile $AWS_PROFILE

    echo -e "${GREEN}✅ CloudFormation stack deployed${NC}"

    # Update function code
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb://lambda-deployment.zip \
        --region $REGION \
        --profile $AWS_PROFILE

    echo -e "${GREEN}✅ Lambda function created and updated${NC}"
fi

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $PROJECT_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is available at: ${API_URL}${NC}"

# Cleanup
rm -rf $DEPLOY_DIR
rm lambda-deployment.zip

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Set up your Google AdSense account and replace YOUR_ADSENSE_ID in templates"
echo -e "2. Set up Amazon Associates account and replace affiliate links"
echo -e "3. Configure a custom domain (optional)"
echo -e "4. Set up monitoring and alerts"
echo -e "5. Test the application with sample data"

echo -e "${GREEN}✨ Deployment complete!${NC}"
