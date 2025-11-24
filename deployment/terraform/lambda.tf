# Lambda Function

resource "aws_lambda_function" "calculator" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-prod-${var.region}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_handler.lambda_handler"
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  description = "Main function for the IBKR Tax Calculator API"

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-lambda"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.calculator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
