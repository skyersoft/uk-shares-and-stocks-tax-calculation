# Input Variables

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use"
  type        = string
  default     = "goker"
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ibkr-tax-calculator"
}

variable "domain_name" {
  description = "Custom domain name for the website"
  type        = string
  default     = "cgttaxtool.uk"
}

variable "certificate_arn" {
  description = "ARN of the ACM SSL certificate"
  type        = string
  default     = "arn:aws:acm:us-east-1:286154443186:certificate/46f953d2-58f4-42c3-b63f-7c384ef7f0ba"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.10"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 1024
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment ZIP file"
  type        = string
  default     = "../../lambda-deployment.zip"
}
