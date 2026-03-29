# Portfolio Timeline Graph — Implementation Tasks

## 🎯 Feature Overview

An interactive multi-line timeline chart showing how a portfolio's cost basis,
realised gains/losses, cumulative CGT, and dividend income evolve across every
transaction event in the uploaded file.

## 📐 Design Decisions

| Ambiguity | Decision |
|-----------|----------|
| "Unrealised value" | Cumulative **cost basis** of currently held positions at each event (no historical prices needed; pure transaction maths) |
| "Realised value" | Cumulative **net gain/loss** from disposals (proceeds − cost basis − expenses) |
| "Realised tax" | Running estimated CGT applying the £3,000 AEA at time of each event |
| Tax year scope | Full file across all tax years; each tax year gets its own year-end marker; lines reset per year |
| Dividends | Plotted as events on X-axis; contribute to a 4th **Dividend Income** line (separately from CGT lines) |
| Multi-events same date | Ordered: BUY → SELL → DIVIDEND → other; tie-break by symbol alphabetically |

## 📊 Chart Lines

| Line | Colour | Description |
|------|--------|-------------|
| Cost Basis (unrealised) | Blue | Cumulative cost of currently held shares |
| Realised Gain/Loss | Green (gain) / Red (loss) | Cumulative net disposal gain/loss this tax year |
| Estimated CGT | Orange | Running estimated CGT on realised gains (after £3k AEA) |
| Dividend Income | Purple | Cumulative gross dividend income this tax year |

**Year-end event marker**: vertical dashed line; label includes both realised
CGT and predictive "sell-all" CGT at that point.

## 🏗️ Architecture

```
Backend: POST /timeline
  ↓ parse transactions
  ↓ sort chronologically
  ↓ for each event compute running portfolio state
  ↓ return ordered list of TimelineEvent[]

Frontend: PortfolioTimelineChart component
  ↓ calls /timeline endpoint
  ↓ renders Chart.js Line chart
  ↓ shows event labels on X-axis (slanted)
  ↓ year-end markers as vertical annotations
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
      event_date: str            # ISO date "YYYY-MM-DD"
      tax_year: str              # "2024-2025"
      label: str                 # "BUY AAPL (10 shares)"
      event_type: str            # BUY | SELL | DIVIDEND | INTEREST | SPLIT | YEAR_END
      symbol: str
      quantity: float
      price: float
      currency: str
      # Running portfolio state at this event
      cost_basis_gbp: float      # cumulative cost of held positions
      realised_gain_loss_gbp: float  # cumulative net gain/loss this tax year
      estimated_cgt_gbp: float   # running CGT after AEA
      dividend_income_gbp: float # cumulative dividends this tax year
      # Extra for YEAR_END events
      predictive_sell_all_cgt_gbp: float | None
  ```
- **Tests**: `tests/unit/test_timeline_models.py`
- **Status**: [ ] Not started

#### Task 1.2 — Implement `TimelineCalculator` service
- **File**: `src/main/python/services/timeline_calculator.py` (new)
- **Responsibilities**:
  - Accept `List[Transaction]`
  - Sort by date, apply tie-break ordering
  - Maintain running `SharePoolManager` state per security
  - Maintain running `cost_basis_gbp`, `realised_gain_loss_gbp`, `estimated_cgt_gbp`, `dividend_income_gbp` per tax year
  - Reset year counters and emit `YEAR_END` event at April 5 each year
  - Return `List[TimelineEvent]`
- **Key logic**:
  - BUY: `cost_basis_gbp += quantity * price * fx_rate`
  - SELL: use `SharePoolManager` to get allocated cost → update both `cost_basis_gbp` and `realised_gain_loss_gbp`
  - DIVIDEND: `dividend_income_gbp += amount_gbp`
  - `estimated_cgt_gbp = max(0, realised_gain_loss_gbp - 3000) * cgt_rate`
  - `YEAR_END` marker: snapshot all values, reset year accumulators
- **Tests**: `tests/unit/test_timeline_calculator.py`
  - test_single_buy_increases_cost_basis
  - test_sell_after_buy_produces_gain
  - test_sell_after_buy_produces_loss
  - test_dividend_increments_dividend_income
  - test_year_end_marker_resets_year_totals
  - test_multi_year_file_emits_multiple_year_ends
  - test_events_sorted_chronologically
  - test_cgt_applies_annual_exemption
- **Status**: [ ] Not started

#### Task 1.3 — Add `/timeline` route to `lambda_handler.py`
- **File**: `deployment/lambda_handler.py`
- **Route**: `POST /timeline`
- **Request**: multipart/form-data — same shape as `/calculate` (file + tax_year)
- **Response**:
  ```json
  {
    "tax_year": "2024-2025",
    "transaction_count": 20,
    "events": [ ...TimelineEvent... ],
    "summary": {
      "tax_years_covered": ["2024-2025"],
      "final_cost_basis_gbp": 34566.5,
      "final_realised_gain_loss_gbp": 1293.4,
      "final_estimated_cgt_gbp": 0.0,
      "final_dividend_income_gbp": 0.0
    }
  }
  ```
- **Tests**: `tests/integration/test_timeline_endpoint.py`
- **Status**: [ ] Not started

---

### Phase 2 — Frontend: `PortfolioTimelineChart` Component

#### Task 2.1 — Add TypeScript types
- **File**: `frontend/src/types/timeline.ts` (new)
- **Content**: mirror `TimelineEvent` and response shape from backend
- **Status**: [ ] Not started

#### Task 2.2 — Add `/timeline` API function to `api.ts`
- **File**: `frontend/src/services/api.ts`
- **Function**: `submitTimeline({ file, taxYear })` → `TimelineResponse`
- **Status**: [ ] Not started

#### Task 2.3 — Implement `PortfolioTimelineChart` component
- **File**: `frontend/src/components/results/PortfolioTimelineChart.tsx` (new)
- **Library**: Chart.js `Line` chart via `react-chartjs-2`
- **Features**:
  - 4 datasets: Cost Basis (blue), Realised Gain/Loss (green), Est. CGT (orange), Dividend Income (purple)
  - X-axis: event labels, rotated 45° (too many to show flat)
  - Vertical annotation lines for `YEAR_END` events (use `chartjs-plugin-annotation` OR manual drawing with `afterDraw` hook)
  - Responsive, legend at top
  - Tooltip shows all 4 values + event details on hover
- **Status**: [ ] Not started

#### Task 2.4 — Unit tests for `PortfolioTimelineChart`
- **File**: `frontend/src/components/results/PortfolioTimelineChart.test.tsx` (new)
- **Tests**:
  - Renders without crashing given mock data
  - Renders correct number of datasets
  - Year-end markers rendered
  - Empty state handled (no events)
- **Status**: [ ] Not started

#### Task 2.5 — Integrate into `ResultsPage` / `ResultsTabs`
- **File**: `frontend/src/components/results/ResultsTabs.tsx`
- **Change**: Add "Timeline" tab that renders `PortfolioTimelineChart`
- **Trigger**: Tab is shown only when timeline data is available (file re-analysed with timeline endpoint)
- **Status**: [ ] Not started

#### Task 2.6 — Wire up timeline fetch in `ResultsPage`
- **File**: `frontend/src/pages/ResultsPage.tsx`
- **Change**: After file upload success, also call `submitTimeline()` in parallel with `submitCalculation()`; pass result to `ResultsTabs`
- **Status**: [ ] Not started

---

### Phase 3 — QA & Polish

#### Task 3.1 — Integration test with real QFX files
- Run `/timeline` against `data/U11075163_20240408_20250404.qfx`
- Verify event count matches transaction count + YEAR_END markers
- Verify final realised gain matches `/calculate` result (£1,293.40)
- **Status**: [ ] Not started

#### Task 3.2 — E2E Playwright test
- **File**: `tests/e2e/test_timeline_graph.py`
- Upload sample file → navigate to Timeline tab → assert chart rendered
- **Status**: [ ] Not started

#### Task 3.3 — Deploy and verify on production
- Package, terraform apply, smoke test `/timeline` endpoint
- **Status**: [ ] Not started

---

## 📌 Open Questions (to confirm with user)

These decisions were made autonomously and should be validated:

1. **Unrealised value = cost basis** (not market value). If market-value tracking is preferred, backend needs historical price fetch per event date — much more complex.
2. **CGT rate applied**: Using 18% (basic rate, post Oct 2024) as default estimate. Higher rate (24%) could be an option.
3. **Line reset per tax year**: Each tax year starts accumulators at zero. Alternative: running totals across all years.
4. **Timeline tab vs separate page**: Added as a tab in `ResultsTabs`. Could be a separate page if preferred.
5. **Dividend line**: Included as 4th line. Can be hidden by default if too noisy.

---

## 📅 Implementation Order

1. Task 1.1 → Task 1.2 → Task 2.1 (models first, unblock both sides)
2. Task 1.3 (once 1.2 works)
3. Task 2.2 → Task 2.3 → Task 2.4 (frontend, can parallel with 1.3)
4. Task 2.5 → Task 2.6 (integration into UI)
5. Task 3.1 → Task 3.2 → Task 3.3 (QA)
