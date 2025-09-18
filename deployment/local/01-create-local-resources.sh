#!/bin/bash

# Step 1: Create local AWS resources using awslocal

set -e

# Configuration
AWS_PROFILE="goker"
REGION="us-east-1"
BUCKET_NAME="ibkr-tax-calculator-local-bucket"
LAMBDA_NAME="ibkr-tax-calculator-local-lambda"
API_NAME="ibkr-tax-calculator-local-api"
ROLE_NAME="ibkr-tax-calculator-local-role"
STAGE_NAME="prod"
API_ID_FILE=".localstack-api-id"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating local AWS resources...${NC}"

# Create S3 bucket
echo -e "${GREEN}Creating S3 bucket: ${BUCKET_NAME}${NC}"
awslocal s3api create-bucket --bucket ${BUCKET_NAME} --region ${REGION}

# Create IAM role for Lambda
echo -e "${GREEN}Creating IAM role: ${ROLE_NAME}${NC}"
ROLE_ARN=$(awslocal iam create-role \
    --role-name ${ROLE_NAME} \
    --assume-role-policy-document '{ \
        "Version": "2012-10-17", \
        "Statement": [{ \
            "Effect": "Allow", \
            "Principal": {"Service": "lambda.amazonaws.com"}, \
            "Action": "sts:AssumeRole" \
        }] \
    }' \
    --query 'Role.Arn' --output text)
echo -e "${GREEN}IAM role created with ARN: ${ROLE_ARN}${NC}"

# Create Lambda function
echo -e "${GREEN}Creating Lambda function: ${LAMBDA_NAME}${NC}"
LAMBDA_ARN=$(awslocal lambda create-function \
    --function-name ${LAMBDA_NAME} \
    --runtime python3.10 \
    --handler lambda_handler.lambda_handler \
    --role ${ROLE_ARN} \
    --zip-file fileb://deployment/local/dummy_lambda.zip \
    --query 'FunctionArn' --output text)
echo -e "${GREEN}Lambda function created with ARN: ${LAMBDA_ARN}${NC}"

# Create API Gateway
echo -e "${GREEN}Creating API Gateway: ${API_NAME}${NC}"
API_ID=$(awslocal apigateway create-rest-api \
    --name ${API_NAME} \
    --query 'id' --output text)
echo -e "${GREEN}API Gateway created with ID: ${API_ID}${NC}"

# Save API ID to file
echo ${API_ID} > ${API_ID_FILE}

# Get root resource ID
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id ${API_ID} \
    --query 'items[?path==`/`].id' --output text)

# Create /health resource and GET method
HEALTH_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id ${API_ID} --parent-id ${ROOT_RESOURCE_ID} --path-part health --query 'id' --output text)
awslocal apigateway put-method --rest-api-id ${API_ID} --resource-id ${HEALTH_RESOURCE_ID} --http-method GET --authorization-type NONE
awslocal apigateway put-integration --rest-api-id ${API_ID} --resource-id ${HEALTH_RESOURCE_ID} --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations

# Create /calculate resource and POST method
CALCULATE_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id ${API_ID} --parent-id ${ROOT_RESOURCE_ID} --path-part calculate --query 'id' --output text)
awslocal apigateway put-method --rest-api-id ${API_ID} --resource-id ${CALCULATE_RESOURCE_ID} --http-method POST --authorization-type NONE
awslocal apigateway put-integration --rest-api-id ${API_ID} --resource-id ${CALCULATE_RESOURCE_ID} --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations

# Create /download-report resource and POST method
DOWNLOAD_RESOURCE_ID=$(awslocal apigateway create-resource --rest-api-id ${API_ID} --parent-id ${ROOT_RESOURCE_ID} --path-part download-report --query 'id' --output text)
awslocal apigateway put-method --rest-api-id ${API_ID} --resource-id ${DOWNLOAD_RESOURCE_ID} --http-method POST --authorization-type NONE
awslocal apigateway put-integration --rest-api-id ${API_ID} --resource-id ${DOWNLOAD_RESOURCE_ID} --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations

# Create deployment
echo -e "${GREEN}Creating API Gateway deployment...${NC}"
awslocal apigateway create-deployment --rest-api-id ${API_ID} --stage-name ${STAGE_NAME}

API_URL="http://localhost:4566/restapis/${API_ID}/${STAGE_NAME}/_user_request_"
echo -e "${GREEN}API Gateway URL: ${API_URL}${NC}"

echo -e "${YELLOW}Local resources created successfully.${NC}"