---
name: playwright-tests
description: Write and run Playwright TypeScript E2E tests for the React frontend following project conventions (role-based locators, web-first assertions, test.step). Use when adding or fixing browser/E2E/UI tests, including accessibility and mobile checks.
---

# Playwright tests

- Import `{ test, expect } from '@playwright/test'`; group a feature in `test.describe()`; common navigation in `beforeEach`.
- Locators: prefer user-facing (`getByRole`, `getByLabel`, `getByText`); avoid strict-mode violations by being specific.
- Assertions: auto-retrying web-first (`await expect(locator).toHaveText(...)`); use `toHaveCount`, `toHaveURL`, `toContainText`, and `toMatchAriaSnapshot` for structure. No hard-coded waits or inflated timeouts.
- Group interactions with `test.step()`; titles like `Feature - specific scenario`.
- Files: `<feature-or-page>.spec.ts`, one per major feature/page. Check `playwright.config.ts` for `testDir`; existing tests live under `tests/e2e` and `tests/ui`.
- Standard scenarios worth covering for result/table features: render and content, column sorting, upload error flow (e.g. CSV missing columns shows error alert with column names), mobile viewport, and accessibility (axe / roles).

Run: `npx playwright test --project=chromium [file] [-g "title"]`; debug with `--ui` or `--headed`. On failure, find the root cause, refine locators/assertions, re-run until stable.

Before finishing: locators accessible and specific, assertions reflect user expectations, naming consistent, tests pass repeatedly.
