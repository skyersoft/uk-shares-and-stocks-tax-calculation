# Output Values

output "website_bucket_name" {
  description = "Name of the S3 bucket for static website"
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "ARN of the S3 bucket for static website"
  value       = aws_s3_bucket.website.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.calculator.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.calculator.arn
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "website_url" {
  description = "Complete website URL"
  value       = "https://${var.domain_name}"
}

output "www_website_url" {
  description = "WWW website URL (redirects to apex)"
  value       = "https://www.${var.domain_name}"
}
