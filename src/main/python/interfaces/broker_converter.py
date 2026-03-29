"""
Broker converter interface for multi-broker support.

This module defines the abstract interface that all broker-specific converters
must implement. It follows the Strategy pattern and Interface Segregation Principle.

Design Principles:
- Interface Segregation: Minimal required methods
- Dependency Inversion: Depend on abstractions, not concrete implementations
- Open/Closed: New brokers can be added without modifying existing code
- Single Responsibility: Each converter handles one broker format
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pathlib import Path

from ..models.standard_transaction import StandardTransaction


class BrokerConverterInterface(ABC):
    """
    Abstract base class for all broker-specific CSV converters.

    Each broker converter must implement this interface to convert their
    proprietary CSV format into our StandardTransaction format.

    Design Pattern: Strategy Pattern
    - Each broker is a different strategy for parsing CSV data
    - All strategies conform to the same interface
    - Strategies can be swapped at runtime via ConverterFactory

    Usage:
        converter = IBKRConverter()
        if converter.can_handle(file_path):
            transactions = converter.convert(file_path, base_currency="GBP")
    """

    @property
    @abstractmethod
    def broker_name(self) -> str:
        """
        Get the name of the broker this converter handles.

        Returns:
            Human-readable broker name (e.g., "Interactive Brokers", "Trading 212")
        """

    @property
    @abstractmethod
    def supported_file_extensions(self) -> List[str]:
        """
        Get list of supported file extensions.

        Returns:
            List of file extensions without dots (e.g., ["csv", "xlsx"])
        """

    @abstractmethod
    def can_handle(self, file_path: str) -> bool:
        """
        Determine if this converter can handle the given file.

        This method should check:
        1. File extension is supported
        2. File structure matches expected format (header columns, etc.)
        3. File contains broker-specific identifiers

        Args:
            file_path: Path to the CSV file

        Returns:
            True if this converter can handle the file, False otherwise
        """

    @abstractmethod
    def detect_confidence(self, file_path: str) -> float:
        """
        Calculate confidence score that this file is from this broker.

        Used by ConverterFactory for auto-detection when multiple converters
        claim they can handle a file.

        Confidence scoring guidelines:
        - 1.0: Definitive match (broker ID found in file)
        - 0.8-0.9: Very likely (all expected columns present)
        - 0.5-0.7: Possible (some expected columns present)
        - 0.0-0.4: Unlikely (few or no matches)

        Args:
            file_path: Path to the CSV file

        Returns:
            Confidence score between 0.0 and 1.0
        """

    @abstractmethod
    def convert(
        self,
        file_path: str,
        base_currency: str = "GBP",
        **kwargs
    ) -> List[StandardTransaction]:
        """
        Convert broker CSV file to list of StandardTransaction objects.

        This is the main conversion method. It should:
        1. Read and parse the CSV file
        2. Validate the file structure
        3. Map broker columns to StandardTransaction fields
        4. Handle broker-specific quirks (date formats, transaction codes, etc.)
        5. Fetch FX rates if not provided by broker
        6. Return list of validated StandardTransaction objects

        Args:
            file_path: Path to the CSV file
            base_currency: Base currency for tax reporting (default: GBP)
            **kwargs: Additional broker-specific parameters

        Returns:
            List of StandardTransaction objects

        Raises:
            ValueError: If file format is invalid
            FileNotFoundError: If file doesn't exist
            BrokerConversionError: If conversion fails
        """

    @abstractmethod
    def validate_file_structure(self, file_path: str) -> Dict[str, Any]:
        """
        Validate the file structure and return metadata.

        This method should check:
        - File is readable
        - Required columns are present
        - Data types are correct
        - No critical data is missing

        Args:
            file_path: Path to the CSV file

        Returns:
            Dictionary with validation results:
            {
                'valid': bool,
                'errors': List[str],
                'warnings': List[str],
                'row_count': int,
                'columns': List[str],
                'broker_detected': str,
                'confidence': float
            }
        """

    def get_required_columns(self) -> List[str]:
        """
        Get list of required column names for this broker.

        This is a helper method that can be overridden by subclasses.
        Default implementation returns empty list.

        Returns:
            List of required column names
        """
        return []

    def get_optional_columns(self) -> List[str]:
        """
        Get list of optional column names for this broker.

        This is a helper method that can be overridden by subclasses.
        Default implementation returns empty list.

        Returns:
            List of optional column names
        """
        return []

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"{self.__class__.__name__}(broker={self.broker_name})"


class BrokerConversionError(Exception):
    """
    Exception raised when broker CSV conversion fails.

    Attributes:
        broker: Name of the broker
        file_path: Path to the file that failed
        message: Error message
        errors: List of specific errors
    """

    def __init__(
        self,
        broker: str,
        file_path: str,
        message: str,
        errors: Optional[List[str]] = None
    ):
        self.broker = broker
        self.file_path = file_path
        self.message = message
        self.errors = errors or []

        full_message = f"[{broker}] {message}"
        if self.errors:
            full_message += f"\nErrors:\n" + "\n".join(f"  - {e}" for e in self.errors)

        super().__init__(full_message)


class BaseBrokerConverter(BrokerConverterInterface):
    """
    Base implementation of BrokerConverterInterface with common functionality.

    This class provides default implementations of common methods that
    can be reused by specific broker converters.

    Subclasses should override:
    - broker_name (property)
    - supported_file_extensions (property)
    - convert() method
    - get_required_columns() method (optional)

    Design Pattern: Template Method Pattern
    - Defines skeleton of conversion algorithm
    - Subclasses fill in specific steps
    """

    def can_handle(self, file_path: str) -> bool:
        """
        Default implementation checks file extension and required columns.

        Subclasses can override for more sophisticated detection.
        """
        path = Path(file_path)

        # Check file exists
        if not path.exists():
            return False

        # Check file extension
        extension = path.suffix.lstrip('.').lower()
        if extension not in self.supported_file_extensions:
            return False

        # Check confidence score
        confidence = self.detect_confidence(file_path)
        return confidence >= 0.5

    def detect_confidence(self, file_path: str) -> float:
        """
        Default implementation based on column matching.

        Subclasses should override for broker-specific detection.
        """
        try:
            validation = self.validate_file_structure(file_path)
            if not validation['valid']:
                return 0.0

            required_cols = set(self.get_required_columns())
            if not required_cols:
                return 0.5  # No required columns defined

            file_cols = set(validation.get('columns', []))
            matches = len(required_cols & file_cols)
            total = len(required_cols)

            return matches / total if total > 0 else 0.0

        except Exception:
            return 0.0

    def validate_file_structure(self, file_path: str) -> Dict[str, Any]:
        """
        Default validation implementation.

        Subclasses can override for more sophisticated validation.
        """
        import csv

        path = Path(file_path)
        errors = []
        warnings = []

        # Check file exists
        if not path.exists():
            errors.append(f"File not found: {file_path}")
            return {
                'valid': False,
                'errors': errors,
                'warnings': warnings,
                'row_count': 0,
                'columns': [],
                'broker_detected': self.broker_name,
                'confidence': 0.0
            }

        # Read CSV header
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                header = next(reader)
                row_count = sum(1 for _ in reader)

            # Check required columns
            required_cols = set(self.get_required_columns())
            file_cols = set(header)
            missing_cols = required_cols - file_cols

            if missing_cols:
                errors.append(f"Missing required columns: {', '.join(missing_cols)}")

            # Check optional columns
            optional_cols = set(self.get_optional_columns())
            missing_optional = optional_cols - file_cols
            if missing_optional:
                warnings.append(f"Missing optional columns: {', '.join(missing_optional)}")

            confidence = self.detect_confidence(file_path)

            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'row_count': row_count,
                'columns': header,
                'broker_detected': self.broker_name,
                'confidence': confidence
            }

        except Exception as e:
            errors.append(f"Failed to read file: {str(e)}")
            return {
                'valid': False,
                'errors': errors,
                'warnings': warnings,
                'row_count': 0,
                'columns': [],
                'broker_detected': self.broker_name,
                'confidence': 0.0
            }
