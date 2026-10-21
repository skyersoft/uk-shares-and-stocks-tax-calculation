"""Tests for the file inspection (X-ray) model and Activity Statement inspect()."""
from pathlib import Path

from src.main.python.converters.ibkr_activity_statement_converter import (
    IBKRActivityStatementConverter,
)
from src.main.python.converters.ibkr_converter import IBKRConverter
from src.main.python.models.file_inspection import (
    ColumnInfo, FileInspection, FormatInfo, NextAction, RowStats, SkippedRows, Summary,
)

DATA = Path(__file__).resolve().parents[1] / "data" / "ibkr"


def fx(name):
    return str(DATA / name)


def col(insp, header):
    return next(c for c in insp.columns if c.header == header)


def test_inspect_default_returns_none_for_other_converters():
    assert IBKRConverter().inspect(fx("flex_query.csv")) is None


def test_activity_statement_inspect_column_stats():
    insp = IBKRActivityStatementConverter().inspect(fx("activity_statement_basic.csv"))
    assert insp.verdict == "ready_with_warnings"  # Forex row skipped
    assert insp.filename == "activity_statement_basic.csv"
    assert insp.rows.total == 3  # Order rows: 2 stocks + 1 forex
    assert insp.rows.usable == 2
    sym = col(insp, "Symbol")
    assert (sym.filled, sym.blank, sym.samples) == (3, 0, ["AAAA", "GBP.USD"])
    assert sym.status == "understood" and sym.mapped_to == "Symbol"
    assert col(insp, "Quantity").samples == ["100", "-40", "-1000"]
    assert col(insp, "Code").filled == 2 and col(insp, "Code").blank == 1
    assert insp.summary.buys == 1 and insp.summary.sells == 1
    assert insp.summary.tickers == ["AAAA"]
    assert insp.summary.currencies == ["USD"]
    assert insp.summary.first_date == "2025-06-03"
    assert insp.summary.last_date == "2025-08-11"
    assert insp.summary.tax_years == ["2025-2026"]


def test_inspect_counts_skipped_by_asset_category():
    insp = IBKRActivityStatementConverter().inspect(fx("activity_statement_mixed_assets.csv"))
    skipped = {s.reason: s.count for s in insp.rows.skipped}
    assert skipped == {
        "Equity and Index Options (not supported)": 1,
        "Futures (not supported)": 1,
    }
    assert insp.rows.usable == 2
    assert insp.verdict == "ready_with_warnings"


def test_inspect_marks_proceeds_and_realized_pl_ignored():
    insp = IBKRActivityStatementConverter().inspect(fx("activity_statement_basic.csv"))
    for h in ("Proceeds", "Realized P/L", "Basis", "C. Price", "Code"):
        c = col(insp, h)
        assert c.status == "ignored" and c.mapped_to is None
    assert col(insp, "Asset Category").status == "understood"


def test_inspect_trades_header_with_zero_rows_is_no_trades(tmp_path):
    text = Path(fx("activity_statement_basic.csv")).read_text(encoding="utf-8-sig")
    text = "\n".join(l for l in text.splitlines() if not l.startswith("Trades,Data"))
    p = tmp_path / "empty.csv"
    p.write_text(text, encoding="utf-8")
    insp = IBKRActivityStatementConverter().inspect(str(p))
    assert insp.verdict == "no_trades"
    assert insp.rows.total == 0 and insp.next_actions == []


def test_inspect_missing_trades_section_is_no_trades():
    insp = IBKRActivityStatementConverter().inspect(fx("activity_statement_no_trades.csv"))
    assert insp.verdict == "no_trades"


def test_inspect_missing_required_column_is_blocked(tmp_path):
    text = Path(fx("activity_statement_basic.csv")).read_text(encoding="utf-8-sig")
    text = text.replace("Date/Time,Quantity,T. Price", "Date/Time,Qty,T. Price")
    p = tmp_path / "noqty.csv"
    p.write_text(text, encoding="utf-8")
    insp = IBKRActivityStatementConverter().inspect(str(p))
    assert insp.verdict == "blocked"
    q = col(insp, "Quantity")
    assert q.status == "blocked" and q.filled == 0
    assert insp.rows.usable == 0


def test_inspect_encoding_warning_is_ready_with_warnings(tmp_path):
    content = Path(fx("activity_statement_pence.csv")).read_bytes().replace(b"LLLL", b"CAF\xc9")
    p = tmp_path / "cp.csv"
    p.write_bytes(content)
    insp = IBKRActivityStatementConverter().inspect(str(p))
    assert insp.verdict == "ready_with_warnings" and insp.warnings


def test_samples_are_capped_at_three_and_trimmed(tmp_path):
    lines = Path(fx("activity_statement_basic.csv")).read_text(encoding="utf-8-sig").splitlines()
    hdr = next(l for l in lines if l.startswith("Trades,Header"))
    rows = [f"Trades,Data,Order,Stocks,USD,U0000000,  S{i}  ,\"2025-06-0{i}, 10:00:00\",1,1,1,-1,-1,1,0,0,0,O"
            for i in range(1, 6)]
    p = tmp_path / "many.csv"
    p.write_text("\n".join([lines[0], hdr] + rows), encoding="utf-8")
    insp = IBKRActivityStatementConverter().inspect(str(p))
    assert col(insp, "Symbol").samples == ["S1", "S2", "S3"]


def test_to_dict_uses_snake_case_keys():
    insp = FileInspection(
        filename="f.csv", format=FormatInfo("ibkr_as", "IBKR", 0.95, True), verdict="ready",
        columns=[ColumnInfo("Symbol", "Symbol", "understood", 1, 0, ["A"], None)],
        rows=RowStats(1, 1, [SkippedRows("x", 2)]),
        summary=Summary(1, 0, ["A"], ["USD"], "2025-01-01", "2025-01-01", ["2024-2025"]),
        next_actions=[NextAction("a", "Do")], warnings=[],
    )
    d = insp.to_dict()
    assert d["rows"]["skipped"] == [{"reason": "x", "count": 2}]
    assert d["summary"]["tax_years"] == ["2024-2025"]
    assert d["columns"][0]["mapped_to"] == "Symbol"
    assert d["next_actions"] == [{"id": "a", "label": "Do"}]
    assert d["format"]["supported"] is True
