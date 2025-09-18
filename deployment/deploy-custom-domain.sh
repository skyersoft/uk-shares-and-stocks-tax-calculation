#!/bin/bash

# Deploy Custom Domain for IBKR Tax Calculator
# This script deploys the CloudFormation template for custom domain setup

set -e

# Configuration
STACK_NAME="ibkr-tax-calculator-custom-domain"
TEMPLATE_FILE="deployment/custom-domain-cloudformation.yaml"
REGION="us-east-1"
PROFILE="goker"

# Domain configuration
DOMAIN_NAME="cgttaxtool.uk"
API_GATEWAY_ID="zncz8kmatj"
STAGE_NAME="prod"
HOSTED_ZONE_ID="Z091347333W0ZM3HD49Q2"

echo "🚀 Deploying Custom Domain for IBKR Tax Calculator"
echo "=================================================="
echo "Stack Name: $STACK_NAME"
echo "Domain: $DOMAIN_NAME"
echo "API Gateway ID: $API_GATEWAY_ID"
echo "Region: $REGION"
echo ""

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --profile $PROFILE >/dev/null 2>&1; then
    echo "📝 Stack exists, updating..."
    ACTION="update"
else
    echo "🆕 Stack doesn't exist, creating..."
    ACTION="create"
fi

# Deploy the CloudFormation stack
echo "🔧 Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        DomainName=$DOMAIN_NAME \
        ApiGatewayId=$API_GATEWAY_ID \
        ApiGatewayStageName=$STAGE_NAME \
        HostedZoneId=$HOSTED_ZONE_ID \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --profile $PROFILE

echo ""
echo "✅ Custom domain deployment completed!"

# Get stack outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $PROFILE \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "🌐 Your application is now available at:"
echo "  https://$DOMAIN_NAME"
echo "  https://www.$DOMAIN_NAME"
echo ""
echo "📝 ads.txt is available at:"
echo "  https://$DOMAIN_NAME/ads.txt"
echo ""
echo "🧪 Test your setup:"
echo "  curl -I https://$DOMAIN_NAME"
echo "  curl https://$DOMAIN_NAME/ads.txt"
echo ""
echo "⚠️  Note: DNS propagation may take a few minutes."
