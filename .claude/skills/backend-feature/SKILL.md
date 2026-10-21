---
name: backend-feature
description: Implement and test a Python backend change in the CGT calculator (parsers, domain models, FX/commission handling, disposal calculation, API response shape). Use when changing src/main/python or the Lambda API response.
---

# Backend feature workflow

1. **Contract first.** Agree the response shape (e.g. `disposal_events` fields) and mirror it in `frontend/src/types/calculation.ts`.
2. **TDD.** Write the failing pytest in `tests/unit/` (or `tests/integration/` for API responses) before the code. Fixtures: `tests/fixtures/`, `tests/data/`.
3. **Interfaces first** (`interfaces/calculator_interfaces.py`), then the implementation; inject dependencies (e.g. `FXCalculator` into the disposal calculator) rather than constructing them inline.
4. Typical touch points:
   - `parsers/qfx_parser.py`, `csv_parser.py`: extract commission, currency, FX rate. If price is missing/zero use `total_amount / quantity`.
   - CSV validation: raise a `CSVValidationError(missing_columns=[...])` for missing required columns; the API returns HTTP 400 with `missing_columns`.
   - `models/domain_models.py`: use `Decimal` for money/rates; `matching_rule` values are `same_day`, `bed_and_breakfast`/30-day, and `section104` (never `section_104`).
   - `services/fx_calculator.py`, `disposal_calculator.py`: FX gain = (sell_amount*sell_rate − buy_amount*buy_rate) − CGT gain; zero when both rates are 1.0.
   - `deployment/lambda_handler.py` and `api_lambda_handler.py`: serialize new fields; keep CORS headers.
5. **Test.** `make test-unit`; single test: `pytest path::Class::test -v`. Cover edge cases: missing commission, GBP-only (rate 1.0), multi-currency, mixed matching rules, partial pool disposals. Integration: `SKIP_LIVE_API_TESTS=1 make test-integration`.
6. Done when unit and integration tests pass and nothing else regressed (`make quick-test`).
