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

# Copy Lambda handler (deployment/lambda_handler.py has detect-broker endpoint)
cp deployment/lambda_handler.py $DEPLOY_DIR/lambda_handler.py

echo -e "${YELLOW}📥 Installing dependencies (Linux-compatible for Lambda python3.13)...${NC}"

IBKR_PIP="/usr/local/anaconda3/envs/ibkr-tax/bin/pip"

# Step 1 – Pure-Python packages: install using the ibkr-tax conda environment pip.
$IBKR_PIP install -r deployment/requirements.txt \
    -t $DEPLOY_DIR/ -q

# Step 2 – Overwrite ALL packages that have C extensions with Linux-compatible
#   manylinux2014_x86_64 wheels so they run on Amazon Linux 2 (Lambda).
#   IMPORTANT: Delete the macOS installs first so __config__.py and other
#   build-time files are fully replaced, not just the .so files.
BINARY_PKGS="numpy pandas lxml pydantic pydantic_core cffi charset-normalizer websockets curl_cffi"
for pkg in numpy numpy-* pandas pandas-* lxml lxml-* pydantic pydantic-* pydantic_core pydantic_core-* cffi cffi-* charset_normalizer charset_normalizer-* websockets websockets-* curl_cffi curl_cffi-*; do
    rm -rf "$DEPLOY_DIR/$pkg"
done

$IBKR_PIP install $BINARY_PKGS \
    -t $DEPLOY_DIR/ \
    --platform manylinux2014_x86_64 \
    --python-version 3.13 \
    --implementation cp \
    --only-binary=:all: \
    --upgrade -q

echo -e "${YELLOW}🗜️  Creating ZIP package...${NC}"

# Remove any darwin .so files that pypi may have installed despite --platform flag
# (some packages fall back to source install)
find $DEPLOY_DIR -name "*darwin*.so" -delete

# Remove any previous zip to avoid duplicate entries when zip -r updates in-place
rm -f $PACKAGE_NAME

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
