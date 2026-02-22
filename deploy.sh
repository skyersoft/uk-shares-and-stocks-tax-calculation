#!/bin/bash

# Complete AWS Deployment Script
# Deploys both frontend (S3/CloudFront) and backend (Lambda/API Gateway)

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/deployment/terraform"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

# Get outputs from Terraform
cd "${TERRAFORM_DIR}"
S3_BUCKET=$(terraform output -raw website_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
cd "${PROJECT_ROOT}"

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         IBKR Tax Calculator - Complete Deployment           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}S3 Bucket:${NC} ${S3_BUCKET}"
echo -e "${BLUE}CloudFront:${NC} ${CLOUDFRONT_ID}"
echo ""

# Step 1: Build Frontend
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    STEP 1/4: Build Frontend                   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}📦 Building React SPA...${NC}"
npm run build:spa

if [ ! -d "${DIST_DIR}" ]; then
    echo -e "${RED}❌ Build failed: dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 2: Package Lambda
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                   STEP 2/4: Package Lambda                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ ! -f "${PROJECT_ROOT}/lambda-deployment.zip" ] || [ "$1" == "--repackage" ]; then
    echo -e "${YELLOW}📦 Creating Lambda deployment package...${NC}"
    ./deployment/01-package.sh
else
    echo -e "${GREEN}✅ Lambda package exists (use --repackage to rebuild)${NC}"
fi

# Step 3: Deploy Backend (Terraform)
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  STEP 3/4: Deploy Backend                     ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

cd "${TERRAFORM_DIR}"

echo -e "${YELLOW}🔍 Running terraform plan...${NC}"
terraform plan -out=tfplan

echo -e "${YELLOW}🚀 Applying Terraform changes...${NC}"
terraform apply tfplan

rm -f tfplan

echo -e "${GREEN}✅ Backend deployed successfully${NC}"

cd "${PROJECT_ROOT}"

# Step 4: Upload Frontend to S3
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  STEP 4/4: Upload Frontend                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}☁️  Uploading to S3...${NC}"

# Sync files to S3
aws s3 sync "${DIST_DIR}" "s3://${S3_BUCKET}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.xml" \
    --exclude "*.txt" \
    --profile goker

# Upload HTML, JSON, XML, TXT files with no-cache
aws s3 sync "${DIST_DIR}" "s3://${S3_BUCKET}" \
    --cache-control "no-cache" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json" \
    --include "*.xml" \
    --include "*.txt" \
    --profile goker

echo -e "${GREEN}✅ Frontend uploaded to S3${NC}"

# Step 5: Invalidate CloudFront
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                CloudFront Cache Invalidation                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_ID}" \
    --paths "/*" \
    --profile goker \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ Invalidation created: ${INVALIDATION_ID}${NC}"
echo -e "${YELLOW}   (This may take a few minutes to complete)${NC}"

# Final Summary
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 Deployment Complete! 🎉                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Deployment Outputs:${NC}"
cd "${TERRAFORM_DIR}"
terraform output

echo -e "\n${GREEN}✅ Website:${NC} https://cgttaxtool.uk"
echo -e "${GREEN}✅ API:${NC} $(terraform output -raw api_gateway_url)"
echo -e "${GREEN}✅ CloudFront Invalidation:${NC} ${INVALIDATION_ID}"

echo -e "\n${YELLOW}📝 Note: CloudFront invalidation may take 5-10 minutes to propagate${NC}"
echo -e "\n${GREEN}🎉 All done!${NC}\n"
