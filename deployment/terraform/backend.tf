# Terraform Backend Configuration
# Using local backend initially to avoid SSO profile issues
# Can migrate to S3 backend later

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local backend for now (state file stored in this directory)
  # To migrate to S3 later, uncomment the backend block and run: terraform init -migrate-state
  # 
  # backend "s3" {
  #   bucket  = "ibkr-tax-terraform-state"
  #   key     = "prod/terraform.tfstate"
  #   region  = "us-east-1"
  #   profile = "goker"
  #   encrypt = true
  # }
}

# AWS Provider Configuration
provider "aws" {
  region  = var.region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = "ibkr-tax-calculator"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
