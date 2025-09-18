#!/bin/bash

# Step 3: Deploy static website to LocalStack S3

set -e

# Configuration
BUCKET_NAME="ibkr-tax-calculator-local-bucket"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying static website to LocalStack S3...${NC}"

awslocal s3 sync ./static s3://${BUCKET_NAME}

echo -e "${YELLOW}Static website deployed successfully.${NC}"
