"""Tests for the upload format fingerprint registry."""
from src.main.python.config.format_fingerprints import (
    FormatFingerprint,
    identify_format,
)

BOM = "﻿"


def ident(rows, filename="file.csv"):
    return identify_format(rows, filename)


def test_ibkr_activity_statement():
    fp = ident([["Statement", "Header", "Field Name", "Field Value"]])
    assert fp.id == "ibkr_activity_statement" and fp.supported


def test_ibkr_flex_query_unquoted():
    fp = ident([["ClientAccountID", "AssetClass", "Symbol", "TradeDate", "Quantity", "TradePrice"]])
    assert fp.id == "ibkr_flex_query" and fp.supported


def test_ibkr_flex_query_quoted_unsupported():
    fp = ident([['"CurrencyPrimary"', '"FXRateToBase"', '"Symbol"', '"Quantity"']])
    assert fp.id == "ibkr_flex_query_quoted" and not fp.supported
    assert fp.export_steps


def test_ibkr_qfx():
    assert ident([["OFXHEADER:100"]], "x.qfx").id == "ibkr_qfx"
    assert ident([["<OFX>"]], "x.qfx").supported


def test_trading212():
    fp = ident([["Action", "Time", "ISIN", "Ticker", "No. of shares", "Price / share", "Result"]])
    assert fp.id == "trading212" and fp.supported


def test_freetrade():
    fp = ident([["Title", "Type", "Timestamp", "Account Currency", "Total Amount", "Ticker",
                 "Date", "Quantity", "Price", "Currency", "Freetrade"]])
    assert fp.id == "freetrade" and fp.supported


def test_hargreaves():
    fp = ident([["Trade date", "Transaction Type", "Security", "Account Type", "Quantity"]])
    assert fp.id == "hargreaves_lansdown" and fp.supported


def test_fidelity():
    fp = ident([["Trade Date", "Settlement Date", "Action", "Symbol", "Security Description",
                 "Settlement Currency"]])
    assert fp.id == "fidelity" and fp.supported


def test_generic_with_currency_is_supported():
    fp = ident([["Date", "Type", "Symbol", "Name", "Quantity", "Price", "Fees", "Currency"]])
    assert fp.supported


def test_generic_without_currency_unsupported():
    fp = ident([["Date", "Type", "Symbol", "Quantity", "Price", "Fees"]])
    assert fp.id == "generic_no_currency" and not fp.supported
    assert "Currency" in fp.help_text


def test_portfolio_summary():
    fp = ident([["Portfolio Summary"], ["Account", "Value"]])
    assert fp.id == "portfolio_summary" and not fp.supported


def test_security_movements():
    fp = ident([["Security movements for: Some Fund"]])
    assert fp.id == "security_movements" and not fp.supported


def test_cost_basis_report():
    fp = ident([["Date acquired", "Quantity", "Cost basis", "Proceeds"]])
    assert fp.id == "cost_basis_report" and not fp.supported


def test_localised_activity_statement():
    fp = ident([["对账单", "Header", "字段名称", "字段值"]])
    assert fp.id == "ibkr_activity_statement_localised" and not fp.supported
    assert "English" in fp.help_text


def test_unknown_returns_none():
    assert ident([["foo", "bar"]]) is None
    assert ident([]) is None
    assert ident([[""]]) is None


def test_unsupported_formats_flagged_unsupported():
    cases = [
        [["Portfolio Summary"]],
        [["Security movements for: X"]],
        [["Date acquired", "Quantity", "Cost basis"]],
        [["对账单", "Header", "字段名称", "字段值"]],
    ]
    for rows in cases:
        fp = ident(rows)
        assert isinstance(fp, FormatFingerprint)
        assert fp.supported is False
        assert fp.help_text and fp.export_steps


def test_repeated_bom_stripped_before_matching():
    rows = [[BOM * 7 + "Statement", "Header", "Field Name", "Field Value"]]
    assert ident(rows).id == "ibkr_activity_statement"


def test_only_bom_returns_none():
    assert ident([[BOM * 50]]) is None
    assert ident([[BOM * 50 + "garbage"]]) is None


def test_blank_leading_rows_skipped():
    rows = [[""], [BOM], ["Portfolio Summary"]]
    assert ident(rows).id == "portfolio_summary"


def test_quote_stripped_flex_header_does_not_trigger_quoted_fingerprint():
    """Contract: callers must pass raw split cells; csv-parsed cells lose the quotes."""
    fp = ident([["CurrencyPrimary", "FXRateToBase", "Symbol", "Quantity"]])
    assert fp is None or fp.id != "ibkr_flex_query_quoted"


def test_hargreaves_date_isin_variant():
    fp = ident([["Date", "Transaction Type", "ISIN", "Quantity"]])
    assert fp.id == "hargreaves_lansdown"


def test_non_hargreaves_transaction_type_security_not_labelled():
    fp = ident([["Transaction Type", "Security", "Amount"]])
    assert fp is None or fp.id != "hargreaves_lansdown"
