# LocalStack Setup Tasks

This file outlines the tasks required to set up a local development and testing environment using LocalStack.

## Tasks

1.  **Create `docker-compose.yml`:** Define the LocalStack service in a `docker-compose.yml` file. This will allow us to easily start and stop the LocalStack container.

2.  **Create `deployment/local/01-create-local-resources.sh`:** This script will use the `awslocal` CLI to create the necessary AWS resources in the LocalStack container. This includes:
    *   S3 bucket for the static website
    *   Lambda function
    *   API Gateway with a `/prod` stage
    *   CloudFront distribution pointing to the S3 bucket and API Gateway

3.  **Create `deployment/local/02-deploy-lambda.sh`:** This script will package the Lambda function code and deploy it to the local Lambda service in the LocalStack container.

4.  **Create `deployment/local/03-deploy-s3.sh`:** This script will sync the contents of the `static` directory to the local S3 bucket created in step 2.

5.  **Modify `static/js/app.js`:** Update the `baseUrl` in the `API_CONFIG` to point to the local API Gateway endpoint provided by LocalStack.

6.  **Create `run-local-dev.sh`:** This script will orchestrate the entire local development setup. It will:
    *   Start the LocalStack container using `docker-compose up`.
    *   Run the `01-create-local-resources.sh` script.
    *   Run the `02-deploy-lambda.sh` script.
    *   Run the `03-deploy-s3.sh` script.
    *   Provide instructions on how to access the local website and API.
