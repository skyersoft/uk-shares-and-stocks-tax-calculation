/**
 * Epic 8: Deployment & Migration
 * Advanced CI/CD Pipeline Configuration for Production Deployment
 */

// GitHub Actions Workflow
export const githubActionsWorkflow = `
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.9'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run unit tests
      run: npm run test:unit:ci
      
    - name: Run quality analysis
      run: npm run test:quality
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        token: \${{ secrets.CODECOV_TOKEN }}
        files: ./coverage/lcov.info
        
    - name: Build application
      run: npm run build:spa
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-\${{ matrix.node-version }}
        path: frontend/dist/
        retention-days: 7

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        
    - name: Run OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'https://staging.ibkr-tax-calculator.com'

  deploy-staging:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        
    - name: Deploy to staging
      run: |
        npm ci
        npm run build:spa
        aws s3 sync frontend/dist/ s3://staging-ibkr-tax-calculator --delete
        aws cloudfront create-invalidation --distribution-id \${{ secrets.STAGING_CLOUDFRONT_ID }} --paths "/*"

  deploy-production:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        
    - name: Blue-Green Deployment
      run: |
        npm ci
        npm run build:spa
        
        # Deploy to green environment
        aws s3 sync frontend/dist/ s3://green-ibkr-tax-calculator --delete
        
        # Run smoke tests
        npm run test:smoke -- --baseUrl=https://green.ibkr-tax-calculator.com
        
        # Switch traffic to green
        aws s3 sync s3://green-ibkr-tax-calculator/ s3://prod-ibkr-tax-calculator --delete
        aws cloudfront create-invalidation --distribution-id \${{ secrets.PROD_CLOUDFRONT_ID }} --paths "/*"
        
        # Archive blue for rollback
        aws s3 sync s3://prod-ibkr-tax-calculator/ s3://blue-ibkr-tax-calculator --delete

  performance-test:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Lighthouse CI
      run: npm install -g @lhci/cli@0.12.x
      
    - name: Run Lighthouse CI
      run: |
        lhci autorun --upload.target=temporary-public-storage
      env:
        LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}
`;

// Docker Configuration
export const dockerConfig = `
# Multi-stage Docker build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build:spa

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

// Infrastructure as Code (Terraform)
export const terraformConfig = `
# AWS Infrastructure for IBKR Tax Calculator
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "ibkr-tax-calculator-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "IBKR Tax Calculator"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# S3 Buckets for hosting
resource "aws_s3_bucket" "production" {
  bucket = "prod-ibkr-tax-calculator"
}

resource "aws_s3_bucket" "staging" {
  bucket = "staging-ibkr-tax-calculator"
}

resource "aws_s3_bucket" "blue" {
  bucket = "blue-ibkr-tax-calculator"
}

resource "aws_s3_bucket" "green" {
  bucket = "green-ibkr-tax-calculator"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "production" {
  origin {
    domain_name = aws_s3_bucket.production.bucket_regional_domain_name
    origin_id   = "S3-prod-ibkr-tax-calculator"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.production.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  aliases = ["ibkr-tax-calculator.com", "www.ibkr-tax-calculator.com"]
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-prod-ibkr-tax-calculator"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.ssl_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = aws_wafv2_web_acl.security.arn
}

# WAF for security
resource "aws_wafv2_web_acl" "security" {
  name  = "ibkr-tax-calculator-security"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
}

# Monitoring and Alerting
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "IBKR-Tax-Calculator-Production"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.production.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "OriginLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Outputs
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.production.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for production"
  value       = aws_s3_bucket.production.bucket
}
`;

// Monitoring and Alerting Configuration
export const monitoringConfig = {
  datadog: {
    config: `
      # Datadog configuration for application monitoring
      DD_API_KEY=\${DATADOG_API_KEY}
      DD_SITE=datadoghq.com
      DD_SERVICE=ibkr-tax-calculator
      DD_ENV=production
      DD_VERSION=\${GITHUB_SHA}
      DD_LOGS_ENABLED=true
      DD_APM_ENABLED=true
      DD_PROFILING_ENABLED=true
    `,
    dashboard: {
      title: "IBKR Tax Calculator - Production",
      widgets: [
        {
          type: "timeseries",
          title: "Request Rate",
          requests: [
            {
              q: "sum:http.requests{service:ibkr-tax-calculator,env:production}.as_rate()",
              display_type: "line"
            }
          ]
        },
        {
          type: "timeseries", 
          title: "Error Rate",
          requests: [
            {
              q: "sum:http.errors{service:ibkr-tax-calculator,env:production}.as_rate()",
              display_type: "line"
            }
          ]
        },
        {
          type: "timeseries",
          title: "Response Time",
          requests: [
            {
              q: "avg:http.response_time{service:ibkr-tax-calculator,env:production}",
              display_type: "line"
            }
          ]
        }
      ]
    }
  },
  
  sentry: {
    config: `
      SENTRY_DSN=\${SENTRY_DSN}
      SENTRY_ENVIRONMENT=production
      SENTRY_DEBUG=false
      SENTRY_SAMPLE_RATE=0.1
      SENTRY_TRACES_SAMPLE_RATE=0.1
    `,
    alerts: [
      {
        name: "High Error Rate",
        conditions: [
          {
            name: "Error rate exceeds 5%",
            query: "event.type:error",
            timeWindow: "1m",
            threshold: 0.05
          }
        ]
      },
      {
        name: "Performance Degradation", 
        conditions: [
          {
            name: "P95 response time > 2s",
            query: "transaction.op:pageload",
            timeWindow: "5m",
            threshold: 2000
          }
        ]
      }
    ]
  }
};

// Database Migration Scripts
export const migrationScripts = {
  // For future database features
  structure: `
    -- User preferences and calculation history
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255) UNIQUE NOT NULL,
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS calculation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255) REFERENCES user_sessions(session_id),
      file_name VARCHAR(255),
      file_size INTEGER,
      tax_year INTEGER,
      analysis_type VARCHAR(50),
      results JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Indexes for performance
    CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
    CREATE INDEX idx_calculation_history_session_id ON calculation_history(session_id);
    CREATE INDEX idx_calculation_history_created_at ON calculation_history(created_at);
  `,
  
  rollback: `
    DROP INDEX IF EXISTS idx_calculation_history_created_at;
    DROP INDEX IF EXISTS idx_calculation_history_session_id;
    DROP INDEX IF EXISTS idx_user_sessions_session_id;
    DROP TABLE IF EXISTS calculation_history;
    DROP TABLE IF EXISTS user_sessions;
  `
};

// Backup and Recovery
export const backupConfig = {
  s3Backup: `
    #!/bin/bash
    # S3 backup script for static assets and configurations
    
    DATE=$(date +%Y-%m-%d_%H-%M-%S)
    BACKUP_NAME="ibkr-tax-calculator-backup-$DATE"
    
    # Create backup directory
    mkdir -p /tmp/backups/$BACKUP_NAME
    
    # Backup S3 contents
    aws s3 sync s3://prod-ibkr-tax-calculator /tmp/backups/$BACKUP_NAME/prod --delete
    aws s3 sync s3://staging-ibkr-tax-calculator /tmp/backups/$BACKUP_NAME/staging --delete
    
    # Backup configuration files
    cp -r /app/config /tmp/backups/$BACKUP_NAME/
    
    # Create compressed archive
    cd /tmp/backups
    tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
    
    # Upload backup to long-term storage
    aws s3 cp $BACKUP_NAME.tar.gz s3://ibkr-tax-calculator-backups/
    
    # Cleanup local files
    rm -rf /tmp/backups/$BACKUP_NAME
    rm -f /tmp/backups/$BACKUP_NAME.tar.gz
    
    echo "Backup completed: $BACKUP_NAME"
  `,
  
  restoration: `
    #!/bin/bash
    # Restoration script
    
    BACKUP_NAME=$1
    if [ -z "$BACKUP_NAME" ]; then
      echo "Usage: $0 <backup-name>"
      exit 1
    fi
    
    # Download backup
    aws s3 cp s3://ibkr-tax-calculator-backups/$BACKUP_NAME.tar.gz /tmp/
    
    # Extract backup
    cd /tmp
    tar -xzf $BACKUP_NAME.tar.gz
    
    # Restore production (with confirmation)
    read -p "Are you sure you want to restore production? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      aws s3 sync /tmp/$BACKUP_NAME/prod s3://prod-ibkr-tax-calculator --delete
      aws cloudfront create-invalidation --distribution-id $PROD_CLOUDFRONT_ID --paths "/*"
      echo "Production restored from backup: $BACKUP_NAME"
    fi
    
    # Cleanup
    rm -rf /tmp/$BACKUP_NAME*
  `
};

export default {
  githubActionsWorkflow,
  dockerConfig,
  terraformConfig,
  monitoringConfig,
  migrationScripts,
  backupConfig
};