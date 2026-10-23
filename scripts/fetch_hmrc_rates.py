#!/usr/bin/env python3
"""Download HMRC monthly exchange rates and write src/main/python/data/hmrc_monthly_rates.json.

Source: https://www.trade-tariff.service.gov.uk/exchange_rates (HMRC "Exchange rates for customs
and VAT", monthly CSV, "Currency units per £1"). Re-run monthly (the new month's file is
published a few days before it starts); months that are not published yet are skipped.

    python scripts/fetch_hmrc_rates.py [first_year]
"""
import csv
import io
import json
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

URL = "https://www.trade-tariff.service.gov.uk/api/v2/exchange_rates/files/monthly_csv_{year}-{month}.csv"
OUT = Path(__file__).parent.parent / "src" / "main" / "python" / "data" / "hmrc_monthly_rates.json"
# Currencies brokers commonly trade in; the full HMRC list is not needed (and keeps the Lambda small).
CURRENCIES = ["USD", "EUR", "JPY", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK", "DKK", "HKD", "SGD",
              "CNY", "INR", "BRL", "ZAR", "ILS", "PLN", "CZK", "HUF", "MXN", "KRW", "TWD"]


def fetch_month(year: int, month: int):
    try:
        with urllib.request.urlopen(URL.format(year=year, month=month), timeout=30) as resp:
            text = resp.read().decode("utf-8-sig")
    except urllib.error.HTTPError as e:
        if e.code in (403, 404):
            return None
        raise
    rates = {}
    for row in csv.DictReader(io.StringIO(text)):
        code = row["Currency Code"].strip()
        # Several territories share a code (e.g. EUR); HMRC publishes the same rate for them.
        if code in CURRENCIES and code not in rates:
            rates[code] = float(row["Currency Units per £1"])
    return rates or None


def main() -> None:
    first = int(sys.argv[1]) if len(sys.argv) > 1 else 2015
    today = date.today()
    table = {}
    for year in range(first, today.year + 1):
        for month in range(1, 13):
            if (year, month) > (today.year, today.month + 1 if today.month < 12 else 12):
                break
            rates = fetch_month(year, month)
            if rates:
                table[f"{year}-{month:02d}"] = rates
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": "HMRC monthly exchange rates (currency units per £1)",
                               "rates": table}, indent=1, sort_keys=True) + "\n")
    print(f"{len(table)} months written to {OUT}")


if __name__ == "__main__":
    main()
