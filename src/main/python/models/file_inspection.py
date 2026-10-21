"""Data model for the upload "X-ray": what we understood from a broker file."""
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Literal, Optional

Verdict = Literal[
    "ready", "ready_with_warnings", "blocked", "unsupported_format", "no_trades", "unknown"
]
ColumnStatus = Literal["understood", "check", "ignored", "blocked"]


@dataclass
class ColumnInfo:
    header: str
    mapped_to: Optional[str]
    status: ColumnStatus
    filled: int
    blank: int
    samples: List[str] = field(default_factory=list)
    note: Optional[str] = None


@dataclass
class SkippedRows:
    reason: str
    count: int


@dataclass
class RowStats:
    total: int
    usable: int
    skipped: List[SkippedRows] = field(default_factory=list)


@dataclass
class FormatInfo:
    id: str
    name: str
    confidence: float
    supported: bool


@dataclass
class Summary:
    buys: int = 0
    sells: int = 0
    tickers: List[str] = field(default_factory=list)
    currencies: List[str] = field(default_factory=list)
    first_date: Optional[str] = None  # ISO YYYY-MM-DD
    last_date: Optional[str] = None
    tax_years: List[str] = field(default_factory=list)  # "YYYY-YYYY"


@dataclass
class NextAction:
    id: str
    label: str


@dataclass
class FileInspection:
    filename: str
    format: Optional[FormatInfo]
    verdict: Verdict
    columns: List[ColumnInfo]
    rows: RowStats
    summary: Summary
    next_actions: List[NextAction] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
