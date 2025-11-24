"""Converters package init."""

from .converter_factory import (
    ConverterFactory,
    get_factory,
    reset_factory
)
from .ibkr_converter import IBKRConverter

def register_default_converters():
    """Register all default converters with the global factory."""
    factory = get_factory()
    try:
        factory.register(IBKRConverter())
    except ValueError:
        pass  # Already registered

__all__ = [
    'ConverterFactory',
    'get_factory',
    'reset_factory',
    'IBKRConverter',
    'register_default_converters',
]
