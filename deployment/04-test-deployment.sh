#!/bin/bash

# Step 4: Test the deployed application
# This script runs comprehensive tests on the deployed application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Step 4: Testing deployed application...${NC}"

# Check if stack outputs exist
if [ ! -f "deployment/stack-outputs.env" ]; then
    echo -e "${RED}❌ Stack outputs not found. Please run deployment steps first.${NC}"
    exit 1
fi

# Load stack outputs
source deployment/stack-outputs.env

echo -e "${GREEN}📋 Testing application at: ${API_URL}${NC}"

# Test function to make HTTP requests
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -e "${YELLOW}🔍 Testing: ${description}${NC}"
    
    # Make request and capture response
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "${API_URL}${endpoint}")
    
    # Extract status code
    status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Extract body
    body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}   ✅ ${description} - Status: ${status_code}${NC}"
        return 0
    else
        echo -e "${RED}   ❌ ${description} - Expected: ${expected_status}, Got: ${status_code}${NC}"
        echo -e "${RED}   Response preview: ${body:0:100}...${NC}"
        return 1
    fi
}

# Test Lambda function directly
test_lambda_function() {
    echo -e "${YELLOW}🔍 Testing Lambda function directly...${NC}"
    
    # Test direct invocation
    aws lambda invoke \
        --function-name $LAMBDA_NAME \
        --payload '{"httpMethod":"GET","path":"/","headers":{},"queryStringParameters":null,"body":null}' \
        --region $REGION \
        --profile $AWS_PROFILE \
        lambda-test-response.json \
        --output text > /dev/null
    
    if [ -f "lambda-test-response.json" ]; then
        status_code=$(cat lambda-test-response.json | python -c "import sys, json; print(json.load(sys.stdin).get('statusCode', 'unknown'))" 2>/dev/null || echo "unknown")
        if [ "$status_code" = "200" ]; then
            echo -e "${GREEN}   ✅ Lambda direct invocation - Status: ${status_code}${NC}"
            rm -f lambda-test-response.json
            return 0
        else
            echo -e "${RED}   ❌ Lambda direct invocation - Status: ${status_code}${NC}"
            rm -f lambda-test-response.json
            return 1
        fi
    else
        echo -e "${RED}   ❌ Lambda direct invocation failed${NC}"
        return 1
    fi
}

# Run tests
echo -e "${GREEN}🚀 Starting comprehensive tests...${NC}"

# Initialize test counters
total_tests=0
passed_tests=0

# Test 1: Lambda function direct invocation
total_tests=$((total_tests + 1))
if test_lambda_function; then
    passed_tests=$((passed_tests + 1))
fi

# Test 2: Landing page
total_tests=$((total_tests + 1))
if test_endpoint "/" "200" "Landing page"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 3: About page
total_tests=$((total_tests + 1))
if test_endpoint "/about" "200" "About page"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 4: Privacy page
total_tests=$((total_tests + 1))
if test_endpoint "/privacy" "200" "Privacy page"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 5: Terms page
total_tests=$((total_tests + 1))
if test_endpoint "/terms" "200" "Terms page"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 6: 404 handling
total_tests=$((total_tests + 1))
if test_endpoint "/nonexistent" "404" "404 error handling"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 7: CORS preflight
total_tests=$((total_tests + 1))
echo -e "${YELLOW}🔍 Testing: CORS preflight${NC}"
cors_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X OPTIONS "${API_URL}/")
cors_status=$(echo $cors_response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
if [ "$cors_status" = "200" ]; then
    echo -e "${GREEN}   ✅ CORS preflight - Status: ${cors_status}${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}   ❌ CORS preflight - Status: ${cors_status}${NC}"
fi

# Test results summary
echo -e "\n${GREEN}📊 Test Results Summary:${NC}"
echo -e "${GREEN}   Total tests: ${total_tests}${NC}"
echo -e "${GREEN}   Passed: ${passed_tests}${NC}"
echo -e "${GREEN}   Failed: $((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your application is working correctly.${NC}"
    echo -e "${GREEN}🌐 Application URL: ${API_URL}${NC}"
    echo -e "${GREEN}📱 You can now access your IBKR Tax Calculator!${NC}"
    
    # Show next steps
    echo -e "\n${YELLOW}📋 Next Steps:${NC}"
    echo -e "${YELLOW}1. Set up Google AdSense and replace YOUR_ADSENSE_ID in templates${NC}"
    echo -e "${YELLOW}2. Set up Amazon Associates and replace affiliate links${NC}"
    echo -e "${YELLOW}3. Configure a custom domain (optional)${NC}"
    echo -e "${YELLOW}4. Set up monitoring and alerts${NC}"
    echo -e "${YELLOW}5. Test with real CSV data${NC}"
    
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the errors above.${NC}"
    echo -e "${RED}💡 Try running the deployment steps again or check AWS CloudWatch logs.${NC}"
    exit 1
fi
