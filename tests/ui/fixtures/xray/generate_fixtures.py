"""Regenerate the X-ray Playwright fixtures from the REAL backend inspector.

Run from the repo root:  python tests/ui/fixtures/xray/generate_fixtures.py

Writes synthetic upload files to ./uploads and the matching /inspect-file
response bodies (InspectionResult.to_dict()) to ./*.json. Synthetic data only.
"""
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT))

from src.main.python.services.file_inspector import inspect_files  # noqa: E402

UPLOADS = HERE / "uploads"
DATA = ROOT / "tests" / "data" / "ibkr"

HEADER = ("Trades,Header,DataDiscriminator,Asset Category,Currency,Account,Symbol,Date/Time,"
          "Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code\n")
PREAMBLE = ("Statement,Header,Field Name,Field Value\n"
            "Statement,Data,BrokerName,Example Broker\n"
            "Statement,Data,Title,Activity Statement\n")


def statement(trades) -> bytes:
    """trades: (symbol, 'YYYY-MM-DD', qty, price[, category])."""
    lines = [PREAMBLE, HEADER]
    for t in trades:
        sym, day, qty, price = t[:4]
        cat = t[4] if len(t) > 4 else "Stocks"
        lines.append(f'Trades,Data,Order,{cat},GBP,U0000000,{sym},"{day}, 10:00:00",{qty},{price},'
                     f'{price},0,-1,0,0,0,O\n')
    return "".join(lines).encode()


SELL_NO_BUY = statement([("AAAA", "2025-06-03", 10, 5), ("AAAA", "2025-07-01", -25, 6)])
OPTIONS_ONLY = statement([("DDDD 250620C00050000", "2025-04-08", 1, 2.0, "Equity and Index Options")])
FLEX_QUOTED = (b'"ClientAccountID","CurrencyPrimary","Symbol","Quantity","TradePrice"\n'
               b'"U1","USD","AAA","1","2"\n')
GARBAGE = bytes(range(0, 32)) * 8 + b"\xff\xfe\x00\x01not a statement"
PDF = b"%PDF-1.4\n% synthetic placeholder, not a real document\n%%EOF\n"
BASIC = (DATA / "activity_statement_basic.csv").read_bytes()

# upload name -> bytes
UPLOAD_FILES = {
    "activity_basic.csv": BASIC,
    "options_only.csv": OPTIONS_ONLY,
    "sell_no_buy.csv": SELL_NO_BUY,
    "duplicate_a.csv": BASIC,
    "duplicate_b.csv": BASIC,
    "flex_quoted.csv": FLEX_QUOTED,
    "garbage.csv": GARBAGE,
    "statement.pdf": PDF,
}

# fixture json -> upload names sent together (PDF is never sent to the server)
SCENARIOS = {
    "basic.json": ["activity_basic.csv"],
    "options_only.json": ["options_only.csv"],
    "sell_no_buy.json": ["sell_no_buy.csv"],
    "duplicate.json": ["duplicate_a.csv", "duplicate_b.csv"],
    "flex_quoted.json": ["flex_quoted.csv"],
    "unknown.json": ["garbage.csv"],
}


def main():
    UPLOADS.mkdir(parents=True, exist_ok=True)
    for name, data in UPLOAD_FILES.items():
        (UPLOADS / name).write_bytes(data)
    for out, names in SCENARIOS.items():
        result = inspect_files([(n, UPLOAD_FILES[n]) for n in names])
        (HERE / out).write_text(json.dumps(result.to_dict(), indent=2, sort_keys=True) + "\n")
        print("wrote", out)


if __name__ == "__main__":
    main()
