#!/bin/bash

# Phase 4: Create API-only deployment package for AWS Lambda
# This creates a deployment package with only the API handler (no static pages)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Phase 4: Creating API-only deployment package...${NC}"

# Configuration
DEPLOY_DIR="api_deployment_package"
PACKAGE_NAME="api-lambda-deployment.zip"

# Clean and create deployment directory
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo -e "${YELLOW}📋 Copying source code...${NC}"

# Copy source code (the actual calculator)
cp -r src/ $DEPLOY_DIR/

# Copy our new API-only Lambda handler
cp deployment/api_lambda_handler.py $DEPLOY_DIR/lambda_handler.py

echo -e "${YELLOW}📥 Installing dependencies...${NC}"

# Install dependencies to deployment directory (use python -m pip for conda compatibility)
python -m pip install -r deployment/requirements.txt -t $DEPLOY_DIR/

echo -e "${YELLOW}🗜️  Creating ZIP package...${NC}"

# Create ZIP package (exclude cache files)
cd $DEPLOY_DIR
zip -r ../$PACKAGE_NAME . -x "*.pyc" "*/__pycache__/*" "*.DS_Store"
cd ..

# Get package size
PACKAGE_SIZE=$(du -h $PACKAGE_NAME | cut -f1)

echo -e "${GREEN}✅ API deployment package created!${NC}"
echo -e "${GREEN}📦 Package: ${PACKAGE_NAME}${NC}"
echo -e "${GREEN}📏 Size: ${PACKAGE_SIZE}${NC}"

# Clean up temporary directory
rm -rf $DEPLOY_DIR

echo -e "${GREEN}🎯 Ready for Lambda deployment!${NC}"
