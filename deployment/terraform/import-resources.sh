#!/bin/bash

# Import existing AWS resources into Terraform state
# This prevents Terraform from trying to recreate existing resources

set -e

cd "$(dirname "$0")"

echo "🔄 Importing existing AWS resources into Terraform state..."
echo ""

# S3 Bucket
echo "📦 Importing S3 bucket..."
terraform import aws_s3_bucket.website ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo || echo "Already imported or failed"

# Lambda Function
echo "⚡ Importing Lambda function..."
terraform import aws_lambda_function.calculator ibkr-tax-calculator-prod-us-east-1 || echo "Already imported or failed"

# IAM Role
echo "🔐 Importing IAM role..."
terraform import aws_iam_role.lambda_execution ibkr-tax-calculator-lambda-role-us-east-1 || echo "Already imported or failed"

# API Gateway REST API
echo "🌐 Importing API Gateway..."
terraform import aws_api_gateway_rest_api.main d1tr8kb7oh || echo "Already imported or failed"

# CloudFront Distribution
echo "☁️  Importing CloudFront distribution..."
terraform import aws_cloudfront_distribution.cdn E3CPZK9XL7GR6Q || echo "Already imported or failed"

echo ""
echo "✅ Import process complete!"
echo ""
echo "⚠️  Note: Not all resources can be easily imported. You may need to:"
echo "   1. Run 'terraform plan' to see what still needs to be created"
echo "   2. Manually import additional resources if needed"
echo "   3. Or allow Terraform to create missing sub-resources (safe for most)"
