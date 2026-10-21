# Upload Feedback "File X-ray" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support the IBKR Activity Statement CSV, and show every upload an X-ray (what we understood, cannot see, expect) that ends each failure in a concrete next action.

**Architecture:** A new converter reads the `Trades` section of the Activity Statement. A server-side inspector (new `/inspect-file` endpoint) reuses converter parsing to produce one JSON X-ray per file plus cross-file expectations. The React upload step only renders that JSON; the browser does instant file-type/size/empty checks.

**Tech Stack:** Python 3.13 Lambda (pytest), Terraform API Gateway, React 18 + TS + Bootstrap (Jest, Playwright).

**Spec:** `docs/superpowers/specs/2026-10-21-upload-feedback-xray-design.md` (read it first; it holds the data findings and the decisions).

## Global Constraints

- Lambda zip must stay under about 52.6 MB (direct upload): no new heavy dependencies.
- Lambda imports use `from main.python...`; tests use `from src.main.python...`.
- Interfaces first: converters implement `BrokerConverterInterface` (`interfaces/broker_converter.py`) and register in `converters/__init__.py::register_default_converters`.
- `/detect-broker` and `/calculate` contracts must not change.
- Tax year strings are `"YYYY-YYYY"`; UK tax year runs 6 April to 5 April.
- Test data must be synthetic: no real customer values anywhere in the repo.
- Stocks only for the Activity Statement. Other asset categories are skipped and counted.
- Statuses and colours: green understood, amber needs a look, red blocked, grey ignored. Never rely on colour alone (add text or icon).
- Warnings never block. Only red blocks. A sell with no earlier buy is amber and needs the tick "I understand my history is incomplete".
- Frontend is SSG: no browser-only globals at module scope. Frontend commands run from the repo root.
- Run tests before declaring a task done (`make test-unit`, `npm run test:unit`).

## Review Focus

Failure modes the spec implies but does not spell out. Each has a test in the task named in brackets.

1. The same file uploaded twice would double every trade and look "fine". Detect identical content (hash) and exact-duplicate trades across files and warn. [Task 4]
2. Repeated BOMs and non-UTF-8 files (Windows-1252 `£`, UTF-16): decode must not crash; report an encoding warning, not a 500. [Task 1]
3. Pence prices (`GBX`/`GBp` currency or a `p` suffix) in the Trades section must be converted, not read as pounds. [Task 1]
4. A `Trades` header with zero data rows, or only non-stock rows, must give the `no_trades` or "only unsupported assets" screen, never an empty "ready". [Tasks 2, 4]
5. Files uploaded in any order: the "sell with no earlier buy" check must sort by date across files and not depend on upload order. [Task 4]

---

## File map

| File | Responsibility |
|---|---|
| `src/main/python/converters/ibkr_activity_statement_converter.py` (new) | Detect and convert Activity Statement `Trades` rows |
| `src/main/python/models/file_inspection.py` (new) | Dataclasses for the X-ray JSON |
| `src/main/python/config/format_fingerprints.py` (new) | Registry of known formats (supported or not) and their help text |
| `src/main/python/services/file_inspector.py` (new) | Build the X-ray for one or many files |
| `src/main/python/converters/base_converter.py` (modify; locate the `BaseBrokerConverter`) | Optional `inspect()` with default |
| `deployment/lambda_handler.py` (modify) | `/inspect-file` route and handler |
| `deployment/terraform/api_gateway.tf` (modify) | `inspect-file` resource, POST + OPTIONS, deployment dependency |
| `frontend/src/types/inspection.ts` (new) | TS types for the X-ray JSON |
| `frontend/src/utils/filePrecheck.ts` (new) | Instant browser checks |
| `frontend/src/components/calculator/xray/*.tsx` (new) | Strip, column table, summary boxes, actions, failure screens |
| `frontend/src/components/calculator/MultiFileUpload.tsx` (modify) | Call inspect, render X-ray, gate Continue |
| `frontend/src/services/api.ts` (modify) | `inspectFiles` |
| `frontend/src/utils/analytics.ts` (modify) | `trackInspection`, `trackInspectionAction` |

---

### Task 1: IBKR Activity Statement converter

Ships value on its own: the 46 stock-trade files in the logs start calculating.

**Files:**
- Create: `src/main/python/converters/ibkr_activity_statement_converter.py`
- Modify: `src/main/python/converters/__init__.py` (register)
- Create: `tests/data/ibkr/activity_statement_basic.csv`, `activity_statement_variant_account.csv`, `activity_statement_no_cprice.csv`, `activity_statement_no_trades.csv`, `activity_statement_mixed_assets.csv`, `activity_statement_pence.csv` (all synthetic)
- Test: `tests/unit/converters/test_ibkr_activity_statement_converter.py`

**Interfaces:**
- Produces: `class IBKRActivityStatementConverter(BaseBrokerConverter)` with `broker_name == "Interactive Brokers (Activity Statement)"`, `detect_confidence(file_path) -> float`, `convert(file_path, base_currency="GBP", **kwargs) -> List[StandardTransaction]`, and `read_trades_section(file_path) -> TradesSection` where `TradesSection` is a dataclass `(headers: List[str], rows: List[Dict[str, str]], encoding_warnings: List[str])` (reused by Task 2).

- [ ] **Step 1: Write the failing tests** in the test file above:
  - `test_detects_activity_statement_with_repeated_bom`: file starting with several `﻿` then `Statement,Header,Field Name,Field Value` and a `Trades,Header` row gives confidence >= 0.9.
  - `test_detect_confidence_zero_for_flex_query_csv`: `tests/data/ibkr` Flex Query file gives 0.0 (no collision with `IBKRConverter`).
  - `test_converts_stock_orders_only`: mixed-assets file returns only `Stocks` rows as `StandardTransaction`.
  - `test_buy_sell_from_quantity_sign`: negative quantity is SELL with positive stored quantity.
  - `test_maps_columns_by_name_across_header_variants` (parametrised over the 3 header-variant fixtures).
  - `test_commission_is_absolute_and_in_row_currency`.
  - `test_date_time_with_comma_and_quoted_form` parses `2025-06-03, 14:31:07` and `"2025-06-03, 14:31:07"`.
  - `test_pence_prices_converted_to_pounds` (Review Focus 3): currency `GBX` row with price 1203.5 yields price 12.035 in `GBP`.
  - `test_no_trades_section_returns_empty_list`.
  - `test_non_utf8_file_does_not_raise` (Review Focus 2): cp1252 bytes decode with a warning in `encoding_warnings`.
- [ ] **Step 2: Run** `pytest tests/unit/converters/test_ibkr_activity_statement_converter.py -v`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the converter. Detection: strip all leading BOMs; first non-empty row starts `Statement,Header,Field Name` gives 0.6, plus a `Trades,Header` row gives 0.95. Parse with `csv.reader`; select rows where col0 == `Trades` and col1 == `Data` and `DataDiscriminator == "Order"`; take the most recent `Trades,Header` row before each data row as the header (files can repeat headers per asset category). Keep `Asset Category` in {`Stocks`, `ETFs`}; confirm the exact label for ETFs from the real statements' category counts (only `Stocks`, `Equity and Index Options`, `Forex`, `Futures`, `Commodities`, `Bonds` appear in the logs; treat `ETFs` as optional). Decode utf-8-sig, falling back to cp1252 with a warning.
- [ ] **Step 4: Register** in `register_default_converters` after `IBKRConverter`; add a factory test that an Activity Statement file is detected as this converter, and that existing IBKR/Trading 212 fixtures still detect as before.
- [ ] **Step 5: Run** `pytest tests/unit/converters -v`. Expected: all PASS.
- [ ] **Step 6: Commit** `[IBKR] Add Activity Statement converter (Trades section, stocks only)`.

---

### Task 2: Inspection model and `inspect()` hook

**Files:**
- Create: `src/main/python/models/file_inspection.py`
- Modify: the base converter class (find `BaseBrokerConverter`) to add `inspect`
- Modify: `ibkr_activity_statement_converter.py` to override it
- Test: `tests/unit/test_file_inspection_model.py`, additions to the converter test file

**Interfaces:**
- Produces (dataclasses, all with `to_dict()`): 
  - `ColumnInfo(header: str, mapped_to: Optional[str], status: Literal["understood","check","ignored","blocked"], filled: int, blank: int, samples: List[str], note: Optional[str])`
  - `SkippedRows(reason: str, count: int)`
  - `RowStats(total: int, usable: int, skipped: List[SkippedRows])`
  - `FileInspection(filename: str, format: Optional[FormatInfo], verdict: Verdict, columns: List[ColumnInfo], rows: RowStats, summary: Summary, next_actions: List[NextAction], warnings: List[str])`
  - `Verdict = Literal["ready","ready_with_warnings","blocked","unsupported_format","no_trades","unknown"]`
  - `BaseBrokerConverter.inspect(self, file_path: str) -> Optional[FileInspection]` defaulting to `None` (other brokers opt in later).
- Consumes: `read_trades_section` from Task 1.

- [ ] **Step 1: Failing tests:** `test_inspect_default_returns_none_for_other_converters`; `test_activity_statement_inspect_column_stats` (fill and blank counts and samples for each header in `activity_statement_basic.csv`); `test_inspect_counts_skipped_by_asset_category` (mixed-assets: `Equity and Index Options` skipped count matches); `test_inspect_marks_proceeds_and_realized_pl_ignored`; `test_inspect_trades_header_with_zero_rows_is_no_trades` (Review Focus 4); `test_samples_are_capped_at_three_and_trimmed`.
- [ ] **Step 2: Run** them; expect FAIL.
- [ ] **Step 3: Implement** the dataclasses and the Activity Statement `inspect()`. Required columns for status `understood`: Symbol, Date/Time, Quantity, T. Price, Currency, Comm/Fee. Columns used: those plus Asset Category. Ignored: Proceeds, Basis, Realized P/L, MTM P/L, C. Price, Code, etc. Missing a required column is `blocked`.
- [ ] **Step 4: Run** `pytest tests/unit -k "inspection or activity_statement" -v`. Expected: PASS.
- [ ] **Step 5: Commit** `[Inspect] Add inspection model and Activity Statement inspect()`.

---

### Task 3: Format fingerprint registry

**Files:**
- Create: `src/main/python/config/format_fingerprints.py`
- Test: `tests/unit/test_format_fingerprints.py`

**Interfaces:**
- Produces: `@dataclass FormatFingerprint(id: str, name: str, supported: bool, help_text: str, export_steps: List[str])` and `identify_format(first_rows: List[List[str]], filename: str) -> Optional[FormatFingerprint]`.
- Seed: IBKR Activity Statement (supported), IBKR Flex Query CSV, IBKR QFX, Trading 212, Freetrade, Hargreaves Lansdown, Fidelity (all supported), plus unsupported shapes from the logs: `Portfolio Summary` exports, `Security movements for:` statements, cost-basis/realised reports starting `Date acquired,Quantity,Cost basis`, and a localised-Activity-Statement fingerprint (non-ASCII section names).

- [ ] **Step 1: Failing tests:** one per seeded format using a first-rows fixture, plus `test_unknown_returns_none`, `test_unsupported_formats_flagged_unsupported`, `test_repeated_bom_stripped_before_matching`.
- [ ] **Step 2: Run;** expect FAIL.
- [ ] **Step 3: Implement** `identify_format` (ordered list of predicate functions, first match wins; most specific first). Confirm the unsupported shapes against `errors/` metadata `first_line` values before finalising.
- [ ] **Step 4: Run;** expect PASS.
- [ ] **Step 5: Commit.**

---

### Task 4: File inspector service (verdict, expectations, multi-file)

**Files:**
- Create: `src/main/python/services/file_inspector.py`
- Test: `tests/unit/test_file_inspector.py`

**Interfaces:**
- Consumes: Task 1 converter, Task 2 model, Task 3 registry, `get_factory()`.
- Produces: `inspect_files(files: List[Tuple[str, bytes]]) -> InspectionResult` where `InspectionResult(files: List[FileInspection], expectations: List[Expectation], can_continue: bool, requires_acknowledgement: bool)` and `Expectation(rule: str, passed: bool, details: List[SellWithoutBuy|str])`; `SellWithoutBuy(symbol, date, quantity, filename)`.

Behaviour to implement:
- Per file: identify format (Task 3). If the converter supports inspection use it; otherwise convert via the factory and build a basic inspection from the standard CSV (headers, row count, skipped).
- Verdicts: `unsupported_format` when the fingerprint is unsupported; `no_trades` when an Activity Statement has no stock trades. Two variants of the message (see spec): summary rows with activity present (re-run with Trades enabled) versus no activity.
- Cross-file expectation `every_sell_has_earlier_buy`: sort all trades by date across files, then quantity-walk per symbol; any sell exceeding held quantity is a `SellWithoutBuy`. Sets `requires_acknowledgement = True` and verdict `ready_with_warnings`.
- Duplicate detection: identical content hash across files, or more than 80% identical (date, symbol, quantity, price) trades, adds a warning.
- Never raises on bad input; unparseable files give `unknown` with a `next_actions` list.
- Next actions are ids: `add_earlier_file`, `add_opening_holdings`, `show_skipped_rows`, `view_export_steps`, `pick_broker`, `request_support`, `remove_file`.

- [ ] **Step 1: Failing tests:** `test_sell_without_buy_flagged_and_needs_acknowledgement`; `test_buy_in_other_file_clears_sell` and `test_upload_order_does_not_matter` (Review Focus 5); `test_same_file_twice_warns_duplicate` (Review Focus 1); `test_unsupported_format_verdict_and_actions`; `test_no_trades_two_variants`; `test_only_options_rows_gives_only_unsupported_assets_message` (Review Focus 4); `test_garbage_bytes_gives_unknown_not_exception`; `test_blocked_when_required_column_missing`.
- [ ] **Step 2: Run;** expect FAIL.
- [ ] **Step 3: Implement** `inspect_files`, writing temp files in `/tmp` and deleting them afterwards (no persistence).
- [ ] **Step 4: Run** `pytest tests/unit/test_file_inspector.py -v`. Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 5: `/inspect-file` endpoint and Terraform route

**Files:**
- Modify: `deployment/lambda_handler.py` (route in `handle_api_gateway_request` next to `/detect-broker`; new `handle_inspect_request(event) -> Dict`)
- Modify: `deployment/terraform/api_gateway.tf` (copy the `detect_broker` resource, POST, OPTIONS, integration, responses, and add to the deployment `depends_on`/triggers)
- Test: `tests/unit/test_inspect_file_handler.py`

**Interfaces:** Consumes `inspect_files`. Request: multipart/form-data with one or more files (same parser as `/calculate`: `parse_multipart_data_proper`). Response 200: `InspectionResult.to_dict()`. 400 for no files or non-multipart. 413-style JSON error for oversized payload (limits: API Gateway 10 MB, Lambda sync 6 MB; verify and set the constant `MAX_INSPECT_BYTES`). Nothing is written to S3.

- [ ] **Step 1: Failing tests:** `test_inspect_returns_xray_json_for_activity_statement`, `test_inspect_multiple_files_returns_combined_expectations`, `test_inspect_rejects_non_multipart`, `test_inspect_rejects_oversize_with_message`, `test_inspect_does_not_write_to_s3` (patch `log_error_file_to_s3` and assert not called).
- [ ] **Step 2: Run;** expect FAIL.
- [ ] **Step 3: Implement** handler and CORS headers identical to `/detect-broker`.
- [ ] **Step 4: Terraform:** `terraform validate` in `deployment/terraform`; `terraform plan -target=aws_api_gateway_deployment.main` should show only the new route (check the real deployment resource name in the file).
- [ ] **Step 5: Run** `make test-unit`. Expected: PASS.
- [ ] **Step 6: Commit.** (Deploy happens in Task 11.)

---

### Task 6: Frontend types, API client and browser pre-checks

**Files:**
- Create: `frontend/src/types/inspection.ts`, `frontend/src/utils/filePrecheck.ts`, `frontend/src/utils/__tests__/filePrecheck.test.ts`
- Modify: `frontend/src/services/api.ts`, test `frontend/src/services/__tests__/inspectFiles.test.ts`

**Interfaces:**
- Produces: TS types mirroring Task 2/4 JSON (`FileInspection`, `ColumnInfo`, `InspectionResult`, `Verdict`, `NextActionId`). `inspectFiles(files: File[]): Promise<InspectionResult>`. `precheckFile(file: File): Promise<PrecheckResult>` where `PrecheckResult = { ok: true } | { ok: false; kind: 'wrong_type'|'empty'|'too_large'; message: string }`.

- [ ] **Step 1: Failing tests:** `precheckFile` rejects PDF by magic bytes `%PDF`, RTF `{\rtf`, ZIP `PK\x03\x04`, XLSX, empty file, over `MAX_UPLOAD_BYTES` (constant mirrors the backend); accepts a normal CSV and `.qfx`. `inspectFiles` posts to `${base}/inspect-file` with form field names matching `/calculate` and returns parsed JSON; throws a typed error on non-200.
- [ ] **Step 2: Run** `npx jest frontend/src/utils frontend/src/services -t "precheck|inspectFiles"`; expect FAIL.
- [ ] **Step 3: Implement** both.
- [ ] **Step 4: Run;** expect PASS. **Step 5: Commit.**

---

### Task 7: X-ray components

**Files:**
- Create under `frontend/src/components/calculator/xray/`: `FileXRay.tsx`, `ProgressStrip.tsx`, `ColumnTable.tsx`, `SummaryBoxes.tsx`, `NextActions.tsx`, `FailureScreen.tsx`, `xray.css` (or Bootstrap utilities), plus `__tests__/FileXRay.test.tsx`

**Interfaces:**
- Produces: `FileXRay({ inspection, result, onAction })` where `onAction: (id: NextActionId, fileName: string) => void`. `FailureScreen({ verdict, inspection, onAction })` for `unsupported_format | no_trades | unknown` and browser pre-check failures. `SummaryBoxes` renders "what we can see / cannot see / expect"; the sell-without-buy warning lists each sell (ticker, date, quantity), explains the effect (pool missing shares, cost understated, gain overstated) and shows the two fix buttons (`add_earlier_file`, `add_opening_holdings`).

- [ ] **Step 1: Failing tests** (React Testing Library): strip shows four stages with correct state per verdict; column table renders status text (not colour only) and a fill bar with `aria-valuenow`; problem columns sort first on narrow widths; sell-without-buy box lists each sell, contains the effect explanation text and both buttons; `unsupported_format` screen shows export steps from the registry; Continue-related props: `requires_acknowledgement` renders the unticked checkbox "I understand my history is incomplete".
- [ ] **Step 2: Run;** expect FAIL.
- [ ] **Step 3: Implement** using Bootstrap; mobile layout collapses the table to cards.
- [ ] **Step 4: Run;** expect PASS. **Step 5: Commit.**

---

### Task 8: Wire into the upload step and gate Continue

**Files:**
- Modify: `frontend/src/components/calculator/MultiFileUpload.tsx`, `steps/UploadDetailsStep.tsx`, `MultiStepCalculator.tsx` (step validity), `frontend/src/pages/CalculatorPage.tsx` (structured calculate-time errors)
- Remove usage of `FileValidationPreview` failure alert (keep the file if other code imports it)
- Test: `frontend/src/components/calculator/MultiFileUpload.test.tsx`, update `MultiStepCalculator.test.tsx`

**Interfaces:** Consumes `precheckFile`, `inspectFiles`, `FileXRay`. State per file: `precheck | inspecting | inspected | error`. Step is valid when every file is not `blocked` and, if `requires_acknowledgement`, the box is ticked. Re-inspect all files whenever the file list changes (cross-file expectations).

- [ ] **Step 1: Failing tests:** wrong-type file shows the instant failure screen without calling the API; adding a second file re-calls `inspectFiles` with both; `blocked` disables Continue; acknowledgement required for sell-without-buy; `ready_with_warnings` does not block; remove-file action removes it; `CSVValidationError`/`BrokerDetectionError` in CalculatorPage render the structured screen, not newline text.
- [ ] **Step 2: Run;** expect FAIL. **Step 3: Implement.** **Step 4: Run** `npm run test:unit`; expect PASS for the files you touched (the `SEOHead` tests already fail on `main` because they render without a `HelmetProvider`; leave them and note it). **Step 5: Commit.**

---

### Task 9: Telemetry

**Files:** modify `frontend/src/utils/analytics.ts`; use in `MultiFileUpload.tsx`; test `frontend/src/utils/__tests__/analytics.test.ts`.

**Interfaces:** `trackInspection(verdict: Verdict, formatId: string | null, fileCount: number): void`; `trackInspectionAction(action: NextActionId, verdict: Verdict): void`. Both go through `trackEvent`.

- [ ] Failing tests assert `trackEvent` is called with names `file_inspection` and `file_inspection_action` and the given params; implement; run `npx jest frontend/src/utils`; commit.

---

### Task 10: Opening holdings spike (decision gate)

The calculator has no opening-balance input. This is a time-boxed spike (about half a day) to decide how route (b) of the sell-without-buy warning works.

**Files:** spike notes in `docs/superpowers/specs/2026-10-21-opening-holdings-spike.md`; throwaway branch code only.

- [ ] **Step 1:** Prototype adding opening holdings as synthetic BUY `StandardTransaction`s dated the day before the earliest trade, tagged `notes="opening balance"`, sent as an extra form field to `/calculate`. Verify with one test that a sell then uses that cost in the Section 104 pool.
- [ ] **Step 2:** Write the spike note: works / does not, size estimate, report impact (the results page and printable report must label opening balances).
- [ ] **Step 3: Stop and report to the user.** If the work is small, add a follow-up task; if large, ship Task 7's `add_opening_holdings` button as "coming soon" and keep route (a) only (spec allows this; tell the user).

---

### Task 11: End-to-end, deploy, housekeeping

**Files:** `tests/e2e/xray.spec.ts` (Playwright, follow `.claude/skills/playwright-tests`), `.gitignore`, `CLAUDE.md` (add the new converter/endpoint lines), `docs/`.

- [ ] **Step 1: E2E tests:** upload `activity_statement_basic.csv` and see "Interactive Brokers (Activity Statement)", the column table and Continue enabled; upload an options-only statement and see the unsupported-assets message; upload a PDF and see the instant failure; upload a file with a sell and no buy, see the warning, Continue disabled until the box is ticked; upload the same file twice and see the duplicate warning.
- [ ] **Step 2:** Add `.superpowers/` to `.gitignore`.
- [ ] **Step 3:** Run `make test-unit`, `npm run test:unit`, `npm run type-check`, `npm run test:e2e`.
- [ ] **Step 4: Deploy (ask the user first; use the `deploy-aws` skill):** package Lambda (`bash deployment/01-package-api.sh` from repo root; check size stays under limit), `terraform apply` for the Lambda and the new route, build and `aws s3 sync` with `--exclude "errors/*" --exclude "feedback/*"`, CloudFront invalidation.
- [ ] **Step 5:** Manually verify on https://cgttaxtool.uk/calculator with a synthetic Activity Statement and a PDF. Commit and open the PR against `main`.

---

## Self-review notes

- Spec coverage: converter (T1), X-ray panel and failure screens (T7, T8), endpoint (T5), registry (T3), telemetry (T9), sell-without-buy amber with explanation and two fixes (T4, T7, T8, T10), multi-file (T4, T8), size limit (T5, T6), no-trades two variants (T4, T7). Column mapping, the opt-in file sharing and the privacy wording, wizard reordering and dividends are explicitly out of scope per the spec.
- Types used in later tasks (`FileInspection`, `InspectionResult`, `NextActionId`, `Verdict`) are defined in Tasks 2, 4 and 6.
- Open item for the executor to flag, not decide: whether `ETFs` appear as an asset category in real statements.
