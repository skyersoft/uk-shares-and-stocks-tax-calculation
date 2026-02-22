# CloudFront Function for www redirect
resource "aws_cloudfront_function" "www_redirect" {
  name    = "ibkr-www-redirect-terraform"
  runtime = "cloudfront-js-1.0"
  comment = "Redirect www to apex domain"
  publish = true

  code = <<-EOT
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  var apex = '${var.domain_name}';
  
  // If host starts with www. and matches apex after stripping
  if (host === 'www.' + apex) {
    var redirectUrl = 'https://' + apex + request.uri;
    if (request.querystring && request.querystring.length > 0) {
      redirectUrl += '?' + request.querystring;
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: redirectUrl } }
    };
  }
  return request; // no change
}
EOT
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "IBKR Tax Calculator - ${var.domain_name}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  aliases = [
    var.domain_name,
    "www.${var.domain_name}"
  ]

  # S3 Origin (primary)
  origin {
    origin_id   = "S3Origin"
    domain_name = aws_s3_bucket_website_configuration.website.website_endpoint

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # S3 Origin (backup)
  origin {
    origin_id   = "S3OriginBackup"
    domain_name = aws_s3_bucket_website_configuration.website.website_endpoint

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # SPA Routing Fallback
  custom_error_response {
    error_code            = 403
    response_code         = 200
    error_caching_min_ttl = 300
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    error_caching_min_ttl = 300
    response_page_path    = "/index.html"
  }

  # API Gateway Origin
  origin {
    origin_id   = "APIGateway"
    domain_name = "${aws_api_gateway_rest_api.main.id}.execute-api.${var.region}.amazonaws.com"

    custom_origin_config {
      http_port              = 443
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Origin Group for S3 failover
  origin_group {
    origin_id = "S3OriginGroup"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3Origin"
    }

    member {
      origin_id = "S3OriginBackup"
    }
  }

  # Default cache behavior (S3 static files)
  default_cache_behavior {
    target_origin_id       = "S3OriginGroup"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingOptimized
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # SimpleCORS

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.www_redirect.arn
    }
  }

  # API Gateway cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prod/*"
    target_origin_id       = "APIGateway"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingOptimized
    origin_request_policy_id   = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewer
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # SimpleCORS
  }

  # Geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project_name}-cdn"
  }
}
