#!/bin/bash

# Terraform Deployment Script
# Deploy IBKR Tax Calculator infrastructure and code using Terraform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/myuser/development/ibkr-tax-calculator"
TERRAFORM_DIR="${PROJECT_ROOT}/deployment/terraform"

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         IBKR Tax Calculator - Terraform Deployment          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running from project root
if [ ! -f "${PROJECT_ROOT}/deployment/01-package.sh" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory.${NC}"
    exit 1
fi

# Step 1: Package Lambda code
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                       STEP 1/3: Package Lambda                 ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ ! -f "${PROJECT_ROOT}/lambda-deployment.zip" ] || [ "$1" == "--repackage" ]; then
    echo -e "${YELLOW}📦 Creating Lambda deployment package...${NC}"
    cd "${PROJECT_ROOT}"
    ./deployment/01-package.sh
else
    echo -e "${GREEN}✅ Lambda deployment package already exists${NC}"
    echo -e "${YELLOW}   (Use --repackage to force rebuild)${NC}"
fi

# Step 2: Terraform Plan
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                   STEP 2/3: Terraform Plan                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

cd "${TERRAFORM_DIR}"

echo -e "${YELLOW}🔍 Running terraform plan...${NC}"
terraform plan -out=tfplan

# Step 3: Apply Changes
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  STEP 3/3: Apply Changes                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ "$1" == "--auto-approve" ]; then
    echo -e "${YELLOW}🚀 Applying Terraform changes (auto-approved)...${NC}"
    terraform apply tfplan
else
    echo -e "${YELLOW}🚀 Applying Terraform changes...${NC}"
    terraform apply tfplan
fi

# Clean up plan file
rm -f tfplan

# Get outputs
echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                       Deployment Outputs                       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

terraform output

# CloudFront invalidation reminder
echo -e "\n${YELLOW}⚠️  IMPORTANT: Don't forget to invalidate CloudFront cache!${NC}"
echo -e "${YELLOW}   Run: aws cloudfront create-invalidation --distribution-id E3CPZK9XL7GR6Q --paths '/*' --profile goker${NC}"

echo -e "\n${GREEN}🎉 All done!${NC}"
