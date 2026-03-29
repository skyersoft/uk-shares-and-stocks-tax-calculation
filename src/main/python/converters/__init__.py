"""Converters package init."""

from .converter_factory import (
    ConverterFactory,
    get_factory,
    reset_factory
)
from .ibkr_converter import IBKRConverter
from .trading212_converter import Trading212Converter
from .hargreaves_converter import HargreavesConverter
from .freetrade_converter import FreetradeConverter
from .fidelity_converter import FidelityConverter


def register_default_converters():
    """Register all default converters with the global factory."""
    factory = get_factory()
    try:
        factory.register(IBKRConverter())
    except ValueError:
        pass  # Already registered
    try:
        factory.register(Trading212Converter())
    except ValueError:
        pass  # Already registered
    try:
        factory.register(HargreavesConverter())
    except ValueError:
        pass  # Already registered
    try:
        factory.register(FreetradeConverter())
    except ValueError:
        pass  # Already registered
    try:
        factory.register(FidelityConverter())
    except ValueError:
        pass  # Already registered


__all__ = [
    'ConverterFactory',
    'get_factory',
    'reset_factory',
    'IBKRConverter',
    'Trading212Converter',
    'HargreavesConverter',
    'FreetradeConverter',
    'FidelityConverter',
    'register_default_converters',
]
