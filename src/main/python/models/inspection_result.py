"""Result of inspecting a set of uploaded files together (the upload "X-ray")."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Union

from .file_inspection import FileInspection


@dataclass
class SellWithoutBuy:
    """A sell larger than the quantity held at that point; ``quantity`` is the uncovered amount."""
    symbol: str
    date: str  # ISO YYYY-MM-DD
    quantity: str  # decimal as string, JSON-safe
    filename: str

    def to_dict(self) -> Dict[str, Any]:
        return {"symbol": self.symbol, "date": self.date,
                "quantity": self.quantity, "filename": self.filename}


@dataclass
class Expectation:
    rule: str
    passed: bool
    details: List[Union[SellWithoutBuy, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule": self.rule,
            "passed": self.passed,
            "details": [d.to_dict() if isinstance(d, SellWithoutBuy) else d for d in self.details],
        }


@dataclass
class InspectionResult:
    files: List[FileInspection]
    expectations: List[Expectation]
    can_continue: bool
    requires_acknowledgement: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "files": [f.to_dict() for f in self.files],
            "expectations": [e.to_dict() for e in self.expectations],
            "can_continue": self.can_continue,
            "requires_acknowledgement": self.requires_acknowledgement,
        }
