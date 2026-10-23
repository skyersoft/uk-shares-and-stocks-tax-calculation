# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UK Capital Gains Tax calculator (live at https://cgttaxtool.uk). Parses broker exports (IBKR QFX/CSV, plus Trading212, Freetrade, Hargreaves, Fidelity converters) and applies HMRC matching rules (same-day, 30-day "bed & breakfast", Section 104 pool). Python backend deployed as AWS Lambda behind API Gateway; React/Vite SPA on S3 + CloudFront; infra in Terraform.

## Commands

Backend (Python, conda env `ibkr-tax` by convention):
```bash
pip install -r requirements.txt
make test-unit                    # pytest tests/unit/ with coverage (alias: make test)
make quick-test                   # unit + integration, SKIP_LIVE_API_TESTS=1
pytest tests/unit/test_disposal_calculator.py::TestX::test_y -v   # single test
pytest tests/ -m "not e2e and not localstack"                     # markers: integration, localstack, e2e
python run_calculator.py --input data/trades.csv --tax-year 2024-2025   # CLI (also: python -m src.main.python.cli <file> <year>)
```
Note: the Makefile's `install-deps` references `web_requirements.txt`, which does not exist.

Frontend (run from repo root — `package.json` is at the root, not in `frontend/`):
```bash
npm run dev:spa          # vite-react-ssg dev (config: frontend/vite.config.ts)
npm run build:spa        # SSG build → frontend/dist
npm run test:unit        # Jest (frontend/src/**/__tests__ and *.test.tsx)
npx jest path/to/File.test.tsx -t "name"   # single Jest test
npm run test:e2e         # Playwright (playwright.config.ts)
npx playwright test -c playwright.xray.config.ts   # X-ray UI tests: start local `npm run dev:spa` itself, stub /inspect-file with fixtures from the real backend (regenerate: python tests/ui/fixtures/xray/generate_fixtures.py); E2E_BASE_URL overrides the target
npm run type-check       # tsc --noEmit
npm run lint             # eslint --fix over frontend/src
```

Blog: posts are Markdown in `frontend/public/blog/posts/<year>/`; `python scripts/maintain_blog_index.py` regenerates `frontend/public/blog/index.json` from their frontmatter.

## Architecture

**Calculation pipeline** (`src/main/python/`): broker file → `converters/` (broker-specific → standard CSV via `ConverterFactory` / `get_factory()`, `models/standard_transaction.py`) or `parsers/` (QFX/CSV; `multi_broker_parser.py` does detection) → `Transaction` domain models (`models/domain_models.py`) → `services/` (matching, `share_pool_manager`, `disposal_calculator`, `fx_service`/`fx_calculator`, `dividend_processor`, `currency_processor`, `tax_year_calculator`, `portfolio_calculator`, `performance_calculator`, `report_generator`/`portfolio_report_generator`). `capital_gains_calculator.create_enhanced_calculator()` wires these together and is the main entry point for both the CLI and Lambda. `models/timeline_models.py` backs the portfolio timeline graph.

**File X-ray** (upload-step feedback): `services/file_inspector.py` `inspect_files(files)` reports per file the format, column mapping, row stats, warnings and next actions, plus cross-file checks (sell without earlier buy, duplicate files), as `models/inspection_result.py` `InspectionResult.to_dict()`. `config/format_fingerprints.py` identifies a file's format from its first rows (including known-unsupported ones such as quoted-header IBKR Flex Query). `converters/ibkr_activity_statement_converter.py` (`IBKRActivityStatementConverter`) reads the IBKR Activity Statement CSV (Trades section, stocks only) and has an `inspect()` used by the inspector; `inspect()` returns `blocked` exactly when `convert()` raises, and non-GBP stock rows are converted to pounds at HMRC's monthly rate for the trade's month (`HMRCExchangeRateService`, bundled `data/hmrc_monthly_rates.json`, refreshed with `scripts/fetch_hmrc_rates.py`; Jan 2021 onwards) - a currency/month with no published rate blocks the file instead of defaulting to 1.0. The Section 104 pool in `transaction_matcher.py` sums cost in pounds at each purchase's own rate. The inspector uses the same detection threshold as `/calculate` (`MIN_CONVERT_CONFIDENCE` in `converter_factory.py`) and routes `.qfx`/`.ofx` by extension like `/calculate`. Pass first rows with quotes intact (split lines on the delimiter; do not use `csv.reader`).

**Interfaces first**: business logic is injected through abstract classes in `interfaces/calculator_interfaces.py` (e.g. `FileParserInterface`, `DisposalCalculatorInterface`, `SharePoolManagerInterface`). When adding a capability, define/extend the interface, then the implementation. Tax constants live in `config/tax_config.py` (rates/exemptions change per tax year — see `tests/unit/test_cgt_rate_change.py`).

**Lambda**: `deployment/api_lambda_handler.py` is the API-only handler (static files come from S3); `deployment/lambda_handler.py` is the older handler that also serves pages and has `/calculate`, `/detect-broker`, `/inspect-file` (multipart POST; the Terraform route is in `deployment/terraform/api_gateway.tf`), `/unrealised-gains`, `/feedback`, `/health`. Both import via `from main.python...` because packaging flattens `src/` — this differs from the `src.main.python` path used locally/in tests. Avoid heavy imports (e.g. typer/CLI) in `src/main/python/__init__.py`; they bloat/break the Lambda.

**Frontend** (`frontend/src/`): React 18 + TypeScript + Bootstrap, built with `vite-react-ssg` (static pre-rendering, so avoid browser-only globals at module scope). Calculator wizard (`pages/CalculatorPage.tsx`) → `services/api.ts` / `calculationService.ts` → `pages/ResultsPage.tsx` (plus a printable accountant-style report page). Types for the API response live in `types/calculation.ts`; keep them in sync with the backend response shape. The upload step shows a File X-ray (`components/calculator/xray/`: `FileXRay`, `ColumnTable`, `SummaryBoxes`, `FailureScreen`, `NextActions`, plus `useFileInspection.ts`), fed by `inspectFiles()` in `services/api.ts` (types in `types/inspection.ts`); it gates Next in `MultiStepCalculator.tsx` (blocked file, or tick "I understand my history is incomplete" when a sell has no earlier buy). Two size limits in `utils/filePrecheck.ts`: `MAX_INSPECT_BYTES` (4 MiB, mirrors the backend) only decides whether a file is checked, `MAX_UPLOAD_BYTES` (5 MiB, the `/calculate` ceiling) blocks. Production API base path is `/prod` (`/prod/calculate`), local is `/calculate`.

**Deployment**: `cd deployment && bash 01-package-api.sh` builds `api-lambda-deployment.zip`; Terraform (`deployment/terraform`) expects it as `lambda-deployment.zip` in the repo root, then `terraform apply`. Frontend: `npm run build:spa`, `aws s3 sync` to the site bucket and CloudFront invalidation, with AWS profile `goker` (see `docs/DEPLOYMENT.md`, `.github/copilot-instructions.md` for bucket/distribution IDs). `01-package.sh` and `03-deploy-api-code.sh` are obsolete — don't use them.

## Conventions and gotchas

- Tax year strings are always `"YYYY-YYYY"` (e.g. `"2024-2025"`); UK tax year runs 6 April → 5 April. All calculation output is in GBP, with FX applied at transaction date.
- `matching_rule` for pooled disposals is the single value `'section104'` (no `section_104` variant).
- When a parsed price is missing/zero, derive it from `total_amount / quantity`.
- Test layout: `tests/unit` (fast, mocked), `integration` (API/local server; some hit live API unless `SKIP_LIVE_API_TESTS=1`), `e2e`/`ui` (Playwright), `system`, fixtures in `tests/fixtures` and `tests/data`.
- Project working style (from `.github/copilot-instructions.md`): TDD, SOLID, run the tests before declaring a task done, record newly found bugs in a tasks file rather than silently expanding scope.
- Large generated/untracked dirs (`archive_generated/`, `youtube/`, `voice_tests/`, `htmlcov/`, `playwright-report/`, `deployment_package_full/`, `*.zip`) are artifacts, not source.
- Further docs: `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/TAX_REFERENCE.md`, `docs/STANDARD_CSV_FORMAT.md`, `docs/IBKR_QFX_GUIDE.md`.
