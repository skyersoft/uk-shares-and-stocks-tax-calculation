"""Tests for the multi-file inspector service (synthetic data only)."""
import json
from pathlib import Path

import pytest

from src.main.python.services import file_inspector
from src.main.python.services.file_inspector import inspect_files

DATA = Path(__file__).resolve().parents[1] / "data"
HEADER = ("Trades,Header,DataDiscriminator,Asset Category,Currency,Account,Symbol,Date/Time,"
          "Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code\n")
PREAMBLE = ("Statement,Header,Field Name,Field Value\n"
            "Statement,Data,BrokerName,Example Broker\n"
            "Statement,Data,Title,Activity Statement\n")


def statement(trades, extra="") -> bytes:
    """trades: (symbol, 'YYYY-MM-DD', qty, price[, category[, currency]]). Currency defaults to GBP:
    non-GBP stock rows are blocked (the Activity Statement carries no FX rates)."""
    lines = [PREAMBLE, HEADER]
    for t in trades:
        sym, day, qty, price = t[:4]
        cat = t[4] if len(t) > 4 else "Stocks"
        ccy = t[5] if len(t) > 5 else "GBP"
        lines.append(f'Trades,Data,Order,{cat},{ccy},U0000000,{sym},"{day}, 10:00:00",{qty},{price},'
                     f'{price},0,-1,0,0,0,O\n')
    lines.append(extra)
    return "".join(lines).encode()


def fixture_bytes(rel):
    return (DATA / rel).read_bytes()


def only(result):
    assert len(result.files) == 1
    return result.files[0]


def actions(f):
    return {a.id for a in f.next_actions}


def test_ready_file_has_format_and_summary():
    r = inspect_files([("a.csv", statement([("AAAA", "2025-06-03", 10, 5)]))])
    f = only(r)
    assert f.verdict == "ready" and f.filename == "a.csv"
    assert f.format.id == "ibkr_activity_statement" and f.format.supported
    assert f.summary.buys == 1 and r.can_continue and not r.requires_acknowledgement
    json.dumps(r.to_dict())


def test_sell_without_buy_flagged_and_needs_acknowledgement():
    r = inspect_files([("a.csv", statement([("AAAA", "2025-06-03", 10, 5), ("AAAA", "2025-07-01", -25, 6)]))])
    f = only(r)
    exp = [e for e in r.expectations if e.rule == "every_sell_has_earlier_buy"][0]
    assert not exp.passed
    s = exp.details[0]
    assert (s.symbol, s.date, s.quantity, s.filename) == ("AAAA", "2025-07-01", "15", "a.csv")
    assert r.requires_acknowledgement and r.can_continue
    assert f.verdict == "ready_with_warnings"
    assert {"add_earlier_file", "add_opening_holdings"} <= actions(f)
    text = " ".join(f.warnings)
    assert "Section 104" in text and "overstated" in text and "AAAA" in text
    json.dumps(r.to_dict())


def test_buy_in_other_file_clears_sell():
    buy = ("buy.csv", statement([("AAAA", "2024-06-03", 10, 5)]))
    sell = ("sell.csv", statement([("aaaa", "2025-07-01", -10, 6)]))
    r = inspect_files([buy, sell])
    exp = r.expectations[0]
    assert exp.passed and not r.requires_acknowledgement
    assert [f.verdict for f in r.files] == ["ready", "ready"]


def test_upload_order_does_not_matter():
    buy = ("buy.csv", statement([("AAAA", "2024-06-03", 10, 5)]))
    sell = ("sell.csv", statement([("AAAA", "2025-07-01", -10, 6)]))
    assert inspect_files([sell, buy]).expectations[0].passed
    short = ("short.csv", statement([("AAAA", "2025-07-01", -12, 6)]))
    a = inspect_files([buy, short]).expectations[0]
    b = inspect_files([short, buy]).expectations[0]
    def strip_index(e):  # file_index is the upload position, so it follows the order by design
        d = e.to_dict()
        for x in d["details"]:
            x.pop("file_index")
        return d
    assert not a.passed and strip_index(a) == strip_index(b)
    assert a.details[0].quantity == "2"


def test_same_day_buy_counts_before_sell():
    r = inspect_files([("a.csv", statement([("AAAA", "2025-07-01", -5, 6), ("AAAA", "2025-07-01", 5, 6)]))])
    assert r.expectations[0].passed


def test_same_file_twice_warns_duplicate():
    data = statement([("AAAA", "2025-06-03", 10, 5), ("AAAA", "2025-07-01", -4, 6)])
    r = inspect_files([("a.csv", data), ("b.csv", data)])
    assert r.files[0].verdict == "ready"
    assert r.files[1].verdict == "ready_with_warnings"
    assert any("duplicate" in w.lower() or "same" in w.lower() for w in r.files[1].warnings)
    assert r.expectations[0].passed  # duplicate does not fake a shortfall


def test_mostly_overlapping_files_warn_duplicate():
    base = [("AAAA", f"2025-06-{d:02d}", 1, 5) for d in range(1, 11)]
    a = statement(base)
    b = statement(base[:9] + [("BBBB", "2025-06-20", 1, 5)])
    r = inspect_files([("a.csv", a), ("b.csv", b)])
    assert r.files[1].verdict == "ready_with_warnings"


def test_unsupported_format_verdict_and_actions():
    r = inspect_files([("pf.csv", b"Portfolio Summary,,\nAAA,10,5\n")])
    f = only(r)
    assert f.verdict == "unsupported_format" and not f.format.supported
    assert actions(f) == {"view_export_steps", "request_support", "remove_file"}
    assert f.warnings and not r.can_continue


def test_quoted_flex_header_is_unsupported_not_flex():
    data = b'"ClientAccountID","CurrencyPrimary","Symbol","Quantity","TradePrice"\n"U1","USD","AAA","1","2"\n'
    f = only(inspect_files([("flex.csv", data)]))
    assert f.verdict == "unsupported_format"
    assert f.format.id == "ibkr_flex_query_quoted"


def test_no_trades_two_variants():
    with_activity = PREAMBLE.encode() + (
        b"Realized & Unrealized Performance Summary,Header,Asset Category,Symbol,Realized Total\n"
        b"Realized & Unrealized Performance Summary,Data,Stocks,AAAA,125.5\n")
    r = inspect_files([("a.csv", with_activity), ("b.csv", fixture_bytes("ibkr/activity_statement_no_trades.csv"))])
    a, b = r.files
    assert a.verdict == b.verdict == "no_trades"
    assert "Trades" in " ".join(a.warnings) and "Flex" in " ".join(a.warnings)
    assert "no trades in this period" in " ".join(b.warnings).lower()
    assert "view_export_steps" in actions(a) and "remove_file" in actions(a)
    assert "add_earlier_file" in actions(b)
    assert not r.can_continue


def test_zero_realized_summary_counts_as_no_activity():
    data = PREAMBLE.encode() + (
        b"Realized & Unrealized Performance Summary,Header,Asset Category,Symbol,Realized Total\n"
        b"Realized & Unrealized Performance Summary,Data,Stocks,AAAA,0\n")
    f = only(inspect_files([("a.csv", data)]))
    assert "no trades in this period" in " ".join(f.warnings).lower()


def test_mark_to_market_summary_counts_as_activity():
    data = PREAMBLE.encode() + (
        b"Mark-to-Market Performance Summary,Header,Asset Category,Symbol,Mark-to-Market P/L Total\n"
        b"Mark-to-Market Performance Summary,Data,Stocks,AAAA,3\n")
    f = only(inspect_files([("a.csv", data)]))
    assert "Flex" in " ".join(f.warnings)


def test_only_options_rows_gives_only_unsupported_assets_message():
    data = statement([("DDDD 250620C00050000", "2025-04-08", 1, 2, "Equity and Index Options"),
                      ("ESZ5", "2025-04-09", 1, 5000, "Futures"),
                      ("ESZ5", "2025-04-10", 1, 5000, "Futures")])
    f = only(inspect_files([("o.csv", data)]))
    assert f.verdict == "no_trades"
    text = " ".join(f.warnings)
    assert "unsupported" in text.lower() and "Futures" in text and "Equity and Index Options" in text
    assert "2" in text
    assert "no trades in this period" not in text.lower()


def test_garbage_bytes_gives_unknown_not_exception():
    for blob in (bytes(range(256)) * 20, b"", b"\x00\x00\x00", b"hello world, not a broker file"):
        f = only(inspect_files([("g.bin", blob)]))
        assert f.verdict == "unknown"
        assert {"pick_broker", "request_support", "remove_file"} <= actions(f)


def test_blocked_when_required_column_missing():
    data = (PREAMBLE + "Trades,Header,DataDiscriminator,Asset Category,Symbol,Date/Time,Quantity,Currency,Comm/Fee\n"
            'Trades,Data,Order,Stocks,AAAA,"2025-06-03, 10:00:00",10,USD,-1\n').encode()
    r = inspect_files([("a.csv", data)])
    assert only(r).verdict == "blocked" and not r.can_continue


def test_other_broker_csv_inspected_via_factory():
    f = only(inspect_files([("t212.csv", fixture_bytes("trading212/export.csv"))]))
    assert f.verdict in ("ready", "ready_with_warnings")
    assert f.format.supported and f.rows.usable > 0 and f.summary.tickers
    assert any(c.header == "Ticker" for c in f.columns)


def test_utf8_bom_and_cp1252_activity_statement():
    data = statement([("CAFÉ", "2025-06-03", 10, 5)])
    bom = b"\xef\xbb\xbf\xef\xbb\xbf" + data
    assert only(inspect_files([("a.csv", bom)])).verdict in ("ready", "ready_with_warnings")
    cp = data.decode().encode("cp1252")
    assert only(inspect_files([("a.csv", cp)])).format.id == "ibkr_activity_statement"


def test_temp_files_are_removed(monkeypatch):
    made = []
    real = file_inspector.tempfile.mkdtemp

    def spy(*a, **k):
        d = real(*a, **k)
        made.append(d)
        return d

    monkeypatch.setattr(file_inspector.tempfile, "mkdtemp", spy)
    inspect_files([("a.csv", statement([("AAAA", "2025-06-03", 10, 5)])), ("g.bin", b"\x00\x01")])
    assert made and not any(Path(d).exists() for d in made)


def test_empty_upload_cannot_continue():
    r = inspect_files([])
    assert not r.can_continue and r.files == []


def test_subset_first_is_flagged_and_does_not_double_count():
    year = [("AAAA", f"2025-05-{d:02d}", 1, 5) for d in range(1, 11)]
    month = year[:3]
    big = statement(year + [("AAAA", "2025-07-01", -12, 6)])
    r = inspect_files([("month.csv", statement(month)), ("year.csv", big)])
    assert r.files[0].verdict == "ready_with_warnings"
    assert "year.csv" in " ".join(r.files[0].warnings)
    # 10 held once, selling 12 leaves 2 uncovered (double counting would hide it)
    exp = r.expectations[0]
    assert not exp.passed and exp.details[0].quantity == "2"
    assert r.requires_acknowledgement


def test_identical_fills_within_one_file_are_kept():
    data = statement([("AAAA", "2025-05-01", 1, 5), ("AAAA", "2025-05-01", 1, 5),
                      ("AAAA", "2025-07-01", -2, 6)])
    r = inspect_files([("a.csv", data)])
    assert r.expectations[0].passed and r.files[0].verdict == "ready"


def test_symbol_whitespace_is_ignored_in_walk():
    r = inspect_files([("a.csv", statement([("AAAA ", "2025-05-01", 5, 5), ("AAAA", "2025-07-01", -5, 6)]))])
    assert r.expectations[0].passed


def test_cross_file_failure_falls_back_to_per_file_results(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("bug")
    monkeypatch.setattr(file_inspector, "_mark_duplicates", boom)
    r = inspect_files([("a.csv", statement([("AAAA", "2025-05-01", 5, 5)]))])
    assert r.files[0].verdict == "ready" and r.expectations == [] and not r.requires_acknowledgement


# ------------------------------------------------------- final-review fix wave

QFX = DATA / "qfx"


def test_usd_activity_statement_is_blocked_with_fx_message_and_actions():
    for name in ("ibkr/activity_statement_usd.csv", "ibkr/activity_statement_mixed_currency.csv"):
        r = inspect_files([("s.csv", fixture_bytes(name))])
        f = only(r)
        assert f.verdict == "blocked" and not r.can_continue
        text = " ".join(f.warnings)
        assert "USD" in text and "exchange rates" in text and "pounds" in text
        assert {"request_support", "remove_file"} <= actions(f)
        assert f.summary.currencies == (["USD"] if "usd" in name else ["GBP", "USD"])
        assert r.expectations == []  # blocked rows never feed the sell-without-buy walk


def test_gbp_and_gbx_activity_statements_still_ready():
    for name in ("ibkr/activity_statement_basic.csv", "ibkr/activity_statement_pence.csv"):
        f = only(inspect_files([("s.csv", fixture_bytes(name))]))
        assert f.verdict in ("ready", "ready_with_warnings")
        assert f.summary.currencies == ["GBP"]


def test_inspect_uses_same_confidence_threshold_as_calculate():
    from src.main.python.converters.converter_factory import MIN_CONVERT_CONFIDENCE
    assert MIN_CONVERT_CONFIDENCE == 0.8
    weak = b"Symbol,Quantity,TradeDate,Price,Currency\nAAA,1,20250603,2,GBP\n"
    f = only(inspect_files([("weak.csv", weak)]))
    assert f.verdict not in ("ready", "ready_with_warnings")


def test_genuine_flex_query_ready_with_real_confidence():
    f = only(inspect_files([("flex.csv", fixture_bytes("ibkr/flex_query.csv"))]))
    assert f.verdict in ("ready", "ready_with_warnings")
    from src.main.python.converters.ibkr_converter import IBKRConverter
    import tempfile, os
    with tempfile.NamedTemporaryFile("wb", suffix=".csv", delete=False) as t:
        t.write(fixture_bytes("ibkr/flex_query.csv"))
    try:
        assert f.format.confidence == IBKRConverter().detect_confidence(t.name)
    finally:
        os.unlink(t.name)


def test_wide_csv_column_stats_are_capped_with_warning(monkeypatch):
    monkeypatch.setattr(file_inspector, "MAX_STAT_COLUMNS", 5)
    header = "Date,Type,Ticker,Quantity,Price,Currency," + ",".join(f"X{i}" for i in range(20))
    row = "2025-06-03,BUY,AAAA,10,5,GBP," + ",".join("1" for _ in range(20))
    f = only(inspect_files([("wide.csv", f"{header}\n{row}\n".encode())]))
    assert len(f.columns) == 5
    assert any("columns" in w for w in f.warnings)
    assert f.verdict in ("ready", "ready_with_warnings")


def test_long_csv_column_stats_scan_is_capped_with_warning(monkeypatch):
    monkeypatch.setattr(file_inspector, "MAX_STAT_CELLS", 60)  # 6 columns -> 10 rows scanned
    rows = "".join(f"2025-06-{d:02d},BUY,AAAA,1,5,GBP\n" for d in range(1, 29))
    f = only(inspect_files([("long.csv", ("Date,Type,Ticker,Quantity,Price,Currency\n" + rows).encode())]))
    assert f.summary.buys == 28  # the conversion itself is not capped
    assert max(c.filled + c.blank for c in f.columns) == 10
    assert any("first 10 rows" in w for w in f.warnings)


def test_dividends_only_file_is_ready_with_warnings_not_no_trades():
    t212 = (b"Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),"
            b"Exchange rate,Result,Total,Withholding tax,Currency (Withholding tax),Charge amount,"
            b"Stamp duty reserve tax,Notes,ID,Currency conversion fee\n"
            b"Dividend (Ordinary),2025-03-01 09:00:00,XX0000000001,AAAA,Example A,,0.23,GBP,1,0.00,"
            b"1.91,0.00,GBP,0.00,0.00,,DIV1,0.00\n")
    r = inspect_files([("divs.csv", t212)])
    f = only(r)
    assert f.verdict == "ready_with_warnings", f.warnings
    assert "dividends/interest only" in " ".join(f.warnings)
    assert r.can_continue


def test_file_with_no_transactions_at_all_is_still_no_trades():
    t212 = (b"Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),"
            b"Exchange rate,Result,Total,Withholding tax,Currency (Withholding tax),Charge amount,"
            b"Stamp duty reserve tax,Notes,ID,Currency conversion fee\n")
    f = only(inspect_files([("empty.csv", t212)]))
    assert f.verdict in ("no_trades", "unknown")


@pytest.mark.parametrize("name", ["synthetic_sgml.qfx", "synthetic_xml.qfx"])
def test_qfx_both_header_styles_are_inspected(name):
    r = inspect_files([(name, (QFX / name).read_bytes())])
    f = only(r)
    assert f.format.id == "ibkr_qfx"
    assert f.verdict == "ready"
    assert (f.summary.buys, f.summary.sells) == (1, 1)
    assert f.summary.tickers == ["AAAA"] and f.summary.currencies == ["GBP"]
    assert r.expectations[0].passed


def test_qfx_with_bom_and_xml_prolog_routed_by_extension_even_if_misnamed_content():
    data = b"\xef\xbb\xbf" + (QFX / "synthetic_xml.qfx").read_bytes()
    assert only(inspect_files([("a.ofx", data)])).verdict == "ready"


def test_qfx_extension_with_non_ofx_content_is_unknown():
    f = only(inspect_files([("a.qfx", b"hello, this is not ofx\n")]))
    assert f.verdict == "unknown"


def test_corporate_actions_and_assignment_warn_through_inspector():
    for name, needle in (("ibkr/activity_statement_corporate_actions.csv", "splits/mergers"),
                         ("ibkr/activity_statement_assignment.csv", "assignment/exercise")):
        f = only(inspect_files([("s.csv", fixture_bytes(name))]))
        assert f.verdict == "ready_with_warnings"
        assert needle in " ".join(f.warnings)


def test_mixed_qfx_and_csv_upload_is_blocked():
    r = inspect_files([("a.csv", statement([("AAAA", "2025-06-03", 10, 5)])),
                       ("b.qfx", (QFX / "synthetic_sgml.qfx").read_bytes())])
    assert [f.verdict for f in r.files] == ["blocked", "blocked"]
    for f in r.files:
        assert "separate calculations" in " ".join(f.warnings)
        assert actions(f) == {"remove_file"}
    assert not r.can_continue


def test_two_qfx_files_are_not_mixed():
    data = (QFX / "synthetic_sgml.qfx").read_bytes()
    r = inspect_files([("a.qfx", data), ("b.ofx", (QFX / "synthetic_xml.qfx").read_bytes())])
    assert all("separate calculations" not in " ".join(f.warnings) for f in r.files)


def test_failure_log_does_not_contain_filename(monkeypatch, caplog):
    def boom(*a, **k):
        raise RuntimeError("bug")
    monkeypatch.setattr(file_inspector, "_inspect_one", boom)
    with caplog.at_level("DEBUG"):
        inspect_files([("U1234567_statement.csv", b"x")])
    assert "U1234567" not in caplog.text
    assert "file 0" in caplog.text


def test_sell_without_buy_carries_file_index():
    sell = statement([("AAAA", "2025-07-01", -5, 6)])
    r = inspect_files([("same.csv", statement([("BBBB", "2025-06-01", 1, 5)])), ("same.csv", sell)])
    d = r.expectations[0].details[0]
    assert d.file_index == 1
    assert r.expectations[0].to_dict()["details"][0]["file_index"] == 1


def test_non_ibkr_csv_reports_currencies():
    f = only(inspect_files([("t212.csv", fixture_bytes("trading212/export.csv"))]))
    assert f.summary.currencies


def test_qfx_content_with_csv_extension_is_not_ready():
    # /calculate routes by extension: a .csv holding OFX would go to the CSV parsers and fail
    f = only(inspect_files([("export.csv", (QFX / "synthetic_sgml.qfx").read_bytes())]))
    assert f.verdict == "unknown"
    assert ".qfx" in " ".join(f.warnings)
