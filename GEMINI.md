This project is a UK Capital Gains Tax Calculator for stocks and shares. It processes investment transactions from QFX (Quicken Exchange Format) or CSV files (typically from Interactive Brokers or Sharesight) to determine taxable gains or losses according to HMRC rules. The application has both a command-line interface (CLI) and a web application.

## Project Overview

**Purpose:** To provide accurate UK capital gains tax calculations for stocks and shares, ensuring HMRC compliance and comprehensive portfolio analysis.

**Main Technologies:**
*   **Backend:** Python 3.10+, Flask (for web app), Gunicorn, pytest (for testing), ofxparse, pydantic, typer, rich, psutil.
*   **Frontend:** HTML, CSS, JavaScript (Bootstrap, Font Awesome).
*   **Infrastructure:** AWS (Lambda, API Gateway, S3, CloudFront, IAM, STS, Route53, ACM), LocalStack (for local development), Docker, docker-compose.
*   **Testing:** pytest (Python), Playwright (for UI tests), Jest (for JS unit tests).

**Architecture:** The application follows a client-server architecture. The frontend is a static website hosted on S3 and served via CloudFront. The backend is a Python Lambda function exposed via API Gateway.

## Building and Running

### 1. Local Development Environment

Utilizes LocalStack and Docker Compose to simulate AWS services locally.

*   **Start LocalStack:**
    ```bash
    docker-compose up -d
    ```
*   **Run Local Development Setup Script:**
    ```bash
    sh run-local-dev.sh
    ```
    This script performs the following:
    *   Sets up local AWS resources (S3 buckets, Lambda functions, API Gateway).
    *   Deploys the Lambda code to LocalStack.
    *   Updates the frontend UI with the LocalStack API Gateway URL.
    *   Deploys the static website to LocalStack S3.

*   **Access Points (LocalStack):**
    *   **Website URL:** Typically `http://ibkr-tax-calculator-local-bucket.s3-website.us-east-1.amazonaws.com` (or similar LocalStack S3 endpoint, check script output).
    *   **API Gateway URL:** `http://localhost:4566/restapis/<API_ID>/prod/_user_request_` (check script output for `<API_ID>`).

### 2. CLI Usage (Python)

Ensure Python dependencies are installed:
```bash
pip install -r requirements.txt
```

*   **Traditional CLI (using positional arguments):**
    ```bash
    python -m src.main.python.cli <file_path> <tax_year> [options]
    # Example: python -m src.main.python.cli data/trades.qfx 2024-2025
    ```
*   **Modern CLI (using named arguments):**
    ```bash
    python run_calculator.py --input <file_path> --tax-year <tax_year> [options]
    # Example: python run_calculator.py --input data/trades.qfx --tax-year 2024-2025
    ```

### 3. Web Application Deployment (AWS)

The full deployment to AWS is orchestrated by shell scripts and CloudFormation.

*   **Main Deployment Script:**
    ```bash
    sh deployment/deploy.sh
    ```
    This script handles:
    *   Packaging the Lambda function code.
    *   Deploying or updating the CloudFormation stack (`deployment/single-region-complete.yaml`) which provisions S3, Lambda, API Gateway, and CloudFront.
    *   Updating the Lambda function code.

*   **Frontend SPA Deployment:**
    After the CloudFormation stack is deployed, build and deploy the React SPA to the S3 bucket created by the stack.
    ```bash
    # Build the SPA
    cd frontend && npm run build && cd ..
    # Deploy to S3
    aws s3 sync frontend/dist s3://<your-s3-bucket-name> --profile <your-aws-profile>
    ```
    *Note: The S3 bucket name can be retrieved from the CloudFormation stack outputs (e.g., `WebsiteBucketName`).*

*   **CloudFront Cache Invalidation:**
    After deploying new frontend assets, invalidate the CloudFront cache to ensure users receive the latest version.
    ```bash
    aws cloudfront create-invalidation --distribution-id <your-cloudfront-distribution-id> --paths "/*" --profile <your-aws-profile>
    ```
    *Note: The CloudFront Distribution ID can be retrieved from the CloudFormation stack outputs or by listing distributions.*

## Development Conventions

*   **Python Backend:**
    *   Modular structure (`models`, `parsers`, `services`, `interfaces`, `config`, `utils`).
    *   Adheres to SOLID principles.
    *   Uses Dependency Injection, Interface Segregation, Strategy Pattern, and Factory Method.
    *   Testing with `pytest` for unit and integration tests.

*   **JavaScript Frontend:**
    *   Main application logic in `static/js/app.js`.
    *   Specific functionality in `static/js/results.js` and `static/js/file-upload.js`.
    *   UI built with Bootstrap and Font Awesome.

*   **Testing:**
    *   Python tests: Located in the `tests/` directory, categorized into `unit/`, `integration/`, and `system/`.
    *   JavaScript UI tests: Uses Playwright (`npm run test`).
    *   JavaScript unit tests: Uses Jest (`npm run test:unit`).

## Important Notes / Knowns

*   The primary Lambda handler is `deployment/lambda_handler.py` (not `src/main/python/lambda_handler.py` as initially assumed).
*   **Frontend API Endpoint Configuration:** The `__API_GATEWAY_URL__` placeholder in `static/js/app.js` is intended to be replaced with the actual API Gateway URL during deployment. For production, it should be replaced with the CloudFront distribution domain followed by `/prod` (e.g., `https://your-cloudfront-domain.com/prod`).
*   **Caching Issues:** Browsers and CDNs can aggressively cache frontend assets. Implementing a robust cache-busting strategy (e.g., versioning asset filenames like `app.js?v=1.1` or `app.<hash>.js`) is crucial for ensuring users always receive the latest frontend code after updates. This project currently uses a manual versioning approach in HTML files (e.g., `js/app.js?v=1.1`).

* **Extra Information
This project has an AWS cloudformation architecture defined in @deployment/single-region-complete.yaml . deployment/deploy-useast1.sh was used to deploy.
Deployed url is https://cgttaxtool.uk/ aws route53 is used as name server and routing. 
It is already deployed to AWS. AWS CLI can be used to access AWS. Profile `goker` is used to access. Such as: aws s3 list --profile goker.
If and error occurs about session, use "aws sso login --profile goker".
You can also use playwright to test ui. Both in python environment and node environment installed.
For deploying to AWS, there are scripts under deployment folder. 
01-package-api.sh and 03-deploy-api-code are enough to deploy backend to lambda function.
Build the SPA with 'cd frontend && npm run build' then 'aws s3 sync frontend/dist s3://<bucket-name>' to deploy the UI to s3 bucket.
Always use the folders properly. Write the tests under tests folder. UI code under static folder. Backend code under src/main/python folder.
Before finishing a task make sure that code is deployed to aws and deployment is tested. Locally testing an implementation is not enough.
For real tests use the input files under data folder.
Use python environment `conda activate ibkr-tax`. Check the intalled libraries before installing a new library.
Do not change the backend python code without user approval.