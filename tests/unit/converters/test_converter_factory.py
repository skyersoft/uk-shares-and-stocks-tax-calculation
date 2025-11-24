"""Unit tests for ConverterFactory."""
import pytest
from unittest.mock import MagicMock, patch

from src.main.python.converters.converter_factory import ConverterFactory, get_factory, reset_factory
from src.main.python.converters.ibkr_converter import IBKRConverter
from src.main.python.converters.trading212_converter import Trading212Converter

class TestConverterFactory:
    """Tests for ConverterFactory."""
    
    @pytest.fixture(autouse=True)
    def setup_teardown(self):
        """Reset factory before and after each test."""
        reset_factory()
        yield
        reset_factory()
        
    def test_register_converter(self):
        """Test registering a converter."""
        factory = ConverterFactory()
        converter = IBKRConverter()
        
        factory.register(converter)
        
        assert "Interactive Brokers" in factory.list_brokers()
        assert factory.get_converter("Interactive Brokers") == converter
        
    def test_register_duplicate_raises_error(self):
        """Test registering duplicate converter raises error."""
        factory = ConverterFactory()
        converter = IBKRConverter()
        
        factory.register(converter)
        
        with pytest.raises(ValueError):
            factory.register(converter)
            
    def test_get_converter_not_found(self):
        """Test getting non-existent converter raises error."""
        factory = ConverterFactory()
        
        with pytest.raises(KeyError):
            factory.get_converter("Unknown Broker")
            
    def test_detect_broker_ibkr(self):
        """Test detecting IBKR broker."""
        factory = ConverterFactory()
        factory.register(IBKRConverter())
        
        # Mock detect_confidence for IBKR and Path.exists
        with patch.object(IBKRConverter, 'detect_confidence', return_value=1.0), \
             patch('src.main.python.converters.converter_factory.Path.exists', return_value=True):
            result = factory.detect_broker("dummy.csv")
            
            assert result is not None
            assert result['broker'] == "Interactive Brokers"
            assert result['confidence'] == 1.0
            
    def test_detect_broker_trading212(self):
        """Test detecting Trading 212 broker."""
        factory = ConverterFactory()
        factory.register(Trading212Converter())
        
        # Mock detect_confidence for T212 and Path.exists
        with patch.object(Trading212Converter, 'detect_confidence', return_value=1.0), \
             patch('src.main.python.converters.converter_factory.Path.exists', return_value=True):
            result = factory.detect_broker("dummy.csv")
            
            assert result is not None
            assert result['broker'] == "Trading 212"
            assert result['confidence'] == 1.0
            
    def test_detect_broker_ambiguous(self):
        """Test ambiguous detection returns highest confidence."""
        factory = ConverterFactory()
        factory.register(IBKRConverter())
        factory.register(Trading212Converter())
        
        # Mock confidence: IBKR=0.6, T212=0.9
        with patch.object(IBKRConverter, 'detect_confidence', return_value=0.6), \
             patch.object(Trading212Converter, 'detect_confidence', return_value=0.9), \
             patch('src.main.python.converters.converter_factory.Path.exists', return_value=True):
            
            result = factory.detect_broker("dummy.csv")
            
            assert result is not None
            assert result['broker'] == "Trading 212"
            assert result['confidence'] == 0.9
            assert len(result['alternatives']) == 1
            assert result['alternatives'][0]['broker'] == "Interactive Brokers"
            
    def test_detect_broker_none_found(self):
        """Test no broker detected."""
        factory = ConverterFactory()
        factory.register(IBKRConverter())
        
        with patch.object(IBKRConverter, 'detect_confidence', return_value=0.1), \
             patch('src.main.python.converters.converter_factory.Path.exists', return_value=True):
            result = factory.detect_broker("dummy.csv", min_confidence=0.5)
            
            assert result is None

    def test_singleton_factory(self):
        """Test get_factory returns singleton."""
        f1 = get_factory()
        f2 = get_factory()
        assert f1 is f2
        
        reset_factory()
        f3 = get_factory()
        assert f3 is not f1
