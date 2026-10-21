---
name: frontend-feature
description: Implement and test a React/TypeScript UI change in frontend/src (results tables, currency display, badges, calculator error handling). Use when changing pages, components, or frontend types for the CGT calculator.
---

# Frontend feature workflow

1. Types first: update `frontend/src/types/calculation.ts` to match the backend contract. Components can start against mocked API data.
2. Build components under `frontend/src/components/` (shared helpers in `frontend/src/utils/`, e.g. `currency.ts`); wire into `pages/ResultsPage.tsx` / `pages/CalculatorPage.tsx`. API goes through `services/api.ts` only; the prod path is `/prod/calculate`, local `/calculate`.
3. Conventions:
   - Dual-currency display via `CurrencyDisplay` (original currency plus GBP); format with shared utilities, never ad hoc.
   - Matching-rule badges for same-day, 30-day (B&B), Section 104.
   - Tables: sortable columns, mobile-friendly (horizontal scroll or responsive layout), accessible roles/labels.
   - Surface API validation errors (400 with `missing_columns`) as a visible alert listing the missing columns with a help link.
   - `vite-react-ssg` pre-renders pages: no browser globals at module scope.
4. Tests: Jest + Testing Library in `frontend/src/__tests__/` (or `*.test.tsx`), then Playwright E2E (see the `playwright-tests` skill).
5. Verify: `npm run test:unit`, `npm run type-check`, `npm run build:spa`, and look at it in the dev server (`npm run dev:spa`) with a real upload before claiming done.
