# 🔧 Manual AWS Setup Guide

Since the PowerUserAccess role doesn't have IAM permissions to create Lambda functions, we need to create the Lambda function manually through the AWS Console first.

## 📋 Step-by-Step Manual Setup

### 1. Create Lambda Function

1. **Go to AWS Lambda Console**: https://console.aws.amazon.com/lambda/
2. **Click "Create function"**
3. **Choose "Author from scratch"**
4. **Configure the function**:
   - **Function name**: `ibkr-tax-calculator-prod`
   - **Runtime**: `Python 3.10`
   - **Architecture**: `x86_64`
   - **Execution role**: Choose "Use an existing role" → `lambda_basic_execution`
5. **Click "Create function"**

### 2. Configure Lambda Function

1. **In the function configuration**:
   - **Memory**: 1024 MB
   - **Timeout**: 30 seconds
   - **Environment variables**: 
     - Key: `STAGE`, Value: `prod`

### 3. Create API Gateway

1. **Go to API Gateway Console**: https://console.aws.amazon.com/apigateway/
2. **Click "Create API"**
3. **Choose "REST API" → "Build"**
4. **Configure**:
   - **API name**: `ibkr-tax-calculator-api`
   - **Description**: `API for IBKR Tax Calculator`
   - **Endpoint Type**: `Regional`
5. **Click "Create API"**

### 4. Configure API Gateway

1. **Create Resource**:
   - Click "Actions" → "Create Resource"
   - **Resource Name**: `proxy`
   - **Resource Path**: `{proxy+}`
   - **Enable API Gateway CORS**: ✅
   - Click "Create Resource"

2. **Create Method for Root (/)**:
   - Select the root resource "/"
   - Click "Actions" → "Create Method"
   - Choose "ANY" from dropdown
   - **Integration type**: `Lambda Function`
   - **Use Lambda Proxy integration**: ✅
   - **Lambda Function**: `ibkr-tax-calculator-prod`
   - Click "Save"
   - Click "OK" to give API Gateway permission

3. **Create Method for Proxy**:
   - Select the `{proxy+}` resource
   - Click "Actions" → "Create Method"
   - Choose "ANY" from dropdown
   - **Integration type**: `Lambda Function`
   - **Use Lambda Proxy integration**: ✅
   - **Lambda Function**: `ibkr-tax-calculator-prod`
   - Click "Save"
   - Click "OK" to give API Gateway permission

### 5. Deploy API

1. **Click "Actions" → "Deploy API"**
2. **Deployment stage**: `[New Stage]`
3. **Stage name**: `prod`
4. **Click "Deploy"**

### 6. Get API URL

1. **In the Stages section**, click on `prod`
2. **Copy the Invoke URL** (it will look like: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`)

## 🚀 After Manual Setup

Once you've completed the manual setup above, run this command to save the configuration:

```bash
# Replace YOUR_API_URL with the actual URL from step 6
cat > deployment/stack-outputs.env << EOF
API_URL=https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod
LAMBDA_ARN=arn:aws:lambda:us-east-1:286154443186:function:ibkr-tax-calculator-prod
LAMBDA_NAME=ibkr-tax-calculator-prod
PROJECT_NAME=ibkr-tax-calculator
REGION=us-east-1
AWS_PROFILE=goker
EOF
```

Then run the code deployment:

```bash
cat > deployment/stack-outputs.env << EOF
API_URL=https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod
LAMBDA_ARN=arn:aws:lambda:us-east-1:286154443186:function:ibkr-tax-calculator-prod
LAMBDA_NAME=ibkr-tax-calculator-prod
PROJECT_NAME=ibkr-tax-calculator
REGION=us-east-1
AWS_PROFILE=goker
EOF
```

## 🧪 Test the Deployment

After deploying the code, run:

```bash
./deployment/04-test-deployment.sh
```

## 💡 Alternative: Request Admin Access

If you have admin access to the AWS account, you can:

1. **Add IAM permissions** to your PowerUserAccess role:
   - `iam:PassRole`
   - `iam:CreateRole`
   - `iam:AttachRolePolicy`

2. **Then run the automated deployment**:
   ```bash
   ./deployment/deploy-all.sh
   ```

## 🎯 Quick Manual Setup (5 minutes)

The manual setup above should take about 5 minutes and will give you a fully functional deployment that you can then update with code changes using the automated scripts.
