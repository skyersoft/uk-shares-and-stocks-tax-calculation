# Portfolio Timeline Graph — Implementation Tasks

## 🎯 Feature Overview

An interactive multi-line timeline chart showing how a portfolio's unrealised
value, unrealised gain/loss, HMRC-compliant realised gains, CGT, and income
evolve across transaction events and tax-year boundaries.

## 📐 Design Decisions

| Point | Decision |
|-------|----------|
| **Unrealised Value** | Total portfolio value at event time using the **Yahoo Finance historical closing price** for each security on the event date (converted to GBP via FX rate). |
| **Unrealised Gain/Loss** | Unrealised Value minus total cost basis of held positions. E.g. £90 − (10×£5 + 5×£6) = £10. |
| **Realised Gain/Loss** | HMRC-compliant disposal gain/loss: same-day rule, 30-day B&B rule, Section 104 pooling. Losses from commissions reduce the gain. Resets each tax year. Dividends/interest are **not** included here. |
| **Realised Tax** | CGT on realised gain/loss at event time: `max(0, gain − £3,000 AEA) × 18%` (basic rate, post Oct 2024). Resets each tax year. |
| **Income** | Cumulative dividends + interest received this tax year (separate from CGT lines). Resets each tax year. |
| **Year-end snapshot** | A `YEAR_END` marker event is inserted at April 5 each year showing: realised tax so far + **predictive "sell-all" unrealised CGT** for that year. For the last (current) year, current-date snapshot is also shown. |
| **Unrealised tax per event** | Only calculated at `YEAR_END` / current-date snapshots — **not** at every transaction (too expensive). |
| **Multi-events same date** | Ordered: BUY → SELL → DIVIDEND → INTEREST → other; tie-break by symbol alphabetically. |
| **Unrealised price source** | Uses yahoo finance to get the real value at the event time |

## 📊 Chart Lines (5 lines)

| # | Line | Colour | Resets per year? | Description |
|---|------|--------|-----------------|-------------|
| 1 | Unrealised Value | Blue | No | Total value of held positions at Yahoo Finance historical price on event date |
| 2 | Unrealised Gain/Loss | Teal | No | Line 1 minus cumulative cost basis of held positions |
| 3 | Realised Gain/Loss | Green/Red | Yes | Cumulative HMRC disposal net gain/loss this tax year |
| 4 | Realised Tax | Orange | Yes | CGT estimate on line 3 after £3k AEA |
| 5 | Income | Purple | Yes | Cumulative dividends + interest this tax year |

**Year-end event marker**: vertical dashed line at April 5 each year.
Tooltip shows: realised tax, unrealised gain (predictive sell-all CGT).
**Current-date marker**: shown for the last/ongoing tax year.

## 🏗️ Architecture

```
Backend: POST /timeline
  ↓ parse transactions (QFX/CSV via existing parsers)
  ↓ sort chronologically, apply tie-break ordering
  ↓ fetch Yahoo Finance historical prices for each security × event date (batch, cached)
  ↓ walk events, using yahoo_price[symbol][date] for unrealised value
  ↓ for each event:
      - update SharePool state (BUY/SELL via HMRC rules)
      - update unrealised value (Σ held_qty × yahoo_price[symbol][event_date] × fx for all securities)
      - update unrealised gain/loss (unrealised value − cost basis)
      - update realised gain/loss (HMRC disposal result)
      - update income (dividends + interest)
      - compute realised tax (CGT on realised gain, after AEA)
  ↓ at each April 5 boundary: emit YEAR_END event, reset year accumulators
  ↓ at current date (last year): emit CURRENT_DATE snapshot
  ↓ return ordered List[TimelineEvent]

Frontend: PortfolioTimelineChart component (Chart.js Line)
  ↓ calls POST /timeline
  ↓ builds 5 datasets from events
  ↓ renders line chart, X-axis = event labels (rotated 45°)
  ↓ vertical dashed annotations at YEAR_END / CURRENT_DATE markers
  ↓ rich hover tooltip per event
```

---

## 🗂️ Task List

### Phase 1 — Backend: `/timeline` Endpoint

#### Task 1.1 — Design `TimelineEvent` data model
- **File**: `src/main/python/models/timeline_models.py` (new)
- **Content**:
  ```python
  @dataclass
  class TimelineEvent:
      event_index: int
      event_date: str              # ISO "YYYY-MM-DD"
      tax_year: str                # "2024-2025"
      label: str                   # "BUY AAPL (10 shares @ £150.00)"
      event_type: str              # BUY | SELL | DIVIDEND | INTEREST | SPLIT | YEAR_END | CURRENT_DATE

      # Transaction details (None for YEAR_END / CURRENT_DATE)
      symbol: str | None
      quantity: float | None
      price_gbp: float | None
      currency: str | None

      # Running portfolio state at this event
      unrealised_value_gbp: float       # Σ (held_qty × last_known_price × fx) per security
      unrealised_gain_loss_gbp: float   # unrealised_value − total_cost_basis
      total_cost_basis_gbp: float       # cumulative cost of all held positions

      # Per-tax-year accumulators (reset at each YEAR_END)
      realised_gain_loss_gbp: float     # HMRC disposal net gain/loss this year
      realised_tax_gbp: float           # CGT on realised gain after AEA
      income_gbp: float                 # dividends + interest this year

      # Only populated for YEAR_END and CURRENT_DATE events
      predictive_sell_all_cgt_gbp: float | None  # CGT if all holdings sold now
  ```
- **Tests**: `tests/unit/test_timeline_models.py`
- **Status**: [ ] Not started

#### Task 1.2 — Implement `TimelineCalculator` service
- **File**: `src/main/python/services/timeline_calculator.py` (new)
- **Responsibilities**:
  - Accept `List[Transaction]`
  - Sort by date then event_type priority (BUY → SELL → DIVIDEND → INTEREST → other)
  - Maintain `last_known_price: Dict[str, float]` per security (updated on BUY/SELL)
  - Maintain `SharePoolManager` per security for HMRC cost basis tracking
  - Running values: `total_cost_basis_gbp`, `unrealised_value_gbp`, `unrealised_gain_loss_gbp`
  - Per-year accumulators: `realised_gain_loss_gbp`, `income_gbp` (reset at YEAR_END)
  - At `YEAR_END`: compute `realised_tax_gbp = max(0, realised_gain − AEA) × rate`, also compute `predictive_sell_all_cgt_gbp`
  - At `CURRENT_DATE` (today, only for last/ongoing year): same snapshot
  - Return `List[TimelineEvent]`
- **Key logic per event type**:
  - **BUY**: `last_known_price[symbol] = price_gbp`; add to `total_cost_basis_gbp`; recompute `unrealised_value_gbp` = Σ (qty × last_known_price) for all held securities
  - **SELL**: run HMRC matching via `SharePoolManager`; reduce `total_cost_basis_gbp` by allocated cost; add disposal result to `realised_gain_loss_gbp`; `last_known_price[symbol] = price_gbp`; recompute `unrealised_value_gbp`
  - **DIVIDEND/INTEREST**: `income_gbp += amount_gbp`
  - **YEAR_END**: snapshot all 7 running values → emit event; reset `realised_gain_loss_gbp`, `realised_tax_gbp`, `income_gbp` to 0
- **Tests**: `tests/unit/test_timeline_calculator.py`
  - `test_single_buy_sets_unrealised_value`
  - `test_subsequent_buy_reprices_all_held_shares` ← 10@£5 then 5@£6 → unrealised_value = 15×£6 = £90
  - `test_unrealised_gain_loss_is_value_minus_cost_basis` ← £90 − £80 = £10
  - `test_sell_reduces_cost_basis_and_unrealised_value`
  - `test_sell_after_buy_produces_hmrc_gain`
  - `test_sell_with_commission_reduces_gain`
  - `test_dividend_increments_income_not_realised_gain`
  - `test_interest_increments_income_not_realised_gain`
  - `test_year_end_marker_resets_year_totals`
  - `test_year_end_populates_predictive_cgt`
  - `test_multi_year_file_emits_multiple_year_ends`
  - `test_cgt_applies_annual_exemption_3000`
  - `test_events_sorted_chronologically_with_type_tiebreak`
  - `test_current_date_marker_appended_for_last_year`
  - `test_no_current_date_marker_for_completed_year`
- **Status**: [ ] Not started

#### Task 1.3 — Add `/timeline` route to `lambda_handler.py`
- **File**: `deployment/lambda_handler.py`
- **Route**: `POST /timeline`
- **Request**: multipart/form-data — file + optional tax_year
- **Response**:
  ```json
  {
    "transaction_count": 20,
    "event_count": 23,
    "tax_years_covered": ["2024-2025"],
    "events": [
      {
        "event_index": 0,
        "event_date": "2024-05-10",
        "tax_year": "2024-2025",
        "label": "BUY AAPL (10 shares @ £118.50)",
        "event_type": "BUY",
        "symbol": "AAPL",
        "quantity": 10,
        "price_gbp": 118.50,
        "currency": "USD",
        "unrealised_value_gbp": 1185.00,
        "unrealised_gain_loss_gbp": 0.0,
        "total_cost_basis_gbp": 1185.00,
        "realised_gain_loss_gbp": 0.0,
        "realised_tax_gbp": 0.0,
        "income_gbp": 0.0,
        "predictive_sell_all_cgt_gbp": null
      }
    ],
    "summary": {
      "final_unrealised_value_gbp": 34566.5,
      "final_unrealised_gain_loss_gbp": -12095.99,
      "final_total_cost_basis_gbp": 46662.49,
      "final_realised_gain_loss_gbp": 1293.40,
      "final_realised_tax_gbp": 0.0,
      "final_income_gbp": 0.0
    }
  }
  ```
- **Tests**: `tests/integration/test_timeline_endpoint.py`
- **Status**: [ ] Not started

---

### Phase 2 — Frontend: `PortfolioTimelineChart` Component

#### Task 2.1 — Add TypeScript types
- **File**: `frontend/src/types/timeline.ts` (new)
- **Content**: mirror `TimelineEvent` and full response shape from backend
- **Status**: [ ] Not started

#### Task 2.2 — Add `/timeline` API function to `api.ts`
- **File**: `frontend/src/services/api.ts`
- **Function**: `submitTimeline({ file, taxYear }) → TimelineResponse`
- **Status**: [ ] Not started

#### Task 2.3 — Implement `PortfolioTimelineChart` component
- **File**: `frontend/src/components/results/PortfolioTimelineChart.tsx` (new)
- **Library**: Chart.js `Line` via `react-chartjs-2`
- **5 datasets**:
  1. Unrealised Value — blue solid
  2. Unrealised Gain/Loss — teal solid (positive above zero, negative below)
  3. Realised Gain/Loss — green solid (positive) / red solid (negative)
  4. Realised Tax — orange solid
  5. Income (dividends + interest) — purple dashed
- **X-axis**: event labels rotated 45°, font size small
- **YEAR_END / CURRENT_DATE markers**: vertical dashed annotation lines (`afterDraw` hook — no extra plugin needed)
- **Tooltip**: all 5 values + event type + date + symbol on hover
- **Legend**: top, toggleable per dataset
- **Empty state**: "No timeline data available" placeholder
- **Status**: [ ] Not started

#### Task 2.4 — Unit tests for `PortfolioTimelineChart`
- **File**: `frontend/src/components/results/PortfolioTimelineChart.test.tsx` (new)
- **Tests**:
  - Renders without crashing given mock data
  - Renders exactly 5 datasets
  - YEAR_END events present in data
  - Empty state shown when events array is empty
  - Labels truncated at 30 chars
- **Status**: [ ] Not started

#### Task 2.5 — Integrate into `ResultsTabs`
- **File**: `frontend/src/components/results/ResultsTabs.tsx`
- **Change**: Add "Timeline" tab; render `PortfolioTimelineChart` inside; tab shown only when timeline data available
- **Status**: [ ] Not started

#### Task 2.6 — Wire up timeline fetch in `ResultsPage`
- **File**: `frontend/src/pages/ResultsPage.tsx`
- **Change**: After upload success, call `submitTimeline()` in parallel with `submitCalculation()`; pass result to `ResultsTabs`; handle loading/error states independently
- **Status**: [ ] Not started

---

### Phase 3 — QA & Polish

#### Task 3.1 — Integration test with real QFX files
- Run `/timeline` against `data/U11075163_20240408_20250404.qfx`
- Verify `final_realised_gain_loss_gbp` matches `/calculate` result (£1,293.40)
- Verify event count = transaction count + number of YEAR_END markers
- Verify `unrealised_value_gbp` > 0 for files with remaining holdings
- **Status**: [ ] Not started

#### Task 3.2 — E2E Playwright test
- **File**: `tests/e2e/test_timeline_graph.py`
- Upload sample file → navigate to Timeline tab → assert chart rendered → assert 5 legend items visible
- **Status**: [ ] Not started

#### Task 3.3 — Deploy and verify on production
- Package Lambda, `terraform apply`, smoke test `/timeline` with curl
- **Status**: [ ] Not started

---

## 📌 Design Decisions (confirmed by user)

| # | Topic | Resolution |
|---|-------|------------|
| 1 | Unrealised value | **Two lines**: Unrealised Value (qty × last transaction price) AND Unrealised Gain/Loss (value − cost basis). No external price API needed. |
| 2 | Realised value | HMRC-compliant disposals: same-day rule, 30-day B&B, Section 104 pooling. Commission losses reduce gain. |
| 3 | Realised tax | CGT % on realised gain (after £3k AEA). Resets each tax year. |
| 4 | Per-year reset | Yes — realised gain/loss, realised tax, income all reset at April 5 each year. |
| 5 | Unrealised tax frequency | Only at YEAR_END markers + current date for last year. NOT per transaction. |
| 6 | Dividends/interest | Separate **Income** line (5th line on chart). Not mixed into CGT lines. |
| 7 | CGT rate | 18% basic rate (post Oct 2024) as default |
| 8 | Tab vs page | Timeline tab in existing `ResultsTabs` |

---

## 📅 Implementation Order

1. **Task 1.1** — data model (unblocks everything)
2. **Task 1.2** — `TimelineCalculator` + full unit tests
3. **Task 2.1** — TypeScript types (can run in parallel with 1.2)
4. **Task 1.3** — `/timeline` Lambda route
5. **Task 2.2** — API client function
6. **Task 2.3 + 2.4** — React component + unit tests
7. **Task 2.5 + 2.6** — UI integration
8. **Task 3.1 → 3.3** — QA and deployment

