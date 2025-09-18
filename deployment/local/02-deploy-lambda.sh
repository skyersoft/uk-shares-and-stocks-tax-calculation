#!/bin/bash

# Step 2: Deploy Lambda code to LocalStack

set -e

# Configuration
LAMBDA_NAME="ibkr-tax-calculator-local-lambda"
ZIP_FILE="deployment/local/lambda.zip"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying Lambda code to LocalStack...${NC}"

# Create zip file
echo -e "${GREEN}Creating zip file for Lambda code...${NC}"
(cd src/main/python && zip -r ../../../${ZIP_FILE} .)

# Update Lambda function code
echo -e "${GREEN}Updating Lambda function code...${NC}"
awslocal lambda update-function-code \
    --function-name ${LAMBDA_NAME} \
    --zip-file fileb://${ZIP_FILE}

echo -e "${YELLOW}Lambda code deployed successfully.${NC}"
