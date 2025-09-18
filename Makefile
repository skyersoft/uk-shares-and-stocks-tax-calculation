# IBKR Tax Calculator - Test Automation
# 
# This Makefile provides commands to run different levels of tests

.PHONY: help test test-unit test-integration test-e2e test-all install-deps clean

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install-deps: ## Install all test dependencies
	pip install -r requirements.txt
	pip install -r web_requirements.txt  
	pip install pytest pytest-asyncio pytest-cov playwright requests
	playwright install chromium

test: test-unit ## Run unit tests (default)

test-unit: ## Run unit tests only
	pytest tests/unit/ -v --cov=src --cov-report=term-missing

test-integration: ## Run integration tests (API calls)
	pytest tests/integration/ -v --tb=short

test-system: ## Run system tests  
	pytest tests/system/ -v --tb=short

test-e2e: ## Run end-to-end tests with Playwright
	pytest tests/e2e/ -v --tb=short

test-e2e-headless: ## Run E2E tests in headless mode
	CI=1 pytest tests/e2e/ -v --tb=short

test-all: ## Run all tests
	pytest tests/ -v --tb=short --cov=src --cov-report=term-missing

test-all-skip-live: ## Run all tests except live API calls
	SKIP_LIVE_API_TESTS=1 pytest tests/ -v --tb=short --cov=src --cov-report=term-missing

test-duplicate-fix: ## Test specifically the duplicate file upload fix
	pytest tests/integration/test_duplicate_files.py tests/e2e/test_playwright.py -v

test-portfolio-fix: ## Test portfolio and disposal table fixes
	pytest tests/integration/test_complete_workflow.py tests/e2e/test_playwright.py -v -k "portfolio or disposal"

clean: ## Clean up test artifacts
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type f -name ".coverage" -delete
	rm -rf tests/responses/*.png tests/responses/*.json

# Development shortcuts
quick-test: ## Quick test run (unit + integration, skip live API) 
	SKIP_LIVE_API_TESTS=1 pytest tests/unit/ tests/integration/ -v --tb=short

full-test: ## Full test suite including E2E (for CI/CD)
	pytest tests/ -v --tb=short --cov=src --cov-report=xml

# Debug commands
debug-api: ## Debug API integration tests
	pytest tests/integration/test_api_comparison.py -v -s

debug-e2e: ## Debug E2E tests with browser visible
	pytest tests/e2e/test_playwright.py -v -s

# Test specific fixes
verify-fix: ## Verify the duplicate file upload fix
	@echo "Testing the duplicate file upload fix..."
	pytest tests/integration/test_duplicate_files.py -v
	@echo "Testing end-to-end workflow..."
	pytest tests/e2e/test_playwright.py -v