"""Integration tests for the asynchronous calculation functionality in the web app."""
import os
import pytest
from flask import url_for
import time
from werkzeug.datastructures import FileStorage

from web_app.app import create_app
from web_app.services.calculation_service import CalculationService
from web_app.services.storage_service import StorageService


@pytest.fixture
def app():
    """Create a Flask application for testing."""
    app = create_app({
        'TESTING': True,
        'UPLOAD_FOLDER': 'tests/fixtures/uploads',
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024  # 16MB max file size
    })
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def test_csv_file():
    """Create a test CSV file for uploads."""
    csv_content = '''ClientAccountID,Symbol,SecurityID,SecurityIDType,Buy/Sell,TradeDate,SettleDate,Quantity,UnitPrice,TotalAmount,Commission,Currency,CurrencyRate,AssetClass
U12345,AAPL,US0378331005,ISIN,BUY,2024-01-15,2024-01-17,100,150.00,-15000.00,7.95,USD,0.787,STK
U12345,AAPL,US0378331005,ISIN,SELL,2024-06-15,2024-06-17,100,180.00,18000.00,8.25,USD,0.780,STK'''
    
    file_path = 'tests/fixtures/test_trades.csv'
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w') as f:
        f.write(csv_content)
    
    yield file_path
    
    # Cleanup
    if os.path.exists(file_path):
        os.remove(file_path)


class TestAsyncCalculator:
    """Test cases for asynchronous calculation functionality."""
    
    def test_submit_calculation_creates_task(self, client, test_csv_file):
        """Test that submitting a calculation creates a task and returns a task ID."""
        with open(test_csv_file, 'rb') as fp:
            data = {
                'file': (fp, 'test_trades.csv'),
                'tax_year': '2024-2025'
            }
            response = client.post('/api/calculate', data=data)
            
            assert response.status_code == 202  # Accepted
            assert 'task_id' in response.json
            assert isinstance(response.json['task_id'], str)
    
    def test_get_task_status(self, client, test_csv_file):
        """Test retrieving the status of a calculation task."""
        # First submit a calculation
        with open(test_csv_file, 'rb') as fp:
            data = {
                'file': (fp, 'test_trades.csv'),
                'tax_year': '2024-2025'
            }
            response = client.post('/api/calculate', data=data)
            task_id = response.json['task_id']
        
        # Then check its status
        status_response = client.get(f'/api/task/{task_id}/status')
        assert status_response.status_code == 200
        assert 'status' in status_response.json
        assert status_response.json['status'] in ['pending', 'in_progress', 'completed', 'failed']
    
    def test_get_calculation_results(self, client, test_csv_file):
        """Test retrieving the results of a completed calculation."""
        # Submit calculation
        with open(test_csv_file, 'rb') as fp:
            data = {
                'file': (fp, 'test_trades.csv'),
                'tax_year': '2024-2025'
            }
            response = client.post('/api/calculate', data=data)
            task_id = response.json['task_id']
        
        # Wait for calculation to complete (with timeout)
        max_wait = 10  # seconds
        start_time = time.time()
        while time.time() - start_time < max_wait:
            status_response = client.get(f'/api/task/{task_id}/status')
            if status_response.json['status'] == 'completed':
                break
            time.sleep(0.5)
        
        # Get results
        results_response = client.get(f'/api/task/{task_id}/results')
        assert results_response.status_code == 200
        results = results_response.json
        
        # Verify results structure
        assert 'tax_year' in results
        assert 'total_gain' in results
        assert 'total_proceeds' in results
        assert 'disposals' in results
        
        # Verify calculation results
        assert results['tax_year'] == '2024-2025'
        assert float(results['total_gain']) > 0  # Should have a gain from AAPL trade
