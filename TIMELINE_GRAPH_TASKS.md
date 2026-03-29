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
      unrealised_value_gbp: float       # Σ (held_qty × yahoo_price[symbol][event_date] × fx) per security
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
  - Pre-fetch `yahoo_price: Dict[str, Dict[date, float]]` for all symbols × all event dates in one batch (via `yfinance`) — convert to GBP at event FX rate
  - Maintain `SharePoolManager` per security for HMRC cost basis tracking
  - Running values: `total_cost_basis_gbp`, `unrealised_value_gbp`, `unrealised_gain_loss_gbp`
  - Per-year accumulators: `realised_gain_loss_gbp`, `income_gbp` (reset at YEAR_END)
  - At `YEAR_END`: compute `realised_tax_gbp = max(0, realised_gain − AEA) × rate`, also compute `predictive_sell_all_cgt_gbp`
  - At `CURRENT_DATE` (today, only for last/ongoing year): same snapshot
  - Return `List[TimelineEvent]`
- **Key logic per event type**:
  - **BUY**: add to `total_cost_basis_gbp`; recompute `unrealised_value_gbp` = Σ (qty × yahoo_price[symbol][event_date] × fx) for all held securities
  - **SELL**: run HMRC matching via `SharePoolManager`; reduce `total_cost_basis_gbp` by allocated cost; add disposal result to `realised_gain_loss_gbp`; recompute `unrealised_value_gbp`
  - **DIVIDEND/INTEREST**: `income_gbp += amount_gbp`
  - **YEAR_END**: snapshot all 7 running values → emit event; reset `realised_gain_loss_gbp`, `realised_tax_gbp`, `income_gbp` to 0
- **Tests**: `tests/unit/test_timeline_calculator.py`
  - `test_single_buy_sets_unrealised_value`
  - `test_subsequent_buy_uses_yahoo_price_not_transaction_price` ← mock yahoo returns £6 after 2nd buy → unrealised_value = 15×£6 = £90
  - `test_unrealised_gain_loss_is_yahoo_value_minus_cost_basis` ← £90 − £80 = £10
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
- **Note**: This is the **single API endpoint** for the unified results page — it replaces separate calls to `/calculate` and `/unrealised-gains`. The response includes everything the UI needs.
- **Request**: multipart/form-data — **file only** (no `tax_year` parameter — backend derives it from the data)
- **`tax_year` in response**: the most recent tax year found in the uploaded file (e.g. `"2024-2025"`)
- **Response**:
  ```json
  {
    "transaction_count": 20,
    "event_count": 23,
    "tax_years_covered": ["2024-2025"],
    "tax_year": "2024-2025",

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
      "final_income_gbp": 0.0,
      "predictive_cgt_gbp": 0.0
    },

    "disposals": [
      {
        "disposal_date": "2024-09-15",
        "symbol": "AAPL",
        "quantity": 10,
        "proceeds": 1550.00,
        "cost_basis": 1185.00,
        "gain_or_loss": 365.00,
        "matching_rule": "section_104"
      }
    ],

    "holdings": [
      {
        "symbol": "MSFT",
        "name": "Microsoft Corp",
        "quantity": 25,
        "average_cost_gbp": 280.50,
        "total_cost_gbp": 7012.50,
        "current_value_gbp": 8200.00,
        "unrealized_gain_loss": 1187.50
      }
    ],

    "dividends": [
      {
        "payment_date": "2024-06-15",
        "symbol": "MSFT",
        "gross_amount_gbp": 45.00,
        "withholding_tax_gbp": 6.75,
        "net_amount_gbp": 38.25
      }
    ],

    "section_104_pools": {
      "MSFT": { "quantity": 25, "total_cost": 7012.50 }
    }
  }
  ```
- **Tests**: `tests/integration/test_timeline_endpoint.py`
  - `test_response_includes_events_summary_disposals_holdings_dividends_pools`
  - `test_summary_realised_matches_disposals_total`
  - `test_summary_predictive_cgt_matches_last_year_end_event`
- **Status**: [ ] Not started

---

### Phase 2 — Frontend: Unified Results Page

> **Architecture change**: The unified `ResultsPage` replaces the current split between the realised-tax view and the unrealised-gains view. A single `/timeline` API call powers everything. The existing `/calculate` call and the separate `UnrealisedGainsResults` branch in `ResultsPage` are retired.

#### Task 2.1 — Add TypeScript types
- **File**: `frontend/src/types/timeline.ts` (new)
- **Content**:
  ```typescript
  export interface TimelineEvent {
    event_index: number;
    event_date: string;
    tax_year: string;
    label: string;
    event_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'INTEREST' | 'SPLIT' | 'YEAR_END' | 'CURRENT_DATE';
    symbol: string | null;
    quantity: number | null;
    price_gbp: number | null;
    currency: string | null;
    unrealised_value_gbp: number;
    unrealised_gain_loss_gbp: number;
    total_cost_basis_gbp: number;
    realised_gain_loss_gbp: number;
    realised_tax_gbp: number;
    income_gbp: number;
    predictive_sell_all_cgt_gbp: number | null;
  }

  export interface TimelineSummary {
    final_unrealised_value_gbp: number;
    final_unrealised_gain_loss_gbp: number;
    final_total_cost_basis_gbp: number;
    final_realised_gain_loss_gbp: number;
    final_realised_tax_gbp: number;
    final_income_gbp: number;
    predictive_cgt_gbp: number;
  }

  export interface TimelineDisposal {
    disposal_date: string;
    symbol: string;
    quantity: number;
    proceeds: number;
    cost_basis: number;
    gain_or_loss: number;
    matching_rule: string;
  }

  export interface TimelineHolding {
    symbol: string;
    name: string;
    quantity: number;
    average_cost_gbp: number;
    total_cost_gbp: number;
    current_value_gbp: number;
    unrealized_gain_loss: number;
  }

  export interface TimelineDividend {
    payment_date: string;
    symbol: string;
    gross_amount_gbp: number;
    withholding_tax_gbp: number;
    net_amount_gbp: number;
  }

  export interface TimelineResponse {
    transaction_count: number;
    event_count: number;
    tax_years_covered: string[];
    tax_year: string;
    events: TimelineEvent[];
    summary: TimelineSummary;
    disposals: TimelineDisposal[];
    holdings: TimelineHolding[];
    dividends: TimelineDividend[];
    section_104_pools: Record<string, { quantity: number; total_cost: number }>;
  }
  ```
- **Status**: [ ] Not started

#### Task 2.2 — Replace `submitCalculation` with `submitTimeline` in `api.ts`
- **File**: `frontend/src/services/api.ts`
- **Change**: Add `submitTimeline({ file }): Promise<TimelineResponse>` — `POST /prod/timeline` (prod) or `/timeline` (local). **No `taxYear` parameter** — the backend derives it from the file. Keep `submitCalculation` as a deprecated alias pointing to `submitTimeline` during the transition (deleted in Task 2.7).
- **Status**: [ ] Not started

#### Task 2.3 — New `TimelineSummaryMetrics` component
- **File**: `frontend/src/components/results/TimelineSummaryMetrics.tsx` (new)
- **Purpose**: Replaces `ResultsMetricsSummary` with timeline-driven 4-card KPI row
- **4 cards** (all values from `TimelineSummary`):

  | Card | Value field | Border colour |
  |------|-------------|---------------|
  | Realised Gain / Loss | `final_realised_gain_loss_gbp` | green (positive) / red (negative) |
  | Capital Gains Tax Due | `final_realised_tax_gbp` | orange |
  | Portfolio Value (Unrealised) | `final_unrealised_value_gbp` | blue |
  | Predictive CGT if sold today | `predictive_cgt_gbp` | purple |

- **Tests**: `frontend/src/components/results/TimelineSummaryMetrics.test.tsx`
  - Renders 4 cards
  - Realised Gain/Loss card has green border when positive, red when negative
  - Predictive CGT shows £0.00 when zero (not blank)
- **Status**: [ ] Not started

#### Task 2.4 — New `PortfolioTimelineChart` component
- **File**: `frontend/src/components/results/PortfolioTimelineChart.tsx` (new)
- **Library**: Chart.js `Line` via `react-chartjs-2`
- **5 datasets** (built from `events[]`):
  1. Unrealised Value — blue solid
  2. Unrealised Gain/Loss — teal solid
  3. Realised Gain/Loss — green/red solid (resets at YEAR_END)
  4. Realised Tax — orange solid (resets at YEAR_END)
  5. Income — purple dashed (resets at YEAR_END)
- **X-axis**: `event_date` values, rotated 45°, small font
- **YEAR_END / CURRENT_DATE markers**: vertical dashed lines via `afterDraw` plugin hook (no extra npm package)
- **Tooltip**: `label`, `event_type`, `event_date` + all 5 running values on hover
- **Legend**: top, each dataset toggleable independently
- **Empty state**: "No timeline data — upload a file to see your portfolio history"
- **Tests**: `frontend/src/components/results/PortfolioTimelineChart.test.tsx`
  - Renders without crash given mock `events[]`
  - Exactly 5 datasets in chart config
  - Empty state shown when `events` is `[]`
  - YEAR_END events present in X labels
- **Status**: [ ] Not started

#### Task 2.5 — New `UnrealisedTaxPredictionCard` component
- **File**: `frontend/src/components/results/UnrealisedTaxPredictionCard.tsx` (new)
- **Purpose**: Inline card replacing the separate unrealised-gains page
- **Data source**: `TimelineSummary` + `TimelineHolding[]`
- **Content**:
  - Portfolio value today: `final_unrealised_value_gbp`
  - Unrealised gain/loss: `final_unrealised_gain_loss_gbp`
  - Predictive CGT (sell-all scenario): `predictive_cgt_gbp`
  - Holdings table (sortable by `unrealized_gain_loss` desc)
  - HMRC AEA info badge: "£3,000 Annual Exempt Amount applies"
- **Tests**: `frontend/src/components/results/UnrealisedTaxPredictionCard.test.tsx`
  - Holdings table renders correct row count
  - AEA badge is visible
  - Predictive CGT formatted as GBP currency
- **Status**: [ ] Not started

#### Task 2.6 — Refactor `ResultsTabs` to consume timeline data shapes
- **File**: `frontend/src/components/results/ResultsTabs.tsx`
- **Change**: Replace `NormalizedResults`/`TaxCalculation` props with a single `data: TimelineResponse` prop. Map:
  - Disposals tab ← `data.disposals`
  - Holdings tab ← `data.holdings`
  - Dividends tab ← `data.dividends`
  - Section 104 Pools tab ← `data.section_104_pools`
- The chart lives **above** the tabs (in `ResultsPage`), not inside a tab
- **Status**: [ ] Not started

#### Task 2.7 — Refactor `ResultsPage.tsx` to unified layout
- **File**: `frontend/src/pages/ResultsPage.tsx`
- **Single data source**: `state.timelineResult: TimelineResponse | null` (add to `CalculationContext`)
- **Remove**: `state.result`, `state.raw`, `normalizedResults` memo, `unrealisedGainsData` branch, `submitCalculation()` call, `UnrealisedGainsResults` import
- **New layout** (top to bottom):
  ```
  ┌─────────────────────────────────────────────────┐
  │ Header row: Tax Year · New Calculation · Print   │
  ├─────────────────────────────────────────────────┤
  │ TimelineSummaryMetrics (4 KPI cards)             │
  ├─────────────────────────────────────────────────┤
  │ PortfolioTimelineChart (full-width, ~400px tall) │
  ├───────────────────────┬─────────────────────────┤
  │ DetailedTaxBreakdown  │ UnrealisedTaxPrediction  │
  │ (realised / HMRC)     │ Card (predictive / sell) │
  ├───────────────────────┴─────────────────────────┤
  │ ResultsTabs (Disposals / Holdings / Dividends /  │
  │              Section 104 Pools)                  │
  ├─────────────────────────────────────────────────┤
  │ AdditionalIncomeInputs · CallToAction            │
  └─────────────────────────────────────────────────┘
  ```
- **CalculationContext** changes:
  - Add `timelineResult: TimelineResponse | null` to state
  - Add `SET_TIMELINE_RESULT` action
  - `submitTimeline()` dispatches `SET_TIMELINE_RESULT` on success
- **Wizard changes**:
  - Remove `taxYear` field from `WizardData` (file: `frontend/src/types/calculator.ts`)
  - Remove `<select id="taxYear">` from `IncomeSourcesStep` (file: `frontend/src/components/calculator/steps/IncomeSourcesStep.tsx`)
  - Remove `taxYear` default + validation from `MultiStepCalculator` (file: `frontend/src/components/calculator/MultiStepCalculator.tsx`)
  - Remove `analysisType` step; all file uploads go to `/timeline`
  - `tax_year` is read from the `TimelineResponse` returned by the backend
- **Status**: [ ] Not started

#### Task 2.8 — Unit tests for unified `ResultsPage`
- **File**: `frontend/src/pages/ResultsPage.test.tsx`
- **Tests**:
  - Loading state renders `LoadingSpinner` while `submitTimeline` in-flight
  - After mock `TimelineResponse`: renders 4 KPI cards
  - After mock `TimelineResponse`: renders `PortfolioTimelineChart`
  - After mock `TimelineResponse`: renders `UnrealisedTaxPredictionCard`
  - After mock `TimelineResponse`: `ResultsTabs` shows correct disposal count badge
  - Error state renders "Calculation Error" alert with retry button
  - Idle state renders "Start Tax Calculation" CTA
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
| 1 | Unrealised value | **Two lines**: Unrealised Value (qty × Yahoo Finance historical closing price on event date) AND Unrealised Gain/Loss (value − cost basis). Uses `yfinance` library for price fetch. |
| 2 | Realised value | HMRC-compliant disposals: same-day rule, 30-day B&B, Section 104 pooling. Commission losses reduce gain. |
| 3 | Realised tax | CGT % on realised gain (after £3k AEA). Resets each tax year. |
| 4 | Per-year reset | Yes — realised gain/loss, realised tax, income all reset at April 5 each year. |
| 5 | Unrealised tax frequency | Only at YEAR_END markers + current date for last year. NOT per transaction. |
| 6 | Dividends/interest | Separate **Income** line (5th line on chart). Not mixed into CGT lines. |
| 7 | CGT rate | 18% basic rate (post Oct 2024) as default |
| 8 | Unified results page | Single `ResultsPage` shows realised tax, unrealised prediction, and timeline chart together — no separate views or modes |
| 9 | Single API endpoint | `/timeline` is the only call made from the React frontend. It returns `events` + `summary` + `disposals` + `holdings` + `dividends` + `section_104_pools`. The legacy `/calculate` endpoint is retained server-side for backward compatibility but no longer called by the React frontend. |
| 10 | Tax year selection | **Removed from wizard.** The backend determines all tax years from the uploaded data. `summary` and KPI cards reflect the **most recent (last) tax year** found in the file. The timeline chart displays **all years**. `tax_year` is no longer sent in the request — it is derived server-side and returned in the response. `WizardData.taxYear` field and the `<select id="taxYear">` in `IncomeSourcesStep` are deleted. |

---

## 📅 Implementation Order

1. **Task 1.1** — `TimelineEvent` data model
2. **Task 1.2** — `TimelineCalculator` service + 15 unit tests ← longest task
3. **Task 1.3** — `/timeline` Lambda route with extended response (disposals, holdings, dividends, pools)
4. **Task 2.1** — TypeScript types (can start in parallel with 1.2)
5. **Task 2.2** — `submitTimeline()` API function
6. **Task 2.3** — `TimelineSummaryMetrics` component + tests
7. **Task 2.4** — `PortfolioTimelineChart` component + tests
8. **Task 2.5** — `UnrealisedTaxPredictionCard` component + tests
9. **Task 2.6** — `ResultsTabs` refactor to timeline data shapes
10. **Task 2.7** — `ResultsPage` unified layout + `CalculationContext` changes
11. **Task 2.8** — `ResultsPage` unit tests
12. **Task 3.1 → 3.3** — Integration tests, E2E, deployment

