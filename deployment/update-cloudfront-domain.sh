#!/bin/bash

# Update CloudFront distribution to use custom domain cgttaxtool.uk

set -e

DISTRIBUTION_ID="EDXJBUGCLRSWI"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:286154443186:certificate/46f953d2-58f4-42c3-b63f-7c384ef7f0ba"
DOMAIN="cgttaxtool.uk"
AWS_PROFILE="goker"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🌐 Updating CloudFront distribution for custom domain...${NC}"

# Get current distribution config
echo -e "${YELLOW}📋 Getting current distribution configuration...${NC}"
aws cloudfront get-distribution --id $DISTRIBUTION_ID --profile $AWS_PROFILE > /tmp/current-dist.json

# Extract ETag for update
ETAG=$(jq -r '.ETag' /tmp/current-dist.json)
echo -e "${YELLOW}📄 Current ETag: $ETAG${NC}"

# Update the distribution config with custom domain and SSL
echo -e "${YELLOW}🔧 Updating distribution configuration...${NC}"
jq --arg domain "$DOMAIN" --arg cert "$CERTIFICATE_ARN" '
.Distribution.DistributionConfig + {
  "Aliases": {
    "Quantity": 2,
    "Items": [$domain, ("www." + $domain)]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": $cert,
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "CertificateSource": "acm"
  }
}' /tmp/current-dist.json > /tmp/updated-dist.json

# Apply the update
echo -e "${YELLOW}🚀 Applying CloudFront distribution update...${NC}"
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file:///tmp/updated-dist.json \
    --if-match $ETAG \
    --profile $AWS_PROFILE > /tmp/update-result.json

echo -e "${GREEN}✅ CloudFront distribution updated successfully!${NC}"
echo -e "${GREEN}🌐 Domain: https://$DOMAIN${NC}"
echo -e "${GREEN}📝 Note: CloudFront updates can take 10-15 minutes to propagate globally${NC}"

# Clean up temp files
rm -f /tmp/current-dist.json /tmp/updated-dist.json /tmp/update-result.json

echo -e "${GREEN}🎉 Custom domain configuration complete!${NC}"
