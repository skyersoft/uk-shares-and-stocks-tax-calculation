"""Format fingerprint registry for uploaded files.

Pure data/predicate module (no converter imports). ``identify_format`` looks
at the first rows of an upload and names the format, saying whether the
calculator supports it and, if not, what the user should do instead.
Predicates are ordered most specific first; the first match wins.
"""

from dataclasses import dataclass, field
from typing import Callable, List, Optional

BOM = "﻿"


@dataclass
class FormatFingerprint:
    id: str
    name: str
    supported: bool
    help_text: str
    export_steps: List[str] = field(default_factory=list)


Rows = List[List[str]]


def _clean(cell: str) -> str:
    return (cell or "").replace(BOM, "").strip()


def _clean_rows(first_rows: Rows) -> Rows:
    """Strip BOMs/whitespace from cells and drop fully blank rows."""
    rows = []
    for row in first_rows or []:
        cleaned = [_clean(c) for c in row]
        if any(cleaned):
            rows.append(cleaned)
    return rows


def _header_text(rows: Rows) -> str:
    return ",".join(rows[0]) if rows else ""


def _has_all(rows: Rows, *cols: str) -> bool:
    text = _header_text(rows)
    return all(c in text for c in cols)


# --------------------------------------------------------------- fingerprints

IBKR_ACTIVITY = FormatFingerprint(
    "ibkr_activity_statement", "IBKR Activity Statement", True,
    "Interactive Brokers Activity Statement (CSV). Stock trades are read from its Trades section.",
    [])
IBKR_ACTIVITY_LOCALISED = FormatFingerprint(
    "ibkr_activity_statement_localised", "IBKR Activity Statement (non-English)", False,
    "This looks like an Interactive Brokers Activity Statement exported in another language. "
    "The section and column names must be in English, so please export the statement again in English.",
    ["Log in to IBKR Client Portal and set your language to English (Settings).",
     "Go to Performance & Reports > Statements and create an Activity Statement as CSV.",
     "Upload the newly exported file."])
IBKR_QFX = FormatFingerprint(
    "ibkr_qfx", "IBKR QFX", True, "Interactive Brokers QFX export.", [])
IBKR_FLEX = FormatFingerprint(
    "ibkr_flex_query", "IBKR Flex Query CSV", True, "Interactive Brokers Flex Query CSV (Trades).", [])
IBKR_FLEX_QUOTED = FormatFingerprint(
    "ibkr_flex_query_quoted", "IBKR Flex Query CSV (quoted headers)", False,
    "This is an Interactive Brokers Flex Query CSV with every column heading in quotes, "
    "which we cannot read yet. Re-export the query with quotes switched off, "
    "or export an Activity Statement instead.",
    ["Log in to IBKR Client Portal and open Performance & Reports > Flex Queries.",
     "Edit your Trades Flex Query and in the delivery settings turn off the option to "
     "include quotes around fields (the exact wording may vary), keeping the format as CSV.",
     "Run the query again and upload the new CSV, or export an Activity Statement (CSV) from "
     "Performance & Reports > Statements."])
TRADING212 = FormatFingerprint(
    "trading212", "Trading 212", True, "Trading 212 history CSV export.", [])
FIDELITY = FormatFingerprint(
    "fidelity", "Fidelity", True, "Fidelity transaction history CSV.", [])
HARGREAVES = FormatFingerprint(
    "hargreaves_lansdown", "Hargreaves Lansdown", True, "Hargreaves Lansdown transaction CSV.", [])
FREETRADE = FormatFingerprint(
    "freetrade", "Freetrade / simple CSV", True,
    "Freetrade activity CSV, or a simple Date, Type, Symbol, Quantity, Price, Currency file.", [])
GENERIC_NO_CURRENCY = FormatFingerprint(
    "generic_no_currency", "Simple CSV (no Currency column)", False,
    "This simple Date, Type, Symbol, Quantity, Price file has no Currency column, so we cannot "
    "tell which currency the prices are in. Add a Currency column (for example GBP or USD) "
    "to every row and upload it again.",
    ["Open the file in a spreadsheet.",
     "Add a column headed Currency and fill it with the currency of each price (e.g. GBP, USD).",
     "Save as CSV and upload again. A sample file is available on the upload page."])
PORTFOLIO_SUMMARY = FormatFingerprint(
    "portfolio_summary", "Portfolio Summary export", False,
    "This is a summary of current holdings, not a history of buys and sells. "
    "Capital gains need the full list of transactions.",
    ["Go back to your broker and look for a transaction history, activity or trade report.",
     "Choose a date range that covers every purchase and sale, and export it as CSV.",
     "Upload that file instead."])
SECURITY_MOVEMENTS = FormatFingerprint(
    "security_movements", "Security movements statement", False,
    "This looks like a fund or platform statement of security movements, which we cannot read yet. "
    "Use a transaction history export (buys and sells with dates, quantities and prices) instead.",
    ["Look in your provider's account for a transaction history or contract note download.",
     "Export it as CSV, or if only PDF is offered, copy the trades into the sample CSV template.",
     "Upload the CSV."])
COST_BASIS_REPORT = FormatFingerprint(
    "cost_basis_report", "Cost basis / realised gains report", False,
    "This report lists cost basis for already-matched lots. It has no buy and sell history, "
    "so UK matching rules cannot be applied. Export your full transaction history instead.",
    ["Go back to your broker and look for a transaction history, activity or trade report.",
     "Choose a date range that covers every purchase and sale, and export it as CSV.",
     "Upload that file instead."])


# ----------------------------------------------------------------- predicates

def _is_qfx(rows: Rows) -> bool:
    first = rows[0][0] if rows and rows[0] else ""
    return first.upper().startswith("OFXHEADER") or first.upper().startswith("<OFX")


def _is_activity(rows: Rows) -> bool:
    r = rows[0]
    return len(r) >= 3 and r[0] == "Statement" and r[1] == "Header" and r[2] == "Field Name"


def _is_activity_localised(rows: Rows) -> bool:
    r = rows[0]
    return (len(r) >= 3 and r[1] == "Header" and r[0] != "Statement"
            and not r[0].isascii() and not r[2].isascii())


def _is_portfolio_summary(rows: Rows) -> bool:
    return rows[0][0].lower() == "portfolio summary"


def _is_security_movements(rows: Rows) -> bool:
    return rows[0][0].lower().startswith("security movements for")


def _is_cost_basis(rows: Rows) -> bool:
    r = [c.lower() for c in rows[0]]
    return r[:3] == ["date acquired", "quantity", "cost basis"]


_FLEX_COLS = {"ClientAccountID", "AssetClass", "TradeDate", "SettleDate", "TradePrice",
              "IBCommission", "Buy/Sell", "Code", "TransactionType", "Exchange", "ListingExchange"}


def _is_flex_quoted(rows: Rows) -> bool:
    r = rows[0]
    quoted = sum(1 for c in r if c.startswith('"') or c.endswith('"'))
    text = ",".join(c.strip('"') for c in r)
    return quoted >= 2 and ("CurrencyPrimary" in text or ("Symbol" in text and "Quantity" in text))


def _is_flex(rows: Rows) -> bool:
    # Mirrors IBKRConverter.detect_confidence: Symbol+Quantity and >=1 known IBKR column.
    cols = set(rows[0])
    return "Symbol" in cols and "Quantity" in cols and bool(cols & _FLEX_COLS)


def _is_trading212(rows: Rows) -> bool:
    return _has_all(rows, "Action", "Time", "No. of shares")


def _is_fidelity(rows: Rows) -> bool:
    return _has_all(rows, "Trade Date", "Settlement Date", "Action", "Symbol",
                    "Security Description", "Settlement Currency")


def _is_hargreaves(rows: Rows) -> bool:
    return (_has_all(rows, "Transaction Type", "Security", "Account Type")
            or _has_all(rows, "Date", "Transaction Type", "ISIN")
            or _has_all(rows, "Transaction Type", "Security"))


def _is_freetrade(rows: Rows) -> bool:
    return (_has_all(rows, "Date", "Type", "Quantity", "Price", "Currency")
            and ("Ticker" in _header_text(rows) or "Symbol" in _header_text(rows)))


def _is_generic_no_currency(rows: Rows) -> bool:
    return (_has_all(rows, "Date", "Type", "Symbol", "Quantity", "Price")
            and "Currency" not in _header_text(rows))


_REGISTRY: List[tuple] = [
    (_is_qfx, IBKR_QFX),
    (_is_activity, IBKR_ACTIVITY),
    (_is_activity_localised, IBKR_ACTIVITY_LOCALISED),
    (_is_portfolio_summary, PORTFOLIO_SUMMARY),
    (_is_security_movements, SECURITY_MOVEMENTS),
    (_is_cost_basis, COST_BASIS_REPORT),
    (_is_flex_quoted, IBKR_FLEX_QUOTED),
    (_is_flex, IBKR_FLEX),
    (_is_trading212, TRADING212),
    (_is_fidelity, FIDELITY),
    (_is_hargreaves, HARGREAVES),
    (_is_freetrade, FREETRADE),
    (_is_generic_no_currency, GENERIC_NO_CURRENCY),
]  # type: List[tuple]


def identify_format(first_rows: Rows, filename: str) -> Optional[FormatFingerprint]:
    """Return the matching fingerprint for the file's first rows, or None."""
    rows = _clean_rows(first_rows)
    if not rows:
        return None
    for predicate, fingerprint in _REGISTRY:
        try:
            if predicate(rows):
                return fingerprint
        except Exception:
            continue
    return None
