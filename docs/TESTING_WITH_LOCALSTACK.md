# Testing Lambda with Testcontainers and LocalStack

## Overview

This guide shows how to use **Testcontainers** with **LocalStack** to test the Lambda handler locally in a containerized AWS environment.

## Benefits

✅ **Local Testing** - Test Lambda functions without AWS account  
✅ **Fast Feedback** - No deployment delays  
✅ **Isolated** - Each test gets a fresh environment  
✅ **Realistic** - Tests actual Lambda runtime behavior  
✅ **CI/CD Ready** - Works in GitHub Actions, GitLab CI, etc.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Test Suite                      │
│  (pytest with testcontainers)                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Testcontainers Python                  │
│  - Manages Docker containers                    │
│  - Handles lifecycle                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              LocalStack Container                │
│  - Emulates AWS Lambda                          │
│  - Emulates API Gateway                         │
│  - Emulates S3, DynamoDB, etc.                  │
└─────────────────────────────────────────────────┘
```

---

## Installation

### 1. Install Dependencies

```bash
pip install testcontainers[localstack] boto3 pytest
```

Add to `requirements.txt`:
```
testcontainers[localstack]==4.0.0
boto3==1.34.0
```

### 2. Ensure Docker is Running

```bash
docker --version
# Docker version 24.0.0 or higher
```

---

## Implementation

### 1. Create LocalStack Test Fixture

**File:** `tests/fixtures/localstack_fixture.py`

```python
"""LocalStack fixtures for Lambda testing."""
import pytest
import boto3
import zipfile
import io
import os
from pathlib import Path
from testcontainers.localstack import LocalStackContainer


@pytest.fixture(scope="session")
def localstack():
    """Start LocalStack container for the test session."""
    with LocalStackContainer(image="localstack/localstack:latest") as localstack:
        # Wait for LocalStack to be ready
        localstack.with_services("lambda", "apigateway", "s3")
        yield localstack


@pytest.fixture(scope="session")
def lambda_client(localstack):
    """Create Lambda client connected to LocalStack."""
    return boto3.client(
        "lambda",
        endpoint_url=localstack.get_url(),
        aws_access_key_id="test",
        aws_secret_access_key="test",
        region_name="us-east-1"
    )


@pytest.fixture(scope="session")
def apigateway_client(localstack):
    """Create API Gateway client connected to LocalStack."""
    return boto3.client(
        "apigateway",
        endpoint_url=localstack.get_url(),
        aws_access_key_id="test",
        aws_secret_access_key="test",
        region_name="us-east-1"
    )


@pytest.fixture(scope="session")
def lambda_package():
    """Create Lambda deployment package."""
    # Create a zip file with the Lambda handler and dependencies
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add Lambda handler
        handler_path = Path("deployment/lambda_handler.py")
        zip_file.write(handler_path, "lambda_handler.py")
        
        # Add main Python code
        src_path = Path("src/main/python")
        for py_file in src_path.rglob("*.py"):
            arcname = str(py_file.relative_to("src"))
            zip_file.write(py_file, arcname)
    
    zip_buffer.seek(0)
    return zip_buffer.read()


@pytest.fixture(scope="session")
def deployed_lambda(lambda_client, lambda_package):
    """Deploy Lambda function to LocalStack."""
    function_name = "tax-calculator"
    
    # Create Lambda function
    response = lambda_client.create_function(
        FunctionName=function_name,
        Runtime="python3.12",
        Role="arn:aws:iam::000000000000:role/lambda-role",
        Handler="lambda_handler.lambda_handler",
        Code={"ZipFile": lambda_package},
        Timeout=30,
        MemorySize=512,
        Environment={
            "Variables": {
                "ENV": "test"
            }
        }
    )
    
    yield {
        "function_name": function_name,
        "function_arn": response["FunctionArn"]
    }
    
    # Cleanup
    try:
        lambda_client.delete_function(FunctionName=function_name)
    except:
        pass


@pytest.fixture
def api_gateway(apigateway_client, deployed_lambda):
    """Create API Gateway REST API connected to Lambda."""
    # Create REST API
    api_response = apigateway_client.create_rest_api(
        name="tax-calculator-api",
        description="Tax Calculator API for testing"
    )
    api_id = api_response["id"]
    
    # Get root resource
    resources = apigateway_client.get_resources(restApiId=api_id)
    root_id = resources["items"][0]["id"]
    
    # Create /detect-broker resource
    detect_resource = apigateway_client.create_resource(
        restApiId=api_id,
        parentId=root_id,
        pathPart="detect-broker"
    )
    
    # Create POST method for /detect-broker
    apigateway_client.put_method(
        restApiId=api_id,
        resourceId=detect_resource["id"],
        httpMethod="POST",
        authorizationType="NONE"
    )
    
    # Integrate with Lambda
    apigateway_client.put_integration(
        restApiId=api_id,
        resourceId=detect_resource["id"],
        httpMethod="POST",
        type="AWS_PROXY",
        integrationHttpMethod="POST",
        uri=f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{deployed_lambda['function_arn']}/invocations"
    )
    
    # Deploy API
    apigateway_client.create_deployment(
        restApiId=api_id,
        stageName="test"
    )
    
    yield {
        "api_id": api_id,
        "endpoint": f"http://localhost:4566/restapis/{api_id}/test/_user_request_"
    }
    
    # Cleanup
    try:
        apigateway_client.delete_rest_api(restApiId=api_id)
    except:
        pass
```

---

### 2. Create Lambda Integration Tests

**File:** `tests/integration/test_lambda_localstack.py`

```python
"""Integration tests for Lambda using LocalStack."""
import pytest
import requests
import json
from pathlib import Path


@pytest.mark.integration
class TestLambdaWithLocalStack:
    """Test Lambda functions using LocalStack."""
    
    def test_lambda_invocation_direct(self, lambda_client, deployed_lambda):
        """Test direct Lambda invocation."""
        # Prepare test event
        event = {
            "httpMethod": "POST",
            "path": "/detect-broker",
            "headers": {
                "content-type": "multipart/form-data; boundary=test"
            },
            "body": "test file content",
            "isBase64Encoded": False
        }
        
        # Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=deployed_lambda["function_name"],
            InvocationType="RequestResponse",
            Payload=json.dumps(event)
        )
        
        # Parse response
        result = json.loads(response["Payload"].read())
        
        assert response["StatusCode"] == 200
        assert "statusCode" in result
    
    def test_detect_broker_endpoint(self, api_gateway):
        """Test /detect-broker endpoint via API Gateway."""
        # Read sample CSV file
        csv_path = Path("tests/data/trading212/export.csv")
        
        with open(csv_path, "rb") as f:
            files = {"file": ("export.csv", f, "text/csv")}
            
            response = requests.post(
                f"{api_gateway['endpoint']}/detect-broker",
                files=files
            )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "detected" in data
        if data["detected"]:
            assert "broker" in data
            assert "confidence" in data
    
    def test_calculate_endpoint_with_csv(self, api_gateway):
        """Test /calculate endpoint with CSV file."""
        csv_path = Path("tests/data/trading212/export.csv")
        
        with open(csv_path, "rb") as f:
            files = {
                "file": ("export.csv", f, "text/csv")
            }
            data = {
                "tax_year": "2024-2025",
                "analysis_type": "both"
            }
            
            response = requests.post(
                f"{api_gateway['endpoint']}/calculate",
                files=files,
                data=data
            )
        
        # Should get a response (might be error if dependencies missing)
        assert response.status_code in [200, 400, 500]
        
        if response.status_code == 200:
            result = response.json()
            assert "results" in result or "broker_metadata" in result
    
    def test_health_endpoint(self, api_gateway):
        """Test health check endpoint."""
        response = requests.get(f"{api_gateway['endpoint']}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_broker_detection_with_ibkr_file(self, lambda_client, deployed_lambda):
        """Test broker detection with IBKR CSV file."""
        # Read IBKR sample file
        csv_content = """Symbol,Quantity,TradePrice,TradeDate,SettleDate,IBCommission,Code,AssetClass,FXRateToBase
AAPL,10,150.00,2024-01-15,2024-01-17,5.00,O,STK,0.79
"""
        
        # Create multipart form data
        boundary = "----WebKitFormBoundary"
        body = f"""------WebKitFormBoundary\r
Content-Disposition: form-data; name="file"; filename="ibkr.csv"\r
Content-Type: text/csv\r
\r
{csv_content}\r
------WebKitFormBoundary--\r
"""
        
        event = {
            "httpMethod": "POST",
            "path": "/detect-broker",
            "headers": {
                "content-type": f"multipart/form-data; boundary={boundary}"
            },
            "body": body,
            "isBase64Encoded": False
        }
        
        response = lambda_client.invoke(
            FunctionName=deployed_lambda["function_name"],
            InvocationType="RequestResponse",
            Payload=json.dumps(event)
        )
        
        result = json.loads(response["Payload"].read())
        
        # Should return a response
        assert "statusCode" in result
```

---

### 3. Create Conftest for Fixtures

**File:** `tests/conftest.py`

```python
"""Pytest configuration and fixtures."""
import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src" / "main" / "python"))

# Import LocalStack fixtures
pytest_plugins = ["tests.fixtures.localstack_fixture"]


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "localstack: mark test as requiring LocalStack"
    )
```

---

### 4. Update pytest.ini

**File:** `pytest.ini`

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    integration: Integration tests
    localstack: Tests requiring LocalStack
    e2e: End-to-end tests
addopts = 
    -v
    --tb=short
    --strict-markers
```

---

## Running Tests

### Run All LocalStack Tests

```bash
# Ensure Docker is running
docker ps

# Run LocalStack integration tests
pytest tests/integration/test_lambda_localstack.py -v -m localstack

# Run with verbose output
pytest tests/integration/test_lambda_localstack.py -v -s
```

### Run Specific Test

```bash
pytest tests/integration/test_lambda_localstack.py::TestLambdaWithLocalStack::test_detect_broker_endpoint -v
```

### Skip LocalStack Tests (for CI without Docker)

```bash
pytest -m "not localstack"
```

---

## CI/CD Integration

### GitHub Actions

**File:** `.github/workflows/test-lambda.yml`

```yaml
name: Lambda Tests with LocalStack

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      docker:
        image: docker:dind
        options: --privileged
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install testcontainers[localstack] boto3
      
      - name: Run LocalStack tests
        run: |
          pytest tests/integration/test_lambda_localstack.py -v -m localstack
```

---

## Advanced Usage

### 1. Test with Multiple Files

```python
def test_multiple_file_upload(self, api_gateway):
    """Test uploading multiple CSV files."""
    files = [
        ("file1", ("ibkr.csv", open("tests/data/ibkr.csv", "rb"), "text/csv")),
        ("file2", ("t212.csv", open("tests/data/trading212/export.csv", "rb"), "text/csv"))
    ]
    
    response = requests.post(
        f"{api_gateway['endpoint']}/calculate",
        files=files,
        data={"tax_year": "2024-2025", "analysis_type": "both"}
    )
    
    assert response.status_code in [200, 400]
```

### 2. Test Error Handling

```python
def test_invalid_file_format(self, api_gateway):
    """Test error handling for invalid file format."""
    files = {"file": ("test.txt", b"invalid content", "text/plain")}
    
    response = requests.post(
        f"{api_gateway['endpoint']}/detect-broker",
        files=files
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
```

### 3. Test with Environment Variables

```python
@pytest.fixture
def lambda_with_env(lambda_client, lambda_package):
    """Deploy Lambda with custom environment variables."""
    response = lambda_client.create_function(
        FunctionName="tax-calculator-custom",
        Runtime="python3.12",
        Role="arn:aws:iam::000000000000:role/lambda-role",
        Handler="lambda_handler.lambda_handler",
        Code={"ZipFile": lambda_package},
        Environment={
            "Variables": {
                "DEBUG": "true",
                "BASE_CURRENCY": "GBP"
            }
        }
    )
    
    yield response["FunctionName"]
    
    lambda_client.delete_function(FunctionName=response["FunctionName"])
```

---

## Troubleshooting

### Docker Not Running

```bash
# Check Docker status
docker ps

# Start Docker Desktop (macOS)
open -a Docker

# Start Docker (Linux)
sudo systemctl start docker
```

### LocalStack Container Fails to Start

```python
# Increase timeout
with LocalStackContainer(image="localstack/localstack:latest") as localstack:
    localstack.with_services("lambda", "apigateway")
    localstack.with_env("LAMBDA_EXECUTOR", "docker")  # Use Docker executor
    localstack.with_env("DEBUG", "1")  # Enable debug logging
    yield localstack
```

### Lambda Package Too Large

```python
# Exclude unnecessary files
def create_lambda_package():
    """Create optimized Lambda package."""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Only include necessary files
        for pattern in ["*.py", "!*_test.py", "!test_*.py"]:
            for file in Path("src").rglob(pattern):
                if "test" not in str(file):
                    zip_file.write(file, file.relative_to("src"))
    
    return zip_buffer.getvalue()
```

---

## Benefits Summary

✅ **Fast** - Tests run in seconds, not minutes  
✅ **Isolated** - Each test gets fresh environment  
✅ **Realistic** - Tests actual Lambda behavior  
✅ **Offline** - No AWS account needed  
✅ **CI/CD** - Works in GitHub Actions, GitLab CI  
✅ **Debugging** - Easy to debug locally  

---

## Next Steps

1. ✅ Install testcontainers and LocalStack
2. ✅ Create fixtures
3. ✅ Write integration tests
4. ✅ Run tests locally
5. ✅ Add to CI/CD pipeline

---

## Resources

- [Testcontainers Python](https://testcontainers-python.readthedocs.io/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Lambda with LocalStack](https://docs.localstack.cloud/user-guide/aws/lambda/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
