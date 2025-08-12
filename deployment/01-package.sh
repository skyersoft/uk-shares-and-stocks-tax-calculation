#!/bin/bash

# Step 1: Package the application for deployment
# This script creates the deployment package with all dependencies

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ibkr-tax-calculator"
DEPLOY_DIR="deployment_package"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Step 1: Creating deployment package...${NC}"

# Clean up previous deployment package
echo -e "${YELLOW}🧹 Cleaning up previous deployment package...${NC}"
rm -rf $DEPLOY_DIR
rm -f lambda-deployment.zip

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
mkdir -p $DEPLOY_DIR

# Copy source code
echo -e "${YELLOW}📋 Copying source code...${NC}"
cp -r src/ $DEPLOY_DIR/
cp deployment/lambda_handler.py $DEPLOY_DIR/
cp -r deployment/templates/ $DEPLOY_DIR/

# Install dependencies
echo -e "${YELLOW}📥 Installing Python dependencies...${NC}"
python -m pip install -r deployment/requirements.txt -t $DEPLOY_DIR/ --quiet

# Create ZIP package
echo -e "${YELLOW}🗜️ Creating ZIP package...${NC}"
cd $DEPLOY_DIR
zip -r ../lambda-deployment.zip . -x "*.pyc" "*/__pycache__/*" > /dev/null
cd ..

# Get package size
PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)

echo -e "${GREEN}✅ Deployment package created successfully!${NC}"
echo -e "${GREEN}📦 Package size: ${PACKAGE_SIZE}${NC}"
echo -e "${GREEN}📄 Package file: lambda-deployment.zip${NC}"

# Cleanup deployment directory
rm -rf $DEPLOY_DIR

echo -e "${GREEN}🎉 Step 1 completed! Ready for deployment.${NC}"
