#!/bin/bash

# Setup custom domain for IBKR Tax Calculator
# This script sets up cgttaxtool.uk to point to the API Gateway

set -e

DOMAIN_NAME="cgttaxtool.uk"
API_ID="qzbkgopzi3"
STAGE="prod"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:286154443186:certificate/46f953d2-58f4-42c3-b63f-7c384ef7f0ba"
HOSTED_ZONE_ID="Z091347333W0ZM3HD49Q2"
REGION="eu-west-1"
PROFILE="goker"

echo "🔧 Setting up custom domain for IBKR Tax Calculator..."
echo "Domain: $DOMAIN_NAME"
echo "API Gateway ID: $API_ID"
echo "Region: $REGION"
echo ""

# Wait for certificate validation
echo "⏳ Waiting for SSL certificate validation..."
aws acm wait certificate-validated \
    --certificate-arn $CERTIFICATE_ARN \
    --region us-east-1 \
    --profile $PROFILE

echo "✅ SSL certificate validated!"

# Create custom domain name in API Gateway
echo "🌐 Creating custom domain name in API Gateway..."
DOMAIN_NAME_RESULT=$(aws apigateway create-domain-name \
    --domain-name $DOMAIN_NAME \
    --certificate-arn $CERTIFICATE_ARN \
    --endpoint-configuration types=REGIONAL \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "Domain may already exist")

if [[ $DOMAIN_NAME_RESULT == *"Domain may already exist"* ]]; then
    echo "ℹ️  Custom domain may already exist, getting existing configuration..."
    DOMAIN_NAME_RESULT=$(aws apigateway get-domain-name \
        --domain-name $DOMAIN_NAME \
        --region $REGION \
        --profile $PROFILE)
fi

# Extract the regional domain name for Route 53
REGIONAL_DOMAIN_NAME=$(echo $DOMAIN_NAME_RESULT | jq -r '.regionalDomainName')
REGIONAL_HOSTED_ZONE_ID=$(echo $DOMAIN_NAME_RESULT | jq -r '.regionalHostedZoneId')

echo "Regional Domain Name: $REGIONAL_DOMAIN_NAME"
echo "Regional Hosted Zone ID: $REGIONAL_HOSTED_ZONE_ID"

# Create base path mapping
echo "🔗 Creating base path mapping..."
aws apigateway create-base-path-mapping \
    --domain-name $DOMAIN_NAME \
    --rest-api-id $API_ID \
    --stage $STAGE \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "Base path mapping may already exist"

# Create Route 53 records
echo "📍 Creating Route 53 records..."

# Create A record for root domain
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "{
        \"Changes\": [
            {
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$DOMAIN_NAME\",
                    \"Type\": \"A\",
                    \"AliasTarget\": {
                        \"DNSName\": \"$REGIONAL_DOMAIN_NAME\",
                        \"EvaluateTargetHealth\": false,
                        \"HostedZoneId\": \"$REGIONAL_HOSTED_ZONE_ID\"
                    }
                }
            }
        ]
    }" \
    --profile $PROFILE

# Create A record for www subdomain
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "{
        \"Changes\": [
            {
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"www.$DOMAIN_NAME\",
                    \"Type\": \"A\",
                    \"AliasTarget\": {
                        \"DNSName\": \"$REGIONAL_DOMAIN_NAME\",
                        \"EvaluateTargetHealth\": false,
                        \"HostedZoneId\": \"$REGIONAL_HOSTED_ZONE_ID\"
                    }
                }
            }
        ]
    }" \
    --profile $PROFILE

echo ""
echo "🎉 Custom domain setup complete!"
echo ""
echo "Your application will be available at:"
echo "  https://$DOMAIN_NAME"
echo "  https://www.$DOMAIN_NAME"
echo ""
echo "📝 Note: DNS propagation may take a few minutes."
echo "📝 ads.txt will be available at: https://$DOMAIN_NAME/ads.txt"
echo ""
echo "🧪 Test your setup:"
echo "  curl -I https://$DOMAIN_NAME"
echo "  curl https://$DOMAIN_NAME/ads.txt"
