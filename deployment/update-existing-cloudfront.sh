#!/bin/bash

# Update the existing CloudFront distribution to point to the new S3 bucket

set -e

OLD_DISTRIBUTION_ID="E1C9TUZY9MR8TB"
NEW_S3_DOMAIN="ibkr-tax-calculator-static-site-286154443186.s3-website-eu-west-1.amazonaws.com"
AWS_PROFILE="goker"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Updating existing CloudFront distribution to new S3 bucket...${NC}"

# Get current distribution config
echo -e "${YELLOW}📋 Getting current distribution configuration...${NC}"
aws cloudfront get-distribution --id $OLD_DISTRIBUTION_ID --profile $AWS_PROFILE > /tmp/old-dist.json

# Extract ETag for update
ETAG=$(jq -r '.ETag' /tmp/old-dist.json)
echo -e "${YELLOW}📄 Current ETag: $ETAG${NC}"

# Update the distribution config to use new S3 bucket
echo -e "${YELLOW}🔧 Updating origin to new S3 bucket...${NC}"
jq --arg s3domain "$NEW_S3_DOMAIN" '
.Distribution.DistributionConfig.Origins.Items[0].DomainName = $s3domain
' /tmp/old-dist.json > /tmp/updated-old-dist.json

# Extract just the DistributionConfig for the update
jq '.Distribution.DistributionConfig' /tmp/updated-old-dist.json > /tmp/config-only.json

# Apply the update
echo -e "${YELLOW}🚀 Applying CloudFront distribution update...${NC}"
aws cloudfront update-distribution \
    --id $OLD_DISTRIBUTION_ID \
    --distribution-config file:///tmp/config-only.json \
    --if-match $ETAG \
    --profile $AWS_PROFILE > /tmp/update-result.json

echo -e "${GREEN}✅ CloudFront distribution updated successfully!${NC}"
echo -e "${GREEN}🌐 Domain: https://cgttaxtool.uk${NC}"
echo -e "${GREEN}📝 Note: CloudFront updates can take 10-15 minutes to propagate globally${NC}"

# Clean up temp files
rm -f /tmp/old-dist.json /tmp/updated-old-dist.json /tmp/config-only.json /tmp/update-result.json

echo -e "${GREEN}🎉 Custom domain now points to new static site!${NC}"
