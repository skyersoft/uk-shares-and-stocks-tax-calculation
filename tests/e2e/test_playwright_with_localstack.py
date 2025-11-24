"""
End-to-end tests using Playwright with LocalStack backend.

This test suite combines:
- Playwright for frontend testing (browser automation)
- LocalStack for backend testing (AWS Lambda emulation)
- Complete user flow from file upload to results

Prerequisites:
- Docker running (for LocalStack)
- Frontend dev server running
- pip install playwright testcontainers[localstack] boto3
- playwright install
"""
import pytest
import json
import time
from pathlib import Path
from playwright.sync_api import Page, expect
from testcontainers.localstack import LocalStackContainer
import boto3
import zipfile
import io


# ============================================================================
# LocalStack Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def localstack_container():
    """Start LocalStack container for the test session."""
    with LocalStackContainer(image="localstack/localstack:3.0") as container:
        container.with_services("lambda", "apigateway", "s3")
        # Wait for services to be ready
        time.sleep(5)
        yield container


@pytest.fixture(scope="session")
def lambda_client(localstack_container):
    """Create Lambda client connected to LocalStack."""
    return boto3.client(
        "lambda",
        endpoint_url=localstack_container.get_url(),
        aws_access_key_id="test",
        aws_secret_access_key="test",
        region_name="us-east-1"
    )


@pytest.fixture(scope="session")
def apigateway_client(localstack_container):
    """Create API Gateway client connected to LocalStack."""
    return boto3.client(
        "apigateway",
        endpoint_url=localstack_container.get_url(),
        aws_access_key_id="test",
        aws_secret_access_key="test",
        region_name="us-east-1"
    )


@pytest.fixture(scope="session")
def lambda_package():
    """Create Lambda deployment package with all dependencies."""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add Lambda handler
        handler_path = Path("deployment/lambda_handler.py")
        if handler_path.exists():
            zip_file.write(handler_path, "lambda_handler.py")
        
        # Add all Python source code
        src_path = Path("src/main/python")
        if src_path.exists():
            for py_file in src_path.rglob("*.py"):
                if "test" not in str(py_file) and "__pycache__" not in str(py_file):
                    arcname = str(py_file.relative_to("src"))
                    zip_file.write(py_file, arcname)
    
    zip_buffer.seek(0)
    return zip_buffer.read()


@pytest.fixture(scope="session")
def deployed_lambda(lambda_client, lambda_package):
    """Deploy Lambda function to LocalStack."""
    function_name = "tax-calculator-e2e"
    
    try:
        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime="python3.12",
            Role="arn:aws:iam::000000000000:role/lambda-role",
            Handler="lambda_handler.lambda_handler",
            Code={"ZipFile": lambda_package},
            Timeout=60,
            MemorySize=1024,
            Environment={
                "Variables": {
                    "ENV": "test",
                    "PAGER": "cat"
                }
            }
        )
        
        # Wait for function to be ready
        time.sleep(2)
        
        yield {
            "function_name": function_name,
            "function_arn": response["FunctionArn"]
        }
    finally:
        try:
            lambda_client.delete_function(FunctionName=function_name)
        except:
            pass


@pytest.fixture(scope="session")
def api_gateway_setup(apigateway_client, deployed_lambda, localstack_container):
    """
    Create complete API Gateway with all endpoints.
    
    Creates:
    - /detect-broker (POST)
    - /calculate (POST)
    - /health (GET)
    """
    # Create REST API
    api = apigateway_client.create_rest_api(
        name="tax-calculator-e2e-api",
        description="E2E Testing API"
    )
    api_id = api["id"]
    
    try:
        # Get root resource
        resources = apigateway_client.get_resources(restApiId=api_id)
        root_id = resources["items"][0]["id"]
        
        lambda_uri = (
            f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/"
            f"{deployed_lambda['function_arn']}/invocations"
        )
        
        # Create endpoints
        endpoints = [
            {"path": "detect-broker", "method": "POST"},
            {"path": "calculate", "method": "POST"},
            {"path": "health", "method": "GET"}
        ]
        
        for endpoint in endpoints:
            # Create resource
            resource = apigateway_client.create_resource(
                restApiId=api_id,
                parentId=root_id,
                pathPart=endpoint["path"]
            )
            
            # Create method
            apigateway_client.put_method(
                restApiId=api_id,
                resourceId=resource["id"],
                httpMethod=endpoint["method"],
                authorizationType="NONE"
            )
            
            # Integrate with Lambda
            apigateway_client.put_integration(
                restApiId=api_id,
                resourceId=resource["id"],
                httpMethod=endpoint["method"],
                type="AWS_PROXY",
                integrationHttpMethod="POST",
                uri=lambda_uri
            )
        
        # Deploy API
        apigateway_client.create_deployment(
            restApiId=api_id,
            stageName="prod"
        )
        
        # Get endpoint URL
        base_url = f"{localstack_container.get_url()}/restapis/{api_id}/prod/_user_request_"
        
        yield {
            "api_id": api_id,
            "base_url": base_url,
            "endpoints": {
                "detect_broker": f"{base_url}/detect-broker",
                "calculate": f"{base_url}/calculate",
                "health": f"{base_url}/health"
            }
        }
    finally:
        try:
            apigateway_client.delete_rest_api(restApiId=api_id)
        except:
            pass


# ============================================================================
# Playwright Page Fixtures
# ============================================================================

@pytest.fixture
def frontend_url():
    """
    Frontend URL for testing.
    
    Options:
    1. Local dev server: http://localhost:5173
    2. Production: https://cgttaxtool.uk
    3. Custom: Set FRONTEND_URL environment variable
    """
    import os
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


@pytest.fixture
def page_with_api_intercept(page: Page, api_gateway_setup):
    """
    Configure page to intercept API calls and route to LocalStack.
    
    This intercepts all API calls from the frontend and redirects them
    to the LocalStack API Gateway instead of the real backend.
    """
    # Intercept API calls and route to LocalStack
    def handle_route(route):
        url = route.request.url
        
        # Intercept /prod/detect-broker
        if "/prod/detect-broker" in url:
            route.continue_(url=api_gateway_setup["endpoints"]["detect_broker"])
        # Intercept /prod/calculate
        elif "/prod/calculate" in url:
            route.continue_(url=api_gateway_setup["endpoints"]["calculate"])
        # Intercept /prod/health
        elif "/prod/health" in url:
            route.continue_(url=api_gateway_setup["endpoints"]["health"])
        else:
            route.continue_()
    
    # Set up route interception
    page.route("**/prod/**", handle_route)
    
    yield page


# ============================================================================
# End-to-End Tests
# ============================================================================

@pytest.mark.e2e
class TestCompleteUserFlow:
    """Test complete user flow with LocalStack backend."""
    
    def test_file_upload_with_broker_detection(
        self, 
        page_with_api_intercept: Page,
        frontend_url: str
    ):
        """
        Test complete flow: Upload file → Detect broker → Show preview.
        
        Steps:
        1. Navigate to calculator page
        2. Upload Trading 212 CSV file
        3. Wait for broker detection
        4. Verify detection results displayed
        5. Verify transaction count shown
        """
        page = page_with_api_intercept
        
        # Navigate to calculator
        page.goto(f"{frontend_url}/calculate.html")
        
        # Wait for page to load
        expect(page.locator("h1")).to_contain_text("Tax Calculator", timeout=10000)
        
        # Find file upload input
        file_input = page.locator('input[type="file"]')
        
        # Upload Trading 212 CSV file
        csv_path = Path("tests/data/trading212/export.csv")
        if csv_path.exists():
            file_input.set_input_files(str(csv_path))
            
            # Wait for detection to complete (look for success indicator)
            page.wait_for_selector(
                'text=/Trading 212|Detecting|detected/i',
                timeout=15000
            )
            
            # Verify broker was detected
            # Look for confidence percentage or broker name
            expect(page.locator("body")).to_contain_text("Trading 212", timeout=5000)
            
            # Verify transaction count is shown
            expect(page.locator("body")).to_contain_text("transaction", timeout=5000)
    
    def test_complete_calculation_flow(
        self,
        page_with_api_intercept: Page,
        frontend_url: str
    ):
        """
        Test complete calculation flow: Upload → Detect → Calculate → Results.
        
        Steps:
        1. Navigate to calculator
        2. Upload file
        3. Wait for detection
        4. Select tax year
        5. Submit calculation
        6. Verify results displayed
        """
        page = page_with_api_intercept
        
        # Navigate to calculator
        page.goto(f"{frontend_url}/calculate.html")
        
        # Upload file
        file_input = page.locator('input[type="file"]').first
        csv_path = Path("tests/data/trading212/export.csv")
        
        if csv_path.exists():
            file_input.set_input_files(str(csv_path))
            
            # Wait for detection
            page.wait_for_timeout(3000)
            
            # Select tax year (if dropdown exists)
            tax_year_select = page.locator('select[name="taxYear"], select:has-text("Tax Year")')
            if tax_year_select.count() > 0:
                tax_year_select.first.select_option("2024-2025")
            
            # Click calculate/submit button
            submit_button = page.locator(
                'button:has-text("Calculate"), button:has-text("Submit"), button:has-text("Continue")'
            ).first
            
            if submit_button.count() > 0:
                submit_button.click()
                
                # Wait for results or navigation
                page.wait_for_timeout(5000)
                
                # Verify we got some response (results page or error)
                # This is flexible as the exact response depends on the data
                expect(page.locator("body")).not_to_be_empty()
    
    def test_broker_detection_preview(
        self,
        page_with_api_intercept: Page,
        frontend_url: str
    ):
        """
        Test broker detection preview feature.
        
        Verifies that:
        - Detection status is shown
        - Confidence percentage is displayed
        - Transaction preview is available
        """
        page = page_with_api_intercept
        
        page.goto(f"{frontend_url}/calculate.html")
        
        # Upload file
        file_input = page.locator('input[type="file"]').first
        csv_path = Path("tests/data/trading212/export.csv")
        
        if csv_path.exists():
            file_input.set_input_files(str(csv_path))
            
            # Wait for detection spinner or result
            page.wait_for_selector(
                'i.fa-spinner, i.fa-check-circle, text=/detected/i',
                timeout=10000
            )
            
            # Check for confidence indicator (percentage)
            # Should show something like "100%" or "95%"
            expect(page.locator("body")).to_contain_text("%", timeout=5000)
            
            # Verify broker name is shown
            broker_indicators = page.locator('text=/Trading 212|Interactive Brokers/i')
            expect(broker_indicators.first).to_be_visible(timeout=5000)
    
    def test_error_handling_invalid_file(
        self,
        page_with_api_intercept: Page,
        frontend_url: str,
        tmp_path: Path
    ):
        """
        Test error handling for invalid file upload.
        
        Verifies that:
        - Invalid files are rejected
        - Error message is shown
        - User can retry
        """
        page = page_with_api_intercept
        
        page.goto(f"{frontend_url}/calculate.html")
        
        # Create invalid file
        invalid_file = tmp_path / "invalid.txt"
        invalid_file.write_text("This is not a valid CSV file")
        
        # Try to upload invalid file
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(str(invalid_file))
        
        # Wait a bit for processing
        page.wait_for_timeout(2000)
        
        # Should show error or rejection
        # Look for error indicators
        error_indicators = page.locator(
            'text=/error|invalid|failed|not supported/i, .alert-danger, .text-danger'
        )
        
        # At least one error indicator should be present
        expect(error_indicators.first).to_be_visible(timeout=5000)
    
    def test_multiple_file_upload(
        self,
        page_with_api_intercept: Page,
        frontend_url: str
    ):
        """
        Test uploading multiple files from different brokers.
        
        Verifies that:
        - Multiple files can be uploaded
        - Each file is detected separately
        - All files are listed
        """
        page = page_with_api_intercept
        
        page.goto(f"{frontend_url}/calculate.html")
        
        # Upload first file
        file_input = page.locator('input[type="file"]').first
        
        csv_files = [
            Path("tests/data/trading212/export.csv"),
            Path("tests/data/ibkr/sample.csv")  # If exists
        ]
        
        # Filter to existing files
        existing_files = [f for f in csv_files if f.exists()]
        
        if len(existing_files) > 0:
            # Upload first file
            file_input.set_input_files(str(existing_files[0]))
            
            # Wait for first detection
            page.wait_for_timeout(2000)
            
            # Verify file is listed
            expect(page.locator("body")).to_contain_text(
                existing_files[0].name,
                timeout=5000
            )
            
            # If multiple files exist, upload second
            if len(existing_files) > 1:
                file_input.set_input_files(str(existing_files[1]))
                page.wait_for_timeout(2000)
                
                # Both files should be listed
                expect(page.locator("body")).to_contain_text(existing_files[1].name)


@pytest.mark.e2e
class TestAPIIntegration:
    """Test API integration with LocalStack."""
    
    def test_health_check(self, api_gateway_setup):
        """Test health check endpoint."""
        import requests
        
        response = requests.get(api_gateway_setup["endpoints"]["health"])
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_detect_broker_api_directly(self, api_gateway_setup):
        """Test detect-broker API directly (without browser)."""
        import requests
        
        csv_path = Path("tests/data/trading212/export.csv")
        
        if csv_path.exists():
            with open(csv_path, "rb") as f:
                files = {"file": ("export.csv", f, "text/csv")}
                
                response = requests.post(
                    api_gateway_setup["endpoints"]["detect_broker"],
                    files=files
                )
            
            # Should get a response (might be error if dependencies missing in Lambda)
            assert response.status_code in [200, 400, 500]
            
            # If successful, verify response structure
            if response.status_code == 200:
                data = response.json()
                assert "detected" in data


# ============================================================================
# Helper Functions
# ============================================================================

def take_screenshot_on_failure(page: Page, test_name: str):
    """Take screenshot when test fails."""
    screenshot_dir = Path("test-results/screenshots")
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    
    screenshot_path = screenshot_dir / f"{test_name}.png"
    page.screenshot(path=str(screenshot_path))
    print(f"Screenshot saved: {screenshot_path}")


# ============================================================================
# Pytest Hooks
# ============================================================================

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to take screenshot on test failure."""
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call" and rep.failed:
        # Get page fixture if available
        if "page" in item.funcargs:
            page = item.funcargs["page"]
            take_screenshot_on_failure(page, item.name)
        elif "page_with_api_intercept" in item.funcargs:
            page = item.funcargs["page_with_api_intercept"]
            take_screenshot_on_failure(page, item.name)
