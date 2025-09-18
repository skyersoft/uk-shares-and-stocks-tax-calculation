#!/bin/bash

# Step 4: Update UI with LocalStack API Gateway URL

set -e

# Configuration
API_ID_FILE=".localstack-api-id"
APP_JS_FILE="static/js/app.js"
STAGE_NAME="prod"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating UI with LocalStack API Gateway URL...${NC}"

if [ ! -f ${API_ID_FILE} ]; then
    echo -e "${RED}API ID file not found: ${API_ID_FILE}${NC}"
    exit 1
fi

API_ID=$(cat ${API_ID_FILE})
API_URL="http://localhost:4566/restapis/${API_ID}/${STAGE_NAME}/_user_request_"

echo -e "${GREEN}API Gateway URL: ${API_URL}${NC}"

# Create a temporary file
TMP_JS_FILE=$(mktemp)

# Replace placeholder with actual URL
sed "s|__API_GATEWAY_URL__|${API_URL}|g" "${APP_JS_FILE}" > "${TMP_JS_FILE}"

# Overwrite the original file
mv "${TMP_JS_FILE}" "${APP_JS_FILE}"

echo -e "${YELLOW}UI updated successfully.${NC}"
