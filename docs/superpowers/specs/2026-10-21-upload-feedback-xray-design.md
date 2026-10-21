# Upload feedback: "File X-ray" and IBKR Activity Statement support

Date: 2026-10-21. Status: draft for approval. Nothing is built yet.

## Why

Production error logs (87 saved failures, plus session analytics) show that people who upload a file we cannot use mostly give up: 86 identical re-uploads, 9 edited files, 7 of 9 failed sessions abandoned in 30 days. Today a failure produces one generic red line ("Could not detect broker") or a plain-text alert at calculate time. It names no column, no format, no next step.

The largest failure group is not user error: **83 of the saved failures (about 95% of the 87 saved failure files) are IBKR Activity Statement CSVs** that we do not support. A sample of 79 of those files shows:

- 57 contain a `Trades` section; 46 contain stock trades (1,477 buys, 1,156 sells).
- Every trade row is `DataDiscriminator = Order` (no subtotal rows). Dates are `YYYY-MM-DD, HH:MM:SS`. Buy/sell is the sign of `Quantity`.
- Columns present: Symbol, Date/Time, Quantity, T. Price, Proceeds, Comm/Fee, Currency.
- Asset categories in Trades: Stocks 2,633, Options 1,986, Forex 1,145, Futures 1,013, Commodities 262, Bonds 5.
- At least five header variants (with or without `Account`, `C. Price`, `Realized P/L %`, `Notional Value`).
- About 22 files have no `Trades` section (probably statement periods with no trades; not confirmed).

## Intent

Make every upload tell the user, immediately and specifically, what we understood, what we could not see, and what we expect, and end every failure with a concrete next action. Stop failing on the file format that most failing users actually have.

## Goals

1. **Support the IBKR Activity Statement** by converting its `Trades` section (stocks only) so these files calculate with no extra user effort.
2. **File X-ray panel** shown under each file right after upload:
   - progress strip: Format, Columns, Rows, Ready (each green/amber/red);
   - per-column table: user's header, what we read it as, fill bar and count of filled vs blank cells, sample values with problem cells marked, status (understood / check / ignored / blocked);
   - three boxes: what we can see (counts, tickers, currencies, date range, tax years covered), what we cannot see (skipped rows by reason, missing history before the first buy), what we expect (each sell has an earlier buy; names the sells that do not).
3. **Every failure ends in an action**, never a dead end. Distinct screens for: wrong file type, empty file, recognised-but-unsupported format, recognised but no trades in the file, unknown format.
4. **Server is the single source of understanding.** One new endpoint returns the X-ray as JSON; the browser only renders it.

## Non-goals

- Not changing tax calculation logic.
- Not supporting options, futures, forex or commodities trades from the Activity Statement. They are skipped and listed under "cannot see".
- Not parsing dividends or withholding tax from the Activity Statement in this phase.
- Not storing or collecting failed uploads. Privacy wording and an opt-in "send us this file" flow are a separate piece of work (the user said saving data is not the main problem now).
- Not restructuring the wizard step order in this phase (see Open for later).

## Anti-goals

- The X-ray saying "understood" for a file the calculator then rejects. Both must use the same code path.
- A technical, dense table that a non-technical user cannot read.
- Blocking users on warnings that do not change the result.

## Constraints

- Python Lambda package is near its size limit (about 52.6 MB direct upload): no new heavy dependencies.
- Follow repo conventions: interfaces first (`interfaces/broker_converter.py`), converters register via `ConverterFactory`, TDD, `from main.python...` imports in Lambda.
- Frontend is React 18 + TS + Bootstrap built with vite-react-ssg: no browser-only globals at module scope.
- Existing endpoints `/detect-broker` and `/calculate` must keep working for current clients.
- Test data must be synthetic. No real customer values in the repo.

## Decisions (as decided with the user)

- Understanding lives on the server; the browser does only instant cheap checks (extension, first-bytes sniff for PDF/RTF/ZIP/Excel, empty file).
- A fingerprint registry identifies known formats, supported or not. A fingerprint is a set of required headers or markers (for example `Statement,Header,Field Name` in the first rows).
- Build the Activity Statement converter and the X-ray for single-format files first. Column mapping for unknown brokers (user picks columns from dropdowns) is a later phase.
- Colour/status vocabulary: green understood, amber needs a look, red blocked, grey ignored.

## Design

### 1. IBKR Activity Statement converter

New `IBKRActivityStatementConverter` registered in `ConverterFactory`.

- Detection: first non-empty row begins `Statement,Header,Field Name` (after stripping BOM, which can be repeated). Confidence high when that marker and a `Trades,Header` row are both present; moderate when only the first.
- Parse by section: the first column is the section name, the second is `Header` / `Data` / `SubTotal` / `Total`. Read only `Trades` `Data` rows. Map columns by header name (not position) to cope with the five header variants.
- Row rules: keep `Asset Category = Stocks` (and `ETFs` if present; builder to confirm exact IBKR label); skip all other categories and count them by category for the X-ray. Quantity sign gives BUY/SELL. Price = `T. Price`. Fees = absolute `Comm/Fee`. Currency from `Currency`. Date from `Date/Time` (also tolerate the quoted comma form).
- Output `StandardTransaction` like other converters. Unknown/unsupported rows are skipped, never raised, and reported as counts with reasons.
- Pence/GBX handling should follow the Trading 212 converter's approach where the currency column indicates it.
- Synthetic fixtures covering each of the five header variants, a file with no Trades section, and a file with only non-stock trades.

### 2. Inspect endpoint

New `POST /inspect-file` on the Lambda (Terraform route needed). Input: same multipart/body as `/detect-broker`. Output JSON (shape for builder to finalise, but must contain):

- `format`: `{ id, name, confidence, supported }` or null.
- `verdict`: `ready | ready_with_warnings | blocked | unsupported_format | no_trades | unknown`.
- `columns`: list of `{ header, mapped_to | null, status, filled, blank, samples[] }`.
- `rows`: `{ total, usable, skipped: [{reason, count}] }`.
- `summary`: buys, sells, tickers, currencies, date range, tax years covered.
- `expectations`: list of `{ rule, passed, details[] }`, including "sells with no earlier buy in this file" and "history starts after the beginning of the tax year".
- `next_actions`: ordered list of `{ id, label }` the UI renders as buttons.

The endpoint reuses each converter's own detection and parsing so results match `/calculate`. It does not write the file anywhere.

### 3. Fingerprint registry

A table of known formats with `supported` flag and, for unsupported ones, a help link and explanation text. Seeded with: IBKR Activity Statement (supported once section 1 lands), IBKR Flex Query CSV, IBKR QFX, Trading 212, Freetrade, Hargreaves Lansdown, Fidelity, plus known-unsupported shapes seen in the logs (Portfolio Summary exports, "Security movements for:" statements, realised P/L / cost-basis reports such as "Date acquired, Quantity, Cost basis"). The builder should confirm these shapes from the error logs.

### 4. Frontend X-ray

- Component under each file in `MultiFileUpload.tsx`, replacing the current one-line detection result and `FileValidationPreview` failure alert.
- Triggered after upload; shows skeleton while the call runs.
- Renders the strip, column table, three boxes and next-action buttons from the JSON only.
- Failure screens: wrong file type (browser-side, instant), empty file, unsupported format (name it, say what we need, how to export it), no trades in this statement, unknown format (best guess, "pick your broker", "contact us").
- Mobile: table collapses to cards, one per column, problem columns first.
- Replace the plain-text calculate-time error with the same structured display where the backend returns missing columns / unsupported broker.
- Warnings never block Continue; red (blocked) disables Continue for that file and offers actions.

### 5. Telemetry

Extend existing tracking with the X-ray `verdict` per upload and the action the user took next, so we can see whether the new screens retain users.

## Left to the builder

- Final JSON field names and error codes.
- Exact IBKR asset category labels to include as stocks.
- How to compute "history starts too late" (heuristic thresholds).
- Visual styling within Bootstrap; accessible colour use (do not rely on colour alone).
- Test split across unit, Jest and Playwright.

## Open for later (not this phase)

- Column-mapping UI for unknown brokers and a backend that accepts a mapping.
- Opt-in "send us this file" and updated privacy wording (the calculator page and Privacy page say data is never stored, but failed uploads are currently saved to S3).
- Moving upload earlier in the wizard.
- Activity Statement dividends and withholding tax.

## Decision: sells with no earlier buy (decided by the user)

A sell with no earlier buy in any uploaded file is an **amber warning, not a block**. The user may continue only after ticking "I understand my history is incomplete". The warning must contain three things:

1. **Which sells.** Name each affected sell (ticker, date, quantity).
2. **How it affects the result.** The Section 104 pool for that ticker is missing shares and their cost, so the allowable cost is understated or zero and the calculated gain is overstated (possibly the whole proceeds treated as gain). Say this in plain words, with the count of affected disposals and, where computable, the share of total gain they represent.
3. **How to fix it.** Two routes, each a button: (a) add an earlier export that covers the missing purchases (with a one-line hint on how far back to go: the date of the first purchase of that holding); (b) add opening holdings for the ticker (quantity and total cost in GBP, as at a stated date), entered in the UI. The builder decides how opening holdings reach the calculation (for example as synthetic buy transactions); this needs a short spike because the calculator has no opening-balance input today.

If opening holdings turn out to be large, the first release may ship route (a) only, with route (b) shown as "coming soon"; that is the builder's call and should be flagged to the user.

## Answers from the builder check

- **The 22 files with no `Trades` section** (inspected): all are Activity Statements that were generated without trade detail. They contain summary sections only (Mark-to-Market and Realized & Unrealized Performance Summary give per-symbol totals, not individual trades; 3 have neither; one is a Chinese-localised statement). They cannot be calculated: HMRC matching needs each trade. So `no_trades` is correct, but the screen has two variants: (a) summary rows present with non-zero activity: "your statement was generated without the Trades section; re-run it with Trades enabled (or use a Flex Query)"; (b) no activity: "no trades in this period; upload a period that has trades". Localised section names (non-English statements) are not supported in this phase; they show as unsupported format with a note to export in English.
- **Multi-file**: `/calculate` already receives all files together (`api.ts` appends every file), so `/inspect-file` also takes all files in one request, returns one X-ray per file, and computes the cross-file expectations (sell with no earlier buy) on the combined, date-sorted trades. A sell in file B matched by a buy in file A is not flagged.
- **Telemetry**: extend the existing frontend tracking helpers (where `trackCalculationError` lives). No new system.

## My calls (not the user's decisions)

- Converters keep their `convert()` contract. Inspection is a new optional `inspect()` on the base converter class with a default implementation built from the converter's own parse step, so other brokers are unaffected until they opt in. The IBKR Activity Statement converter implements it first.
- Payload size: builder verifies the API Gateway (10 MB) and Lambda (6 MB sync) limits; the UI rejects larger files up front with a plain message and a suggestion to export a shorter date range.
- "Contact us" / "ask us to add support" uses the existing `/feedback` endpoint, not a new channel. Export guides for unsupported formats are stubbed as text in the registry, with blog posts to follow.

- Stocks only for the Activity Statement; other asset types are skipped with a visible count.
- One new endpoint instead of extending `/detect-broker`, to keep the old contract stable.
- Warnings do not block; only red blocks.
