# Production Environment Configuration

region           = "us-east-1"
aws_profile      = "goker"
environment      = "production"
project_name     = "ibkr-tax-calculator"
domain_name      = "cgttaxtool.uk"
certificate_arn  = "arn:aws:acm:us-east-1:286154443186:certificate/46f953d2-58f4-42c3-b63f-7c384ef7f0ba"
lambda_runtime   = "python3.10"
lambda_timeout   = 300
lambda_memory_size = 1024
lambda_zip_path  = "../../lambda-deployment.zip"
