#!/bin/bash

# Run local development environment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting local development environment...${NC}"

# Check if awslocal is installed
if ! command -v awslocal &> /dev/null
then
    echo -e "${RED}awslocal could not be found.${NC}"
    echo -e "${YELLOW}Please install it by running: python -m pip install awscli-local${NC}"
    exit 1
fi

# Start LocalStack
echo -e "${YELLOW}Starting LocalStack container...${NC}"
docker-compose up -d

# Give LocalStack some time to initialize before polling
sleep 20

# Wait for LocalStack to be ready
echo -e "${YELLOW}Waiting for LocalStack to be ready...${NC}"
MAX_RETRIES=90
RETRY_INTERVAL=10

for i in $(seq 1 $MAX_RETRIES);
do
    HEALTH_STATUS=$(curl -s http://localhost:4566/health)
    if echo "$HEALTH_STATUS" | grep -q '"status": "running"' && \
       echo "$HEALTH_STATUS" | grep -q '"s3": "running"' && \
       echo "$HEALTH_STATUS" | grep -q '"lambda": "running"' && \
       echo "$HEALTH_STATUS" | grep -q '"apigateway": "running"' && \
       echo "$HEALTH_STATUS" | grep -q '"cloudfront": "running"'
    then
        echo -e "${GREEN}LocalStack is ready!${NC}"
        break
    else
        echo -e "${YELLOW}LocalStack not ready yet. Retrying in ${RETRY_INTERVAL} seconds...${NC}"
        sleep ${RETRY_INTERVAL}
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo -e "${RED}LocalStack did not become ready in time. Exiting.${NC}"
        exit 1
    fi
done

# Create local resources
echo -e "${BLUE}Creating local AWS resources...${NC}"
sh deployment/local/01-create-local-resources.sh

# Deploy Lambda code
echo -e "${BLUE}Deploying Lambda code...${NC}"
sh deployment/local/02-deploy-lambda.sh

# Update UI with API Gateway URL
echo -e "${BLUE}Updating UI with API Gateway URL...${NC}"
sh deployment/local/04-update-ui.sh

# Deploy static website
echo -e "${BLUE}Deploying static website...${NC}"
sh deployment/local/03-deploy-s3.sh

API_ID=$(cat .localstack-api-id)
API_URL="http://localhost:4566/restapis/${API_ID}/prod/_user_request_"
BUCKET_NAME="ibkr-tax-calculator-local-bucket"
WEBSITE_URL="http://${BUCKET_NAME}.s3-website.us-east-1.amazonaws.com"

echo -e "${GREEN}Local development environment is ready!${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"
echo -e "${GREEN}Website URL: ${WEBSITE_URL}${NC}"
echo -e "${GREEN}API Gateway URL: ${API_URL}${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"
