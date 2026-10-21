"""Multi-file inspector: the "X-ray" behind the upload screen.

``inspect_files`` looks at every uploaded file, decides what format it is,
what we understood from it and whether it can be used, then checks
expectations across all files together (for example, every sell has an
earlier buy somewhere in the uploads). Nothing is persisted: each file is
written to a private temp directory that is always removed afterwards.
"""
import codecs
import csv
import hashlib
import io
import logging
import os
import re
import shutil
import tempfile
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ..config.format_fingerprints import FormatFingerprint, identify_format
from ..converters import (
    IBKRActivityStatementConverter,
    get_factory,
    register_default_converters,
)
from ..models.file_inspection import (
    ColumnInfo,
    FileInspection,
    FormatInfo,
    NextAction,
    RowStats,
    Summary,
)
from ..models.inspection_result import Expectation, InspectionResult, SellWithoutBuy
from ..models.standard_transaction import TransactionType

logger = logging.getLogger(__name__)

RULE_SELL_HAS_BUY = "every_sell_has_earlier_buy"
BOM = "﻿"
HEAD_BYTES = 64 * 1024
HEAD_LINES = 12
DUPLICATE_RATIO = 0.8

ACTION_LABELS = {
    "add_earlier_file": "Add an earlier export",
    "add_opening_holdings": "Enter opening holdings",
    "show_skipped_rows": "Show skipped rows",
    "view_export_steps": "How to export this file",
    "pick_broker": "Choose your broker",
    "request_support": "Ask us to support this format",
    "remove_file": "Remove this file",
}
BAD_VERDICTS = {"blocked", "unsupported_format", "no_trades", "unknown"}


def _actions(*ids: str) -> List[NextAction]:
    return [NextAction(i, ACTION_LABELS[i]) for i in ids]


@dataclass(frozen=True)
class _Trade:
    date: datetime
    symbol: str
    is_buy: bool
    quantity: Decimal
    price: Decimal

    @property
    def key(self) -> Tuple:
        return (self.date, self.symbol.strip().upper(), self.is_buy, self.quantity, self.price)


@dataclass
class _Entry:
    """Working state for one uploaded file."""
    name: str
    content_hash: str
    inspection: FileInspection
    trades: List[_Trade]


# ----------------------------------------------------------------- helpers

def _tax_year(d: datetime) -> str:
    start = d.year if (d.month, d.day) >= (4, 6) else d.year - 1
    return f"{start}-{start + 1}"


def _decode_head(data: bytes) -> str:
    head = data[:HEAD_BYTES]
    try:
        # Incremental decoding tolerates a multi-byte character cut by the slice
        text = codecs.getincrementaldecoder("utf-8")().decode(head, final=False)
    except UnicodeDecodeError:
        text = head.decode("cp1252", errors="replace")
    return text.replace(BOM, "")


def _raw_cells(data: bytes) -> List[List[str]]:
    """First lines as raw comma-split cells, quotes intact (see format_fingerprints contract)."""
    lines = [ln for ln in _decode_head(data).splitlines() if ln.strip()]
    return [ln.split(",") for ln in lines[:HEAD_LINES]]


def _summarise(trades: List[_Trade]) -> Summary:
    dates = sorted(t.date for t in trades)
    return Summary(
        buys=sum(1 for t in trades if t.is_buy),
        sells=sum(1 for t in trades if not t.is_buy),
        tickers=sorted({t.symbol for t in trades}),
        first_date=dates[0].date().isoformat() if dates else None,
        last_date=dates[-1].date().isoformat() if dates else None,
        tax_years=sorted({_tax_year(d) for d in dates}),
    )


def _trade_from_standard(tx) -> Optional[_Trade]:
    if tx.transaction_type not in (TransactionType.BUY, TransactionType.SELL):
        return None
    return _Trade(tx.date, tx.symbol, tx.transaction_type == TransactionType.BUY,
                  abs(Decimal(tx.quantity)), Decimal(tx.price or 0))


def _format_info(fp: FormatFingerprint, confidence: float = 1.0) -> FormatInfo:
    return FormatInfo(id=fp.id, name=fp.name, confidence=confidence, supported=fp.supported)


def _empty_inspection(filename: str, fmt: Optional[FormatInfo], verdict: str,
                      warnings: List[str], actions: List[NextAction]) -> FileInspection:
    return FileInspection(filename=filename, format=fmt, verdict=verdict, columns=[],
                          rows=RowStats(total=0, usable=0), summary=Summary(),
                          next_actions=actions, warnings=warnings)


def _unknown(filename: str, why: str = "") -> FileInspection:
    msg = "We could not tell which broker this file comes from."
    if why:
        msg += " " + why
    return _empty_inspection(filename, None, "unknown", [msg],
                             _actions("pick_broker", "request_support", "remove_file"))


def _unsupported(filename: str, fp: FormatFingerprint) -> FileInspection:
    warnings = [fp.help_text] + [f"Step {i}: {s}" for i, s in enumerate(fp.export_steps, 1)]
    return _empty_inspection(filename, _format_info(fp), "unsupported_format", warnings,
                             _actions("view_export_steps", "request_support", "remove_file"))


# ------------------------------------------------- Activity Statement extras

def _summary_sections_show_activity(path: str) -> bool:
    """True when summary sections prove there was trading although no Trades section exists."""
    text, _ = IBKRActivityStatementConverter._read_text(path)
    for row in csv.reader(io.StringIO(text)):
        if len(row) < 3 or row[1].strip() != "Data":
            continue
        section = row[0].strip()
        if section == "Mark-to-Market Performance Summary":
            return True
        if section == "Realized & Unrealized Performance Summary":
            for cell in row[2:]:
                try:
                    if Decimal(cell.strip().replace(",", "")) != 0:
                        return True
                except Exception:
                    continue
    return False


def _explain_no_trades(path: str, ins: FileInspection) -> None:
    """Replace the bare ``no_trades`` verdict with a message saying why and what to do."""
    unsupported = [(s.reason.replace(" (not supported)", ""), s.count)
                   for s in ins.rows.skipped if s.reason.endswith("(not supported)")]
    if ins.rows.total > 0 and unsupported and ins.rows.usable == 0 and len(unsupported) == len(ins.rows.skipped):
        listing = ", ".join(f"{name}: {n}" for name, n in unsupported)
        ins.warnings.append(
            f"This file only contains unsupported asset types ({listing}). "
            "Only stocks and ETFs can be calculated at the moment.")
        ins.next_actions = _actions("request_support", "remove_file")
    elif ins.rows.total > 0:
        ins.next_actions = _actions("view_export_steps", "remove_file")  # stock rows unreadable
    elif _summary_sections_show_activity(path):
        ins.warnings.append(
            "Your statement was generated without the Trades section, so we cannot see individual "
            "trades. Run the Activity Statement again with Trades enabled, or use a Flex Query.")
        ins.next_actions = _actions("view_export_steps", "remove_file")
    else:
        ins.warnings.append(
            "There are no trades in this period. Upload a period that has trades.")
        ins.next_actions = _actions("add_earlier_file", "remove_file")


# --------------------------------------------------------------- per-file

def _basic_inspection(filename: str, path: str, fmt: FormatInfo, trades: List[_Trade],
                      is_csv: bool) -> FileInspection:
    columns: List[ColumnInfo] = []
    if is_csv:
        try:
            text, _ = IBKRActivityStatementConverter._read_text(path)
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
            for h in reader.fieldnames or []:
                values = [(r.get(h) or "").strip() for r in rows]
                filled = [v for v in values if v]
                columns.append(ColumnInfo(
                    header=h, mapped_to=None, status="understood", filled=len(filled),
                    blank=len(values) - len(filled), samples=list(dict.fromkeys(filled))[:3]))
        except Exception:
            logger.debug("Could not read column stats for %s", filename, exc_info=True)
    ins = FileInspection(
        filename=filename, format=fmt, verdict="ready", columns=columns,
        rows=RowStats(total=len(trades), usable=len(trades)), summary=_summarise(trades))
    if not trades:
        ins.verdict = "no_trades"
        ins.warnings.append("We found no buy or sell transactions in this file.")
        ins.next_actions = _actions("view_export_steps", "remove_file")
    return ins


def _inspect_one(name: str, data: bytes, workdir: str, index: int) -> Tuple[FileInspection, List[_Trade]]:
    fp = identify_format(_raw_cells(data), name)
    if fp is not None and not fp.supported:
        return _unsupported(name, fp), []

    suffix = re.sub(r"[^A-Za-z0-9.]", "", os.path.splitext(Path(name).name)[1])[:8] or ".csv"
    path = os.path.join(workdir, f"upload_{index}{suffix}")
    with open(path, "wb") as f:
        f.write(data)

    if fp is not None and fp.id == "ibkr_activity_statement":
        conv = IBKRActivityStatementConverter()
        ins = conv.inspect(path)
        ins.filename = name
        ins.format = _format_info(fp)
        trades: List[_Trade] = []
        if ins.verdict == "no_trades":
            _explain_no_trades(path, ins)
        elif ins.verdict == "blocked":
            ins.next_actions = _actions("view_export_steps", "remove_file")
        else:
            trades = [t for t in map(_trade_from_standard, conv.convert(path)) if t]
            if ins.verdict == "ready_with_warnings" and any(s.count for s in ins.rows.skipped):
                ins.next_actions = _actions("show_skipped_rows")
        return ins, trades

    if fp is not None and fp.id == "ibkr_qfx":
        return _inspect_qfx(name, path, fp)

    detection = get_factory().detect_broker(path)
    if detection is None:
        return _unknown(name), []
    conv = detection["converter"]
    fmt = _format_info(fp, 1.0) if fp else FormatInfo(
        id=re.sub(r"\W+", "_", detection["broker"].lower()).strip("_"),
        name=detection["broker"], confidence=float(detection["confidence"]), supported=True)
    ins = conv.inspect(path)
    if ins is not None:
        ins.filename, ins.format = name, fmt
        txs = conv.convert(path)
    else:
        txs = conv.convert(path)
        ins = _basic_inspection(name, path, fmt, [t for t in map(_trade_from_standard, txs) if t], True)
    return ins, [t for t in map(_trade_from_standard, txs) if t]


def _inspect_qfx(name: str, path: str, fp: FormatFingerprint) -> Tuple[FileInspection, List[_Trade]]:
    from ..parsers.qfx_parser import QfxParser
    from ..models.domain_models import TransactionType as DomainType

    parsed = QfxParser().parse(path)
    trades = []
    for tx in parsed:
        if tx.transaction_type not in (DomainType.BUY, DomainType.SELL) or tx.date is None:
            continue
        symbol = getattr(tx.security, "symbol", None)
        if symbol:
            trades.append(_Trade(tx.date, symbol, tx.transaction_type == DomainType.BUY,
                                 abs(Decimal(str(tx.quantity))), Decimal(str(tx.price_per_unit))))
    return _basic_inspection(name, path, _format_info(fp), trades, False), trades


# ----------------------------------------------------------- cross-file checks

def _bump(ins: FileInspection) -> None:
    if ins.verdict == "ready":
        ins.verdict = "ready_with_warnings"


def _add_actions(ins: FileInspection, *ids: str) -> None:
    have = {a.id for a in ins.next_actions}
    ins.next_actions.extend(a for a in _actions(*ids) if a.id not in have)


def _subtract(trades: List[_Trade], other: List[_Trade]) -> List[_Trade]:
    """Remove from ``trades`` as many copies of each trade as ``other`` holds (multiset difference).

    Identical fills inside one file survive unless the other file really holds the same number.
    """
    seen = Counter(t.key for t in other)
    kept = []
    for t in trades:
        if seen[t.key] > 0:
            seen[t.key] -= 1
        else:
            kept.append(t)
    return kept


def _mark_duplicates(entries: List[_Entry]) -> Dict[int, List[_Trade]]:
    """Warn on redundant files and return the trades to use for the walk.

    Design choice: the sell-without-buy walk runs on de-duplicated trades, so a duplicate
    upload neither hides a shortfall (by double-counting buys) nor fakes one. Overlap is
    measured against the smaller file, so a monthly export uploaded BEFORE the annual
    export that contains it is caught too. The redundant file is the smaller one (the
    later one when sizes tie); it is warned about and contributes only trades the other
    file does not hold.
    """
    effective: Dict[int, List[_Trade]] = {i: e.trades for i, e in enumerate(entries)}
    for i, e in enumerate(entries):
        for j in range(i):
            earlier = entries[j]
            if e.content_hash == earlier.content_hash:
                ratio, same = 1.0, True
            elif e.trades and earlier.trades:
                mine, theirs = Counter(t.key for t in e.trades), Counter(t.key for t in earlier.trades)
                ratio = sum((mine & theirs).values()) / min(len(e.trades), len(earlier.trades))
                same = False
            else:
                continue
            if ratio <= DUPLICATE_RATIO:
                continue
            # Redundant file r (warned, de-duplicated) versus the file o it repeats
            if len(earlier.trades) < len(e.trades):
                r, o = j, i
            else:
                r, o = i, j
            red, other = entries[r], entries[o]
            what = "an identical copy of" if same else f"{ratio:.0%} the same trades as"
            if r == j:
                what = f"contained in ({ratio:.0%} of its trades appear in)"
            red.inspection.warnings.append(
                f"This file looks like a duplicate: it is {what} {other.name}. "
                "Counting both would double the trades, so duplicate trades are ignored in these checks. "
                "Remove one of them unless they genuinely differ.")
            _bump(red.inspection)
            if red.trades:
                effective[r] = _subtract(effective[r], other.trades)
            break
    return effective


def _find_sells_without_buy(entries: List[_Entry], effective: Dict[int, List[_Trade]]) -> List[Tuple[int, SellWithoutBuy]]:
    flat = [(t, i) for i, trades in effective.items() for t in trades]
    # Same-day buys count before sells (HMRC same-day rule); name breaks remaining ties so
    # the result never depends on upload order.
    flat.sort(key=lambda p: (p[0].date.date(), 0 if p[0].is_buy else 1, p[0].symbol.strip().upper(),
                             entries[p[1]].name, p[0].quantity))
    held: Dict[str, Decimal] = {}
    found: List[Tuple[int, SellWithoutBuy]] = []
    for t, i in flat:
        key = t.symbol.strip().upper()
        if t.is_buy:
            held[key] = held.get(key, Decimal(0)) + t.quantity
            continue
        have = held.get(key, Decimal(0))
        if t.quantity > have:
            found.append((i, SellWithoutBuy(t.symbol, t.date.date().isoformat(),
                                            format(t.quantity - have, "f").rstrip("0").rstrip(".") or "0",
                                            entries[i].name)))
            held[key] = Decimal(0)
        else:
            held[key] = have - t.quantity
    found.sort(key=lambda p: (p[1].date, p[1].symbol.strip().upper(), p[1].filename, p[1].quantity))
    return found


def _apply_sell_warnings(entries: List[_Entry], found: List[Tuple[int, SellWithoutBuy]]) -> None:
    by_file: Dict[int, List[SellWithoutBuy]] = {}
    for i, s in found:
        by_file.setdefault(i, []).append(s)
    for i, sells in by_file.items():
        ins = entries[i].inspection
        listing = "; ".join(f"{s.symbol} on {s.date} ({s.quantity} shares)" for s in sells)
        tickers = ", ".join(sorted({s.symbol for s in sells}))
        ins.warnings.append(
            f"{len(sells)} sell(s) have no earlier buy in the files you uploaded: {listing}. "
            f"The Section 104 pool for {tickers} is missing those shares and their cost, so the "
            "allowable cost is understated (possibly zero) and the calculated gain is overstated. "
            "Add an earlier export that covers the purchases, or enter your opening holdings.")
        _bump(ins)
        _add_actions(ins, "add_earlier_file", "add_opening_holdings")


# ------------------------------------------------------------------ public API

def inspect_files(files: List[Tuple[str, bytes]]) -> InspectionResult:
    """Inspect all uploaded files together. Never raises for bad input."""
    try:
        register_default_converters()
    except Exception:
        logger.warning("Could not register converters", exc_info=True)
    entries: List[_Entry] = []
    workdir = tempfile.mkdtemp(prefix="cgt_inspect_")
    try:
        for index, (name, data) in enumerate(files):
            try:
                ins, trades = _inspect_one(name, data, workdir, index)
            except Exception as exc:  # never let one bad file break the batch
                logger.warning("Inspection failed for %s: %s", name, exc, exc_info=True)
                ins, trades = _unknown(name, "The file could not be read."), []
            entries.append(_Entry(name, hashlib.sha256(data).hexdigest(), ins, trades))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    expectations: List[Expectation] = []
    requires_ack = False
    try:
        effective = _mark_duplicates(entries)
        if any(e.trades for e in entries):
            found = _find_sells_without_buy(entries, effective)
            _apply_sell_warnings(entries, found)
            requires_ack = bool(found)
            expectations.append(Expectation(RULE_SELL_HAS_BUY, not found, [s for _, s in found]))
    except Exception:
        # Cross-file checks are advisory: fall back to per-file results only
        logger.warning("Cross-file checks failed; returning per-file results only", exc_info=True)
        expectations, requires_ack = [], False

    inspections = [e.inspection for e in entries]
    can_continue = bool(inspections) and not any(f.verdict in BAD_VERDICTS for f in inspections)
    return InspectionResult(inspections, expectations, can_continue, requires_ack)
