# IBKR Tax Calculator - Terraform Infrastructure

This directory contains Terraform configuration for managing the AWS infrastructure.

## Architecture

- **S3 Bucket**: Static website hosting for React SPA
- **Lambda Function**: Python backend for tax calculations
- **API Gateway**: RESTful API endpoints
- **CloudFront**: CDN with custom domain (cgttaxtool.uk)
- **IAM Roles**: Lambda execution permissions

## Prerequisites

1. AWS CLI configured with `goker` profile
2. Terraform >= 1.0 installed
3. Lambda deployment package (`lambda-deployment.zip`)

## Initial Setup

```bash
# Navigate to terraform directory
cd deployment/terraform

# Initialize Terraform (downloads providers)
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan
```

## Import Existing Resources

**IMPORTANT**: Before first apply, import existing AWS resources to avoid recreation.

```bash
# Get existing resource IDs
aws cloudformation describe-stacks \
  --stack-name ibkr-tax-useast1-complete \
  --region us-east-1 \
  --profile goker

# Import S3 bucket
terraform import aws_s3_bucket.website ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo

# Import Lambda function
terraform import aws_lambda_function.calculator ibkr-tax-calculator-prod-us-east-1

# Import CloudFront distribution
terraform import aws_cloudfront_distribution.cdn E3CPZK9XL7GR6Q

# Import API Gateway REST API (get ID from CloudFormation outputs)
terraform import aws_api_gateway_rest_api.main <API_GATEWAY_ID>

# Import IAM role (if exists)
terraform import aws_iam_role.lambda_execution ibkr-tax-calculator-lambda-role-us-east-1

# Verify no changes after import
terraform plan  # Should show "No changes"
```

## Deployment

### Standard Deployment

```bash
# 1. Package Lambda code (from project root)
cd /Users/myuser/development/ibkr-tax-calculator
./deployment/01-package.sh

# 2. Apply Terraform changes
cd deployment/terraform
terraform apply

# 3. Confirm changes and type "yes"
```

### Quick Deployment (no confirmation)

```bash
terraform apply -auto-approve
```

### Lambda Code Update Only

```bash
# Update Lambda without touching other resources
terraform apply -target=aws_lambda_function.calculator
```

## State Management

State is stored in S3 bucket: `ibkr-tax-terraform-state`

- **State file**: `s3://ibkr-tax-terraform-state/prod/terraform.tfstate`
- **Encryption**: Enabled (AES256)
- **Versioning**: Enabled (30-day retention)
- **Locking**: Disabled (DynamoDB permissions issue)

**Note**: Without state locking, coordinate deployments manually to avoid conflicts.

## Rollback

```bash
# List previous Lambda versions
aws lambda list-versions-by-function \
  --function-name ibkr-tax-calculator-prod-us-east-1 \
  --profile goker

# Rollback by pointing to old deployment package
# (Keep previous lambda-deployment.zip files)
terraform apply -var="lambda_zip_path=../lambda-deployment-BACKUP.zip"
```

## CloudFront Invalidation

Terraform doesn't automatically invalidate CloudFront cache. Run manually:

```bash
aws cloudfront create-invalidation \
  --distribution-id E3CPZK9XL7GR6Q \
  --paths "/*" \
  --profile goker
```

## Troubleshooting

### State Lock Error
If you see "Error acquiring state lock", another deployment is in progress or a previous one crashed. Wait a few minutes or:

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Import Failures
If resources already exist in state:

```bash
# Remove from state
terraform state rm <RESOURCE_ADDRESS>

# Re-import
terraform import <RESOURCE_ADDRESS> <RESOURCE_ID>
```

### Drift Detection

```bash
# Check if resources changed outside Terraform
terraform plan -refresh-only
```

## Clean Up

**DANGER**: This will destroy all infrastructure!

```bash
terraform destroy
```

## Migrating from CloudFormation

1. Import all existing resources (see above)
2. Run `terraform plan` to ensure no changes
3. Delete CloudFormation stack:
```bash
aws cloudformation delete-stack \
  --stack-name ibkr-tax-useast1-complete \
  --region us-east-1 \
  --profile goker
```

## Future Enhancements

- Add staging environment (`staging.tfvars`)
- Enable DynamoDB state locking (requires IAM permissions)
- Create reusable module (`modules/serverless-app/`)
- Add automated CloudFront invalidation
