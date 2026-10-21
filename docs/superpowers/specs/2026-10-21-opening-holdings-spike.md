# Spike: opening holdings for sells with no earlier buy

Date: 2026-10-21. Task 10 of the upload-feedback X-ray work. Throwaway prototype in a worktree (discarded); this note is the only artifact.

## 1. Summary and recommendation

Route (b) works. Opening holdings can be injected as synthetic GBP BUY transactions after parsing and before the matcher runs. The prototype was about 25 lines of backend code, and a verification script showed the Section 104 pool uses the entered cost and the gain drops from an overstated 900.00 to 433.33.

The core calculation is small. The surrounding work is not: multi-currency pool costing, the unrealised-gains and timeline endpoints, report labelling, validation, `/inspect-file` re-runs, and the form UI.

**Recommendation: build it in a follow-up (medium).** Do not block this feature branch on it. Keep the `add_opening_holdings` action in Task 7 as a "coming soon" button, keep route (a) only for now, and tell the user. One item needs an owner decision first (open question 1: mixed-currency pool costing), because it can silently produce wrong numbers.

## 2. How a BUY reaches the Section 104 pool

There are two separate implementations. The one that drives `/calculate` is not `SharePoolManager`.

- `/calculate` flow:
  - `deployment/lambda_handler.py:524` `handle_calculation_request`
  - `parse_multipart_data_proper` (line 778) only reads `file*`, `tax_year` and `analysis_type` parts. Unknown form fields are ignored today, so a new `opening_holdings` part needs a new branch plus a change to the returned tuple.
  - `create_enhanced_calculator(file_type)` (line 643), then `calculator.calculate_comprehensive_analysis(files, tax_year, analysis_type)` (line 647).
- `src/main/python/capital_gains_calculator.py` `calculate_comprehensive_analysis` parses every file with `MultiBrokerParser` and concatenates into `all_transactions`. This is the natural injection point, because by then every file has been merged. The prototype adds an `opening_holdings` argument and extends `all_transactions` there.
- `parsers/multi_broker_parser.py` (about line 125) builds the domain `Transaction` from a `StandardTransaction`. The domain `Transaction` has no `notes` field (`models/domain_models.py:327`), so "opening balance" labelling needs a new field. The prototype uses a `transaction_id` prefix `OPENING_`.
- `services/tax_year_calculator.py:108` `_calculate_capital_gains` keeps BUY and SELL, calls `UKTransactionMatcher.match_disposals` over the whole history (all years), calls `UKDisposalCalculator.calculate_disposal` for each match, and only then filters disposals by tax year (`_is_in_tax_year(d.sell_date, ...)`).
- `services/transaction_matcher.py` `match_disposals`:
  - same-day: buys with the same date as the sell;
  - 30 days: buys with `sell.date < b.date <= sell.date + 30d`;
  - Section 104 (about line 118 onward): pool candidates are all buys with `b.date.date() < sell.date.date()` and remaining quantity > 0.
  - The pool is rebuilt per sell by replaying the full history, summing `price_per_unit * quantity` plus `(commission + taxes)` proportionally. It emits a synthetic `POOL_MATCH_*` BUY dated at the sell date.
- `services/disposal_calculator.py:20` `calculate_disposal` multiplies by `currency.rate_to_base` and sets `matching_rule = "section104"` for `POOL_MATCH_` ids.
- `models/domain_models.py:546` `SharePool.add_shares` and `services/share_pool_manager.py:57` `_process_buy` implement the incremental pool (`cost_basis += total_cost_in_base_currency`, `quantity += qty`). This path is used only by `timeline_calculator`, not by the CGT calculation. It needs to see the opening buys too, or the portfolio timeline will diverge.

A BUY's GBP cost is `(qty * price + commission + taxes) * currency.rate_to_base` (`domain_models.py:367`). A GBP opening buy with price = total / qty and zero fees therefore adds exactly the entered total.

## 3. The prototype and what the script showed

Prototype (discarded): `build_opening_transactions(opening_holdings, existing)` in `capital_gains_calculator.py`, plus an `opening_holdings=None` argument on `calculate_comprehensive_analysis`.

- Each holding becomes a BUY with `transaction_id="OPENING_<i>_<symbol>"`, `currency=GBP/1.0`, `price=total_cost_gbp/quantity`, zero commission and taxes.
- Date = `min(as_at, midnight of the day before the first trade of that ticker)`.
- The `Security` object is copied from the first trade of that symbol, so ISIN grouping matches. If the symbol is not in the files, a bare TICKER security is created (it never matches anything).
- Validation in the prototype is minimal: quantity > 0 and cost >= 0.

Verification script (synthetic Freetrade-format CSV, GBP, run through the real `create_enhanced_calculator("csv")` pipeline, tax year 2024-2025):

```
BUY  50 VUSA @ 12.00 on 2024-05-01   (cost 600)
SELL 100 VUSA @ 15.00 on 2024-08-01  (proceeds 1500)  <- only 50 are held in the files
```

| Case | Proceeds | Cost | Gain |
|---|---|---|---|
| Without opening holding | 1500.00 | 600.00 | 900.00 |
| Opening 100 sh, total 1000 GBP, as at 2023-01-01 | 1500.00 | 1066.67 | 433.33 |
| Same, as at 2024-12-31 (clamped) | 1500.00 | 1066.67 | 433.33 |

Hand arithmetic:

- Without: the pool holds 50 sh at 600. The matcher matches only 50 shares (`match_qty = min(100, 50)`) and the other 50 sold shares get no cost at all. Proceeds are the full 1500, so gain = 1500 - 600 = 900. This is overstated.
- With: the pool is 100 + 50 = 150 sh at 1000 + 600 = 1600, average 10.6667. Selling 100 removes 100 * 10.6667 = 1066.67. Gain = 1500 - 1066.67 = 433.33. The 50-share buy at 12 is correctly blended into the average, not used first.
- The disposal's `acquisition_date` is the sell date for any pool match (the `POOL_MATCH_` transaction carries the sell date), so the opening date does not leak into the results rows.

Not verified (no network, only reasoning from code): behaviour with USD trades. See 4.3.

## 4. Findings on matching rules, reports and tax years

### 4.1 Matching rules

- A synthetic opening buy dated before the first trade of that ticker cannot be wrongly matched:
  - same-day needs an equal date, and by construction no trade of that ticker is on that date;
  - bed and breakfast only looks forward from a sell (`sell.date < b.date`), so an earlier buy is never in the 30-day window of a later sell;
  - only the Section 104 branch (`b.date.date() < sell.date.date()`) can consume it, which is the intent.
- Date choice: "day before the first trade of that ticker" is safer than "day before the earliest trade across all files". A global date would also work for matching, but per ticker is clearer and cannot collide with another ticker's rules. Clamping `min(as_at, day_before_first_trade)` also protects against a user entering an `as_at` after the first trade.
- Tax years: the matcher replays the entire history each time, and the pool is not reset at tax-year boundaries. If the opening `as_at` is in an earlier year than a first-trade SELL in the requested year, the pool is correctly carried forward (confirmed by the script: as_at 2023-01-01, sell in 2024-25). Earlier years' disposals are computed but filtered out of the summary.
- A split before the first trade in the files would not apply to the opening holding. The matcher ignores SPLIT, so this is a pre-existing limitation. The product should say "enter the quantity as it stood when the export starts" (open question 4).

### 4.2 Reports

- The results payload lists disposals only (`serialize_results`, `lambda_handler.py:1165` onward, `disposal_events`). It does not list acquisitions. `ResultsPage` and `PrintReportPage` render those events (`matching_rule` badges, `DisposalDetailsTable.tsx:213`, `PrintReportPage.tsx:490`). No acquisitions table exists, so an opening buy would not appear as a fresh purchase in the tax year. No report change is strictly needed for correctness.
- Still wanted: the disposal row for a pool match that used opening cost should carry a visible marker such as "includes user-entered opening balance (unverified)". That needs an `is_opening_balance` flag threaded through the matcher (the pooled transaction carries only a cost total). Cheap option: add a response-level `opening_holdings` echo plus a banner on the results page and the print report. This is the minimum that makes the numbers auditable for an accountant.
- Total allowable costs and the commission summary iterate transactions in the tax year. Opening buys have zero fees, so they add nothing.
- Portfolio and holdings analysis (`analysis_type` "portfolio" or "both") will include the opening shares with the entered cost, which is correct. Performance and holding-period metrics will see the synthetic date, which may need a caveat.
- The unrealised-gains endpoint (`lambda_handler.py:1018` onward) parses its own transactions from the files. It needs the same field and injection, otherwise holdings and unrealised gains disagree with `/calculate`.

### 4.3 ISA, other brokers, currencies

- ISA: nothing in these paths treats ISA holdings specially. If the user enters opening holdings for an ISA ticker, we would compute tax on it. The UI should say "taxable accounts only" (open question 3).
- Multiple brokers: matching is per security (ISIN, or symbol when either ISIN is empty), not per broker, which is correct for UK pooling. The prototype copies the first matching security from the files, so ISIN-keyed grouping works. If the same instrument has different symbols in different brokers' files, the user must enter the symbol used in the file that contains the sell.
- Multiple currencies: this is the main risk.
  - The user enters GBP, so the opening buy is GBP with rate 1.0 and its cost is right in isolation.
  - The matcher builds its `POOL_MATCH_` transaction by summing native-currency `price * quantity` of all pool candidates and assigning the SELL's currency (`transaction_matcher.py`, comment "Assuming same currency for now"). Mixing a GBP opening buy with USD buys, then selling in USD, treats the pound amount as dollars and multiplies by the sell-date rate. The result is wrong. This is by code reading, not run, because FX rates need the network.
  - The same problem exists today for any pool that mixes currencies or historical FX rates, so it is a pre-existing bug that opening holdings would expose more often (US stock bought before the export and entered in GBP is the most common case).
  - Fix options: (1) make the matcher sum GBP cost (`total_cost_in_base_currency`) and emit a GBP pooled transaction (small change, but it changes existing results and tests; HMRC pools are in GBP anyway); or (2) convert the opening cost into the ticker's file currency using the first trade's rate (hack, imprecise). Recommend (1) in the follow-up, with tests.

### 4.4 Validation

Server-side (authoritative), return 400 with a structured error:

- Body must be JSON, a list, max about 100 entries, only the keys `symbol`, `quantity`, `total_cost_gbp`, `as_at`.
- `symbol`: non-empty after trim, length <= 20, characters limited to letters, digits, `.`, `-`, `_`. Case-insensitive match against tickers in the uploaded files.
- Tickers not present in the files: reject with a clear message (they cannot affect any SELL and would only pollute holdings). Recommend reject over warn.
- `quantity`: finite, > 0, upper bound (for example 1e9). Fractional allowed (fractional-share brokers). Reject NaN and Infinity.
- `total_cost_gbp`: finite, >= 0, upper bound (for example 1e10). Zero is allowed (gifted or inherited shares) but the UI should warn, since HMRC rules differ for those.
- `as_at`: ISO `YYYY-MM-DD`, not in the future. Prototype clamps a date after the first trade to the day before it; the real build should either reject or report that clamping happened.
- Duplicate symbols: reject (one row per ticker).
- Opening quantity larger than the shortfall is allowed (the user may hold more than the sells need), but the UI should show the shortfall as a hint.
- Log counts only, never values (the project logs error files to S3; these are personal financial data).

### 4.5 Where the UI collects it, and `/inspect-file`

- UI: inside the "sell with no earlier buy" warning box (the X-ray from Tasks 7 to 9), one row per affected ticker with prefilled quantity (the shortfall), a total cost in GBP input, and an `as_at` date prefilled with the day before the first trade. A confirm button stores the rows in the calculator page state next to the file list. The same rows are sent on `/calculate` as a form field `opening_holdings` (JSON string).
- `/inspect-file` must accept the same field, because the X-ray expectation walk (sell-without-buy check) otherwise never clears. Cheapest design: in the walk, treat each opening holding as a BUY on the day before the ticker's first trade. That is a pure addition to the walk; the inspect handler stays stateless.
- State must be invalidated if the user removes or replaces files (the shortfall changes), and rows for tickers no longer present dropped.

## 5. UI and API shape proposed

```
POST /calculate  (multipart)
  file, file0, ... (as now)
  tax_year, analysis_type (as now)
  opening_holdings = '[{"symbol":"VUSA","quantity":100,"total_cost_gbp":1000.00,"as_at":"2023-01-01"}]'   # optional

POST /inspect-file  (same optional field)

Response additions:
  "opening_holdings": [ {symbol, quantity, total_cost_gbp, as_at_used, clamped: bool} ]
  per disposal event (phase 2): "uses_opening_balance": true
```

Backend plan: parse and validate in the handler (a small `opening_holdings.py` module with a pure `validate()` and `to_transactions()`), pass to `calculate_comprehensive_analysis(..., opening_holdings=...)`. Add `is_opening_balance: bool = False` to the domain `Transaction` (replacing the id prefix), which the matcher can copy into the pooled transaction.

## 6. Estimate

Backend (about 1 to 1.5 days incl. tests):
- `deployment/lambda_handler.py`: new form field in `parse_multipart_data_proper`, plumbing in `handle_calculation_request`, `/inspect-file`, `/unrealised-gains`; new 400 errors. Check `deployment/api_lambda_handler.py` for how it delegates.
- `src/main/python/capital_gains_calculator.py`: argument and injection (prototype exists).
- `src/main/python/models/domain_models.py`: `is_opening_balance` flag.
- `src/main/python/services/transaction_matcher.py`: GBP-cost pooling fix (the risky part; it changes existing numbers, so run the full unit suite including `test_cgt_rate_change`).
- `src/main/python/services/timeline_calculator.py`: include the opening buys.
- X-ray expectation walk in the inspect code (from Tasks 7 to 9).
- New tests: unit (validator, injection, no wrong same-day or 30-day matching, USD pool), integration (multipart with the field).

Frontend (about 1.5 to 2 days incl. tests): `CalculatorPage.tsx`, the X-ray warning component, `services/api.ts` and `calculationService.ts`, `types/calculation.ts`, `ResultsPage.tsx`, `PrintReportPage.tsx`, Jest tests, one Playwright flow.

Total roughly 3 to 4 days. Risk: medium. The injection is easy; the real risks are the mixed-currency pool costing (pre-existing bug that changes current outputs), the product risk of users entering wrong numbers that then appear in an accountant report, and corporate actions before the export.

Unknowns: how each converter sets `isin` versus `symbol` (matching relies on them); whether `api_lambda_handler.py` forwards new fields untouched; the actual FX behaviour (not run); whether the timeline and unrealised-gains endpoints can share the injection helper.

## 7. Open questions for the product owner

1. Are we willing to change pool costing to GBP-per-buy (HMRC-correct) as part of this work? It will change some existing results, probably for the better, and needs a regression pass.
2. Should an unverified user-entered opening balance be allowed to feed a "final" figure on the printable accountant report? Suggested wording: a prominent "includes user-entered opening balance of X for TICKER, unverified" line.
3. ISA and non-taxable holdings: do we only warn "taxable accounts only", or try to detect it?
4. Stock splits, mergers and spin-offs between the purchase and the first export: what do we tell the user?
5. Should zero cost be accepted (gifts, inherited shares, employee awards have different HMRC cost rules)?
6. Reject or warn for tickers not in the files, and for symbols that differ between brokers?
7. Should the user be able to enter the average price per share instead of total cost (many brokers show average price)?
8. Should opening holdings be remembered in the browser between visits, or per session only (privacy)?
