"""
Converter factory for automatic broker detection and conversion.

This module implements the Factory pattern to automatically detect which broker
a CSV file is from and route it to the appropriate converter.

Design Principles:
- Factory Pattern: Centralized object creation
- Strategy Pattern: Different conversion strategies for different brokers
- Open/Closed: New brokers can be registered without modifying factory code
- Single Responsibility: Factory only handles converter selection
"""

import logging
from typing import List, Dict, Any, Optional, Type
from pathlib import Path

from ..interfaces.broker_converter import (
    BrokerConverterInterface,
    BrokerConversionError
)
from ..models.standard_transaction import StandardTransaction

logger = logging.getLogger(__name__)


class ConverterFactory:
    """
    Factory for creating and managing broker converters.
    
    This class implements the Factory pattern with automatic broker detection.
    It maintains a registry of available converters and can automatically
    detect which converter to use based on file structure.
    
    Design Pattern: Factory + Registry Pattern
    - Centralized converter creation
    - Auto-detection of broker from file
    - Extensible via converter registration
    
    Usage:
        factory = ConverterFactory()
        factory.register(IBKRConverter())
        factory.register(Trading212Converter())
        
        # Auto-detect and convert
        transactions = factory.convert_file("transactions.csv")
        
        # Or specify broker
        transactions = factory.convert_file("transactions.csv", broker="IBKR")
    """
    
    def __init__(self):
        """Initialize the factory with empty converter registry."""
        self._converters: Dict[str, BrokerConverterInterface] = {}
        self._converter_list: List[BrokerConverterInterface] = []
    
    def register(self, converter: BrokerConverterInterface) -> None:
        """
        Register a broker converter.
        
        Args:
            converter: Instance of a broker converter
            
        Raises:
            ValueError: If converter with same name already registered
        """
        broker_name = converter.broker_name
        
        if broker_name in self._converters:
            raise ValueError(
                f"Converter for '{broker_name}' is already registered. "
                f"Use unregister() first if you want to replace it."
            )
        
        self._converters[broker_name] = converter
        self._converter_list.append(converter)
        
        logger.info(f"Registered converter for {broker_name}")
    
    def unregister(self, broker_name: str) -> None:
        """
        Unregister a broker converter.
        
        Args:
            broker_name: Name of the broker to unregister
            
        Raises:
            KeyError: If broker not found
        """
        if broker_name not in self._converters:
            raise KeyError(f"No converter registered for '{broker_name}'")
        
        converter = self._converters[broker_name]
        del self._converters[broker_name]
        self._converter_list.remove(converter)
        
        logger.info(f"Unregistered converter for {broker_name}")
    
    def get_converter(self, broker_name: str) -> BrokerConverterInterface:
        """
        Get a specific converter by broker name.
        
        Args:
            broker_name: Name of the broker
            
        Returns:
            The converter instance
            
        Raises:
            KeyError: If broker not found
        """
        if broker_name not in self._converters:
            available = ', '.join(self._converters.keys())
            raise KeyError(
                f"No converter registered for '{broker_name}'. "
                f"Available brokers: {available}"
            )
        
        return self._converters[broker_name]
    
    def list_brokers(self) -> List[str]:
        """
        Get list of all registered broker names.
        
        Returns:
            List of broker names
        """
        return list(self._converters.keys())
    
    def detect_broker(
        self,
        file_path: str,
        min_confidence: float = 0.5
    ) -> Optional[Dict[str, Any]]:
        """
        Automatically detect which broker a file is from.
        
        This method tries all registered converters and returns the one
        with the highest confidence score above the minimum threshold.
        
        Args:
            file_path: Path to the CSV file
            min_confidence: Minimum confidence score (0.0 to 1.0)
            
        Returns:
            Dictionary with detection results:
            {
                'broker': str,
                'converter': BrokerConverterInterface,
                'confidence': float,
                'alternatives': List[Dict] - other possible matches
            }
            Returns None if no converter can handle the file
        """
        if not Path(file_path).exists():
            logger.error(f"File not found: {file_path}")
            return None
        
        # Get confidence scores from all converters
        scores = []
        for converter in self._converter_list:
            try:
                confidence = converter.detect_confidence(file_path)
                if confidence >= min_confidence:
                    scores.append({
                        'broker': converter.broker_name,
                        'converter': converter,
                        'confidence': confidence
                    })
            except Exception as e:
                logger.warning(
                    f"Error detecting {converter.broker_name}: {str(e)}"
                )
        
        if not scores:
            logger.warning(
                f"No converter could handle {file_path} "
                f"(min confidence: {min_confidence})"
            )
            return None
        
        # Sort by confidence (highest first)
        scores.sort(key=lambda x: x['confidence'], reverse=True)
        
        best_match = scores[0]
        alternatives = scores[1:] if len(scores) > 1 else []
        
        logger.info(
            f"Detected {best_match['broker']} "
            f"(confidence: {best_match['confidence']:.2f})"
        )
        
        if alternatives:
            alt_names = [f"{a['broker']} ({a['confidence']:.2f})" 
                         for a in alternatives[:3]]
            logger.info(f"Alternatives: {', '.join(alt_names)}")
        
        return {
            'broker': best_match['broker'],
            'converter': best_match['converter'],
            'confidence': best_match['confidence'],
            'alternatives': alternatives
        }
    
    def convert_file(
        self,
        file_path: str,
        broker: Optional[str] = None,
        base_currency: str = "GBP",
        min_confidence: float = 0.8,
        **kwargs
    ) -> List[StandardTransaction]:
        """
        Convert a broker CSV file to StandardTransaction objects.
        
        This is the main entry point for file conversion. It can either:
        1. Use a specified broker converter
        2. Auto-detect the broker and use appropriate converter
        
        Args:
            file_path: Path to the CSV file
            broker: Optional broker name (auto-detect if None)
            base_currency: Base currency for tax reporting (default: GBP)
            min_confidence: Minimum confidence for auto-detection (default: 0.8)
            **kwargs: Additional parameters passed to converter
            
        Returns:
            List of StandardTransaction objects
            
        Raises:
            FileNotFoundError: If file doesn't exist
            BrokerConversionError: If conversion fails
            ValueError: If broker specified but not registered
        """
        # Check file exists
        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get converter
        if broker:
            # Use specified broker
            try:
                converter = self.get_converter(broker)
                logger.info(f"Using specified converter: {broker}")
            except KeyError as e:
                raise ValueError(str(e))
        else:
            # Auto-detect broker
            detection = self.detect_broker(file_path, min_confidence)
            
            if not detection:
                raise BrokerConversionError(
                    broker="Unknown",
                    file_path=file_path,
                    message=(
                        f"Could not detect broker from file. "
                        f"No converter achieved minimum confidence of {min_confidence}. "
                        f"Try specifying the broker explicitly."
                    )
                )
            
            converter = detection['converter']
            confidence = detection['confidence']
            
            logger.info(
                f"Auto-detected {detection['broker']} "
                f"(confidence: {confidence:.2f})"
            )
            
            # Warn if confidence is not very high
            if confidence < 0.9:
                logger.warning(
                    f"Confidence is below 0.9 ({confidence:.2f}). "
                    f"Results may not be accurate. "
                    f"Consider specifying broker explicitly."
                )
        
        # Convert file
        try:
            transactions = converter.convert(
                file_path=file_path,
                base_currency=base_currency,
                **kwargs
            )
            
            logger.info(
                f"Successfully converted {len(transactions)} transactions "
                f"from {converter.broker_name}"
            )
            
            return transactions
            
        except Exception as e:
            raise BrokerConversionError(
                broker=converter.broker_name,
                file_path=file_path,
                message=f"Conversion failed: {str(e)}"
            )
    
    def validate_file(
        self,
        file_path: str,
        broker: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate a file without converting it.
        
        Useful for pre-flight checks before conversion.
        
        Args:
            file_path: Path to the CSV file
            broker: Optional broker name (auto-detect if None)
            
        Returns:
            Validation results dictionary
        """
        if broker:
            converter = self.get_converter(broker)
        else:
            detection = self.detect_broker(file_path, min_confidence=0.5)
            if not detection:
                return {
                    'valid': False,
                    'errors': ['Could not detect broker from file'],
                    'warnings': [],
                    'broker_detected': None,
                    'confidence': 0.0
                }
            converter = detection['converter']
        
        return converter.validate_file_structure(file_path)
    
    def get_supported_brokers_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all supported brokers.
        
        Returns:
            List of dictionaries with broker information:
            [
                {
                    'name': str,
                    'supported_extensions': List[str],
                    'required_columns': List[str],
                    'optional_columns': List[str]
                },
                ...
            ]
        """
        info = []
        for converter in self._converter_list:
            info.append({
                'name': converter.broker_name,
                'supported_extensions': converter.supported_file_extensions,
                'required_columns': converter.get_required_columns(),
                'optional_columns': converter.get_optional_columns()
            })
        return info
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        brokers = ', '.join(self._converters.keys())
        return f"ConverterFactory(brokers=[{brokers}])"


# Global singleton instance
_factory_instance: Optional[ConverterFactory] = None


def get_factory() -> ConverterFactory:
    """
    Get the global ConverterFactory singleton instance.
    
    This provides a convenient way to access the factory without
    passing it around everywhere.
    
    Returns:
        The global ConverterFactory instance
    """
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = ConverterFactory()
    return _factory_instance


def reset_factory() -> None:
    """
    Reset the global factory instance.
    
    Useful for testing to ensure clean state.
    """
    global _factory_instance
    _factory_instance = None
