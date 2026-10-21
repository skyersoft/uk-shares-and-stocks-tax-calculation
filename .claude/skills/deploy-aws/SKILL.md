---
name: deploy-aws
description: Deploy the CGT calculator to AWS production (Lambda via Terraform, React SPA to S3 + CloudFront) and verify it. Use when asked to deploy, release, ship to prod, roll back, or verify the live site cgttaxtool.uk.
---

# Deploy to AWS

Production changes are outward-facing: confirm with the user before running `terraform apply`, `aws s3 sync`, or invalidations unless they already told you to deploy.

AWS profile is always `--profile goker`. Region `us-east-1`. Lambda: `ibkr-tax-calculator-prod-us-east-1` (handler `lambda_handler.lambda_handler`, defined in `deployment/terraform/lambda.tf`). CloudFront distribution `E3CPZK9XL7GR6Q`. Bucket name: `terraform output website_bucket_name` (previously `ibkr-tax-useast1-complete-websitebucket-mz2iwsaztkjo`).

## 1. Pre-checks
```bash
conda activate ibkr-tax
make test-unit && npm run test:unit
aws sts get-caller-identity --profile goker
git status
```

## 2. Backend
```bash
cd deployment && bash 01-package-api.sh        # builds api-lambda-deployment.zip (~29MB)
mv api-lambda-deployment.zip ../lambda-deployment.zip   # Terraform expects this name at repo root
cd terraform && terraform plan && terraform apply
```
Do NOT use `01-package.sh` or `03-deploy-api-code.sh` (obsolete). Quick code-only alternative if Terraform is not wanted:
`aws lambda update-function-code --function-name ibkr-tax-calculator-prod-us-east-1 --zip-file fileb://lambda-deployment.zip --region us-east-1 --profile goker` (this causes Terraform state drift).

## 3. Frontend
```bash
npm run build:spa                                  # from repo root → frontend/dist
aws s3 sync frontend/dist/ s3://<bucket>/ --profile goker --delete --exclude "errors/*" --exclude "feedback/*"
aws cloudfront create-invalidation --distribution-id E3CPZK9XL7GR6Q --paths "/*" --profile goker
```
**Always exclude `errors/*` and `feedback/*`**: the Lambda writes user feedback and problem uploads into this same bucket, and `--delete` without the excludes hides them (the bucket is versioned, so they are recoverable for 30 days, but don't rely on that).
(Optionally upload `index.html` with `--cache-control no-cache` and other assets long-cached.)

## 4. Verify
```bash
curl -I https://cgttaxtool.uk/prod/health            # expect 200
curl -X POST https://cgttaxtool.uk/prod/calculate -F "file=@tests/fixtures/<sample>" -F "tax_year=2024-2025" -F "analysis_type=full"
aws logs tail /aws/lambda/ibkr-tax-calculator-prod-us-east-1 --profile goker --since 10m
```
Then smoke-test the UI in a browser: upload a file, confirm results/disposal table render, no console errors. Invalid CSV should return 400 with `missing_columns`.

## 5. Rollback
- Lambda: `aws lambda list-versions-by-function ...`, redeploy the previous zip via Terraform (or `update-function-code`).
- Frontend: check out the previous commit, rebuild, re-sync, re-invalidate.

Lambda imports use `from main.python...` (flattened package); never import the CLI/typer in `src/main/python/__init__.py`.
