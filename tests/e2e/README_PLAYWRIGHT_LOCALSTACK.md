# End-to-End Testing with Playwright + LocalStack

## Overview

This directory contains end-to-end tests that combine:
- **Playwright** for frontend browser automation
- **LocalStack** for backend AWS Lambda emulation
- **Complete user flow** testing from file upload to results

## Architecture

```
┌──────────────────────────────────────────────────┐
│           Playwright Browser                      │
│  (Automated user interactions)                   │
└────────────────┬─────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌──────────────────────────────────────────────────┐
│         API Route Interception                    │
│  (Redirects /prod/* to LocalStack)               │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│           LocalStack Container                    │
│  ├─ API Gateway (emulated)                       │
│  ├─ Lambda Function (deployed)                   │
│  └─ S3, DynamoDB, etc. (if needed)               │
└──────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Install Dependencies

```bash
# Python dependencies
pip install playwright testcontainers[localstack] boto3 requests

# Playwright browsers
playwright install
```

### 2. Ensure Docker is Running

```bash
docker ps
# Should show Docker daemon is running
```

### 3. Start Frontend Dev Server

```bash
# In project root
npm run dev

# Or if using Vite
cd frontend && npm run dev
```

The frontend should be running on `http://localhost:5173` (or your configured port).

## Running Tests

### Run All E2E Tests with LocalStack

```bash
# From project root
pytest tests/e2e/test_playwright_with_localstack.py -v -s

# With markers
pytest tests/e2e/test_playwright_with_localstack.py -v -m e2e
```

### Run Specific Test

```bash
pytest tests/e2e/test_playwright_with_localstack.py::TestCompleteUserFlow::test_file_upload_with_broker_detection -v -s
```

### Run with Custom Frontend URL

```bash
# Test against production
FRONTEND_URL=https://cgttaxtool.uk pytest tests/e2e/test_playwright_with_localstack.py -v

# Test against custom local port
FRONTEND_URL=http://localhost:3000 pytest tests/e2e/test_playwright_with_localstack.py -v
```

### Run in Headed Mode (See Browser)

```bash
pytest tests/e2e/test_playwright_with_localstack.py -v -s --headed
```

### Run with Slow Motion (for debugging)

```bash
pytest tests/e2e/test_playwright_with_localstack.py -v -s --headed --slowmo=1000
```

## Test Scenarios

### 1. File Upload with Broker Detection

**Test:** `test_file_upload_with_broker_detection`

**Flow:**
1. Navigate to calculator page
2. Upload Trading 212 CSV file
3. Wait for broker detection
4. Verify "Trading 212" is displayed
5. Verify confidence percentage shown
6. Verify transaction count displayed

**Expected Result:** ✅ Broker detected and displayed

---

### 2. Complete Calculation Flow

**Test:** `test_complete_calculation_flow`

**Flow:**
1. Upload file
2. Wait for detection
3. Select tax year
4. Click calculate
5. Wait for results
6. Verify results page loads

**Expected Result:** ✅ Calculation completes successfully

---

### 3. Broker Detection Preview

**Test:** `test_broker_detection_preview`

**Flow:**
1. Upload file
2. Verify detection spinner appears
3. Verify success icon appears
4. Verify confidence % shown
5. Verify broker name displayed

**Expected Result:** ✅ Preview shows all metadata

---

### 4. Error Handling

**Test:** `test_error_handling_invalid_file`

**Flow:**
1. Upload invalid file (txt file)
2. Verify error message shown
3. Verify user can retry

**Expected Result:** ✅ Error handled gracefully

---

### 5. Multiple File Upload

**Test:** `test_multiple_file_upload`

**Flow:**
1. Upload first file (Trading 212)
2. Verify file listed
3. Upload second file (IBKR)
4. Verify both files listed
5. Verify each detected separately

**Expected Result:** ✅ Multiple files handled correctly

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL to test |
| `LOCALSTACK_IMAGE` | `localstack/localstack:3.0` | LocalStack Docker image |
| `HEADLESS` | `true` | Run browser in headless mode |

### Pytest Configuration

Add to `pytest.ini`:

```ini
[pytest]
markers =
    e2e: End-to-end tests with Playwright
    localstack: Tests requiring LocalStack
```

## Debugging

### View Browser During Test

```bash
pytest tests/e2e/test_playwright_with_localstack.py -v -s --headed
```

### Enable Slow Motion

```bash
pytest tests/e2e/test_playwright_with_localstack.py -v -s --headed --slowmo=2000
```

### Check Screenshots on Failure

Screenshots are automatically saved to `test-results/screenshots/` when tests fail.

```bash
ls test-results/screenshots/
```

### View LocalStack Logs

```bash
# In another terminal while tests are running
docker logs -f <localstack-container-id>
```

### Debug Lambda Function

Add print statements in `deployment/lambda_handler.py`:

```python
def detect_broker_from_file(file_path: str):
    print(f"DEBUG: Detecting broker for {file_path}")
    # ... rest of function
```

These will appear in LocalStack logs.

## Troubleshooting

### Issue: "Docker not running"

**Solution:**
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### Issue: "Frontend not accessible"

**Solution:**
```bash
# Start frontend dev server
cd frontend
npm run dev

# Or check if it's running
curl http://localhost:5173
```

### Issue: "LocalStack container fails to start"

**Solution:**
```bash
# Pull latest image
docker pull localstack/localstack:3.0

# Check Docker resources
docker system df

# Clean up if needed
docker system prune
```

### Issue: "Lambda function times out"

**Solution:**
Increase timeout in fixture:

```python
response = lambda_client.create_function(
    # ...
    Timeout=120,  # Increase from 60 to 120 seconds
    MemorySize=2048,  # Increase memory
)
```

### Issue: "Broker detection fails in Lambda"

**Possible causes:**
1. Missing dependencies in Lambda package
2. Import errors
3. File path issues

**Solution:**
Check Lambda logs in LocalStack:
```bash
docker logs <localstack-container> 2>&1 | grep ERROR
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests with LocalStack

on: [push, pull_request]

jobs:
  e2e-tests:
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
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Python dependencies
        run: |
          pip install -r requirements.txt
          pip install playwright testcontainers[localstack] boto3
          playwright install --with-deps
      
      - name: Install Node dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Start frontend
        run: |
          cd frontend
          npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: |
          pytest tests/e2e/test_playwright_with_localstack.py -v -m e2e
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-results/screenshots/
```

## Best Practices

1. **Keep tests independent** - Each test should work standalone
2. **Use fixtures** - Reuse LocalStack setup across tests
3. **Clean up resources** - Fixtures handle cleanup automatically
4. **Take screenshots** - Automatically captured on failure
5. **Test realistic flows** - Mimic actual user behavior
6. **Handle timing** - Use Playwright's auto-waiting features
7. **Mock external services** - LocalStack handles AWS, mock others if needed

## Performance Tips

1. **Session-scoped fixtures** - LocalStack container shared across tests
2. **Parallel execution** - Use `pytest-xdist` for parallel tests
3. **Selective testing** - Use markers to run specific test groups
4. **Fast feedback** - Run critical tests first

## Next Steps

1. ✅ Review test scenarios
2. ✅ Ensure Docker is running
3. ✅ Start frontend dev server
4. ✅ Run tests: `pytest tests/e2e/test_playwright_with_localstack.py -v`
5. ✅ Check results and screenshots

## Resources

- [Playwright Python Docs](https://playwright.dev/python/)
- [LocalStack Docs](https://docs.localstack.cloud/)
- [Testcontainers Python](https://testcontainers-python.readthedocs.io/)
- [Pytest Docs](https://docs.pytest.org/)
