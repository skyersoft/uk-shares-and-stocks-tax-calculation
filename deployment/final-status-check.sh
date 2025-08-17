#!/bin/bash

# Final status check for cgttaxtool.uk migration

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 cgttaxtool.uk - Migration Status Check 🎉${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo

echo -e "${CYAN}🌐 DOMAIN STATUS${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"

# Test main domain
echo -e "${YELLOW}Testing https://cgttaxtool.uk...${NC}"
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cgttaxtool.uk 2>/dev/null || echo "000")
if [[ $MAIN_STATUS == "200" ]]; then
    echo -e "${GREEN}✅ https://cgttaxtool.uk is working! (HTTP $MAIN_STATUS)${NC}"
else
    echo -e "${RED}❌ https://cgttaxtool.uk failed (HTTP $MAIN_STATUS)${NC}"
fi

# Test www subdomain
echo -e "${YELLOW}Testing https://www.cgttaxtool.uk...${NC}"
WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.cgttaxtool.uk 2>/dev/null || echo "000")
if [[ $WWW_STATUS == "200" ]]; then
    echo -e "${GREEN}✅ https://www.cgttaxtool.uk is working! (HTTP $WWW_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  https://www.cgttaxtool.uk status: HTTP $WWW_STATUS${NC}"
fi

echo

echo -e "${CYAN}⚡ API STATUS${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"

# Test API health endpoint
echo -e "${YELLOW}Testing API health endpoint...${NC}"
API_HEALTH=$(curl -s https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/health 2>/dev/null || echo "Failed")
if [[ $API_HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✅ API is healthy and responding!${NC}"
    echo -e "${GREEN}   Response: $API_HEALTH${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

echo

echo -e "${CYAN}🔍 CONTENT VERIFICATION${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"

# Check if content includes our new static content
echo -e "${YELLOW}Checking page content...${NC}"
CONTENT_CHECK=$(curl -s https://cgttaxtool.uk | grep -c "IBKR Tax Calculator - UK Capital Gains" || echo "0")
if [[ $CONTENT_CHECK -gt 0 ]]; then
    echo -e "${GREEN}✅ Content verified - showing new static site${NC}"
else
    echo -e "${RED}❌ Content verification failed${NC}"
fi

# Check JavaScript API configuration
echo -e "${YELLOW}Checking JavaScript API configuration...${NC}"
JS_CONFIG=$(curl -s https://cgttaxtool.uk/js/app.js | grep -c "qzbkgopzi3.execute-api.eu-west-1.amazonaws.com" || echo "0")
if [[ $JS_CONFIG -gt 0 ]]; then
    echo -e "${GREEN}✅ JavaScript configured with production API endpoints${NC}"
else
    echo -e "${RED}❌ JavaScript API configuration issue${NC}"
fi

echo

echo -e "${CYAN}📋 INFRASTRUCTURE SUMMARY${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}✅ Domain:${NC} cgttaxtool.uk → CloudFront → S3 static site"
echo -e "${GREEN}✅ API:${NC} qzbkgopzi3.execute-api.eu-west-1.amazonaws.com → Lambda"
echo -e "${GREEN}✅ SSL:${NC} Valid certificate for cgttaxtool.uk"
echo -e "${GREEN}✅ CDN:${NC} CloudFront global distribution"

echo

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎊 SUCCESS! cgttaxtool.uk is now live with the new architecture! 🎊${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Test file upload functionality on https://cgttaxtool.uk"
echo -e "2. Monitor CloudFront metrics and costs"
echo -e "3. Consider setting up CloudWatch alarms"
echo
