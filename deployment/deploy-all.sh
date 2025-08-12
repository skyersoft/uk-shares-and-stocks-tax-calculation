#!/bin/bash

# Complete deployment script - runs all deployment steps
# This is the main script that orchestrates the entire deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 IBKR Tax Calculator Deployment              ║"
echo "║                     Complete Deployment                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}🚀 Starting complete deployment process...${NC}"

# Check if we're in the right directory
if [ ! -f "deployment/01-package.sh" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory.${NC}"
    exit 1
fi

# Make all scripts executable
echo -e "${YELLOW}🔧 Making deployment scripts executable...${NC}"
chmod +x deployment/01-package.sh
chmod +x deployment/02-deploy-infrastructure.sh
chmod +x deployment/03-deploy-code.sh
chmod +x deployment/04-test-deployment.sh

# Step 1: Package the application
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                           STEP 1/4                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
./deployment/01-package.sh

# Step 2: Deploy infrastructure
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                           STEP 2/4                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
./deployment/02-deploy-infrastructure.sh

# Step 3: Deploy code
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                           STEP 3/4                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
./deployment/03-deploy-code.sh

# Step 4: Test deployment
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                           STEP 4/4                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
./deployment/04-test-deployment.sh

# Final success message
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 DEPLOYMENT COMPLETE! 🎉                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

# Load final outputs
if [ -f "deployment/stack-outputs.env" ]; then
    source deployment/stack-outputs.env
    echo -e "\n${GREEN}🌐 Your IBKR Tax Calculator is now live at:${NC}"
    echo -e "${GREEN}   ${API_URL}${NC}"
    
    echo -e "\n${YELLOW}📋 Deployment Summary:${NC}"
    echo -e "${YELLOW}   Project: ${PROJECT_NAME}${NC}"
    echo -e "${YELLOW}   Region: ${REGION}${NC}"
    echo -e "${YELLOW}   Lambda Function: ${LAMBDA_NAME}${NC}"
    echo -e "${YELLOW}   API Gateway: ${API_URL}${NC}"
    
    echo -e "\n${YELLOW}💰 Monetization Setup (Next Steps):${NC}"
    echo -e "${YELLOW}   1. Apply for Google AdSense at: https://www.google.com/adsense/${NC}"
    echo -e "${YELLOW}   2. Join Amazon Associates at: https://affiliate-program.amazon.com/${NC}"
    echo -e "${YELLOW}   3. Replace placeholder IDs in template files${NC}"
    echo -e "${YELLOW}   4. Redeploy with: ./deployment/03-deploy-code.sh${NC}"
    
    echo -e "\n${YELLOW}📈 Marketing Tips:${NC}"
    echo -e "${YELLOW}   • Target keywords: 'UK tax calculator', 'IBKR tax'${NC}"
    echo -e "${YELLOW}   • Share on r/UKPersonalFinance, LinkedIn${NC}"
    echo -e "${YELLOW}   • Create content during tax season (Jan-Apr)${NC}"
    echo -e "${YELLOW}   • Set up Google Analytics for tracking${NC}"
    
    echo -e "\n${GREEN}💡 Revenue Potential: £1,000-5,000+ annually${NC}"
    echo -e "${GREEN}💸 AWS Costs: FREE for 12 months, then ~£15/month${NC}"
    
else
    echo -e "${RED}❌ Could not load deployment outputs${NC}"
fi

echo -e "\n${GREEN}✨ Happy calculating! ✨${NC}"
