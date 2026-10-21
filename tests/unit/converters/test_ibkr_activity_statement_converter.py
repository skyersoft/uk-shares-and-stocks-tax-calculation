"""Unit tests for the IBKR Activity Statement converter."""
from decimal import Decimal
from datetime import datetime
from pathlib import Path

import pytest

from src.main.python.converters.ibkr_activity_statement_converter import (
    IBKRActivityStatementConverter,
    TradesSection,
)
from src.main.python.converters.ibkr_converter import IBKRConverter
from src.main.python.converters.trading212_converter import Trading212Converter
from src.main.python.converters.converter_factory import get_factory, reset_factory
from src.main.python.converters import register_default_converters
from src.main.python.models.standard_transaction import TransactionType

DATA = Path(__file__).resolve().parents[2] / "data" / "ibkr"


def fx(name):
    return str(DATA / name)


@pytest.fixture
def conv():
    return IBKRActivityStatementConverter()


def test_broker_name(conv):
    assert conv.broker_name == "Interactive Brokers (Activity Statement)"


def test_detects_activity_statement_with_repeated_bom(conv):
    raw = Path(fx("activity_statement_basic.csv")).read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf\xef\xbb\xbf\xef\xbb\xbf")
    assert conv.detect_confidence(fx("activity_statement_basic.csv")) >= 0.9


def test_detect_confidence_without_trades_section_is_lower(conv):
    c = conv.detect_confidence(fx("activity_statement_no_trades.csv"))
    assert 0.0 < c < 0.9


@pytest.mark.parametrize("name", ["flex_query.csv", "sharesight.csv"])
def test_detect_confidence_zero_for_flex_query_csv(conv, name):
    assert conv.detect_confidence(fx(name)) == 0.0


def test_missing_file_confidence_zero(conv):
    assert conv.detect_confidence("/nonexistent/file.csv") == 0.0


@pytest.mark.parametrize("name", [
    "activity_statement_basic.csv", "activity_statement_mixed_assets.csv",
    "activity_statement_no_cprice.csv", "activity_statement_pence.csv",
])
def test_existing_ibkr_converter_does_not_match(name):
    assert IBKRConverter().detect_confidence(fx(name)) < 0.5


def test_converts_stock_orders_only(conv):
    txs = conv.convert(fx("activity_statement_mixed_assets.csv"))
    assert [t.symbol for t in txs] == ["DDDD", "EEEE"]
    basic = conv.convert(fx("activity_statement_basic.csv"))
    # Trade discriminator, Forex and Total rows excluded
    assert len(basic) == 2


def test_buy_sell_from_quantity_sign(conv):
    buy, sell = conv.convert(fx("activity_statement_basic.csv"))
    assert buy.transaction_type == TransactionType.BUY
    assert sell.transaction_type == TransactionType.SELL
    assert buy.quantity == Decimal("100")
    assert sell.quantity == Decimal("40")
    assert buy.price == Decimal("10.50")
    assert buy.transaction_currency == "USD"
    assert buy.symbol == "AAAA"
    assert buy.broker == conv.broker_name


@pytest.mark.parametrize("name,symbol,qty,price,ccy,comm", [
    ("activity_statement_basic.csv", "AAAA", "100", "10.50", "USD", "1.00"),
    ("activity_statement_no_cprice.csv", "BBBB", "25", "20.00", "USD", "0.50"),
    ("activity_statement_variant_account.csv", "CCCC", "10", "100.00", "EUR", "1.25"),
])
def test_maps_columns_by_name_across_header_variants(conv, name, symbol, qty, price, ccy, comm):
    tx = conv.convert(fx(name))[0]
    assert tx.symbol == symbol
    assert tx.quantity == Decimal(qty)
    assert tx.price == Decimal(price)
    assert tx.transaction_currency == ccy
    assert tx.commission == Decimal(comm)


def test_commission_is_absolute_and_in_row_currency(conv):
    for tx in conv.convert(fx("activity_statement_basic.csv")):
        assert tx.commission >= 0
        assert tx.transaction_currency == "USD"
    assert conv.convert(fx("activity_statement_basic.csv"))[1].commission == Decimal("1.10")


def test_date_time_with_comma_and_quoted_form(conv):
    quoted = conv.convert(fx("activity_statement_basic.csv"))[0]
    unquoted = conv.convert(fx("activity_statement_no_cprice.csv"))[0]
    assert quoted.date == datetime(2025, 6, 3, 14, 31, 7)
    assert unquoted.date == datetime(2025, 6, 3, 14, 31, 7)


def test_pence_prices_converted_to_pounds(conv):
    tx = conv.convert(fx("activity_statement_pence.csv"))[0]
    assert tx.price == Decimal("12.035")
    assert tx.commission == Decimal("0.95")
    assert tx.transaction_currency == "GBP"


def test_etf_category_row_is_converted(conv, tmp_path):
    text = Path(fx("activity_statement_basic.csv")).read_text(encoding="utf-8-sig").replace(
        "Order,Stocks,USD,U0000000,AAAA", "Order,ETFs,USD,U0000000,AAAA")
    p = tmp_path / "etf.csv"
    p.write_text(text, encoding="utf-8")
    txs = conv.convert(str(p))
    assert len(txs) == 2
    assert txs[0].asset_class.name == "ETF"


def test_missing_quantity_column_counts_as_failed_row_not_crash(conv, tmp_path):
    text = Path(fx("activity_statement_basic.csv")).read_text(encoding="utf-8-sig")
    text = text.replace("Date/Time,Quantity,T. Price", "Date/Time,Qty,T. Price")
    p = tmp_path / "noqty.csv"
    p.write_text(text, encoding="utf-8")
    assert conv.convert(str(p)) == []


def test_no_trades_section_returns_empty_list(conv):
    assert conv.convert(fx("activity_statement_no_trades.csv")) == []


def test_non_utf8_file_does_not_raise(conv, tmp_path):
    content = Path(fx("activity_statement_basic.csv")).read_bytes().replace(b"AAAA", b"CAF\xc9")
    p = tmp_path / "cp1252.csv"
    p.write_bytes(content)
    section = conv.read_trades_section(str(p))
    assert section.encoding_warnings
    txs = conv.convert(str(p))
    assert txs[0].symbol == "CAFÉ"


def test_trades_section_includes_all_asset_categories(conv):
    section = conv.read_trades_section(fx("activity_statement_mixed_assets.csv"))
    assert isinstance(section, TradesSection)
    cats = [r["Asset Category"] for r in section.rows]
    assert cats == ["Stocks", "Equity and Index Options", "Futures", "Stocks"]
    assert "Symbol" in section.headers
    assert section.encoding_warnings == []


def test_trades_section_empty_when_absent(conv):
    section = conv.read_trades_section(fx("activity_statement_no_trades.csv"))
    assert section.rows == [] and section.headers == []


class TestFactoryRegistration:
    @pytest.fixture(autouse=True)
    def _reset(self):
        reset_factory()
        register_default_converters()
        yield
        reset_factory()

    def test_activity_statement_detected(self):
        result = get_factory().detect_broker(fx("activity_statement_basic.csv"))
        assert result["broker"] == "Interactive Brokers (Activity Statement)"

    def test_flex_query_still_ibkr(self):
        result = get_factory().detect_broker(fx("flex_query.csv"))
        assert result["broker"] == "Interactive Brokers"

    def test_trading212_still_detected(self):
        t212 = Path(__file__).resolve().parents[2] / "data" / "trading212" / "export_realistic.csv"
        result = get_factory().detect_broker(str(t212))
        assert result["broker"] == "Trading 212"


@pytest.mark.parametrize("day,expected", [
    (datetime(2025, 4, 5, 23, 59), "2024-2025"),
    (datetime(2025, 4, 6, 0, 0), "2025-2026"),
])
def test_tax_year_boundary(day, expected):
    assert IBKRActivityStatementConverter._tax_year(day) == expected


def test_inspect_blocked_when_asset_category_column_missing(conv, tmp_path):
    p = tmp_path / "s.csv"
    p.write_text(
        "Statement,Header,Field Name,Field Value\n"
        "Trades,Header,DataDiscriminator,Symbol,Date/Time,Quantity,T. Price,Currency,Comm/Fee\n"
        "Trades,Data,Order,AAAA,\"2025-06-03, 14:31:07\",10,5,USD,-1\n")
    result = conv.inspect(str(p))
    assert result.verdict == "blocked"
    assert any(c.header == "Asset Category" and c.status == "blocked" for c in result.columns)
