"""Tests for the web API endpoints."""
import os
import pytest
import tempfile
from flask import url_for
from web_app.app import app, update_app_config_for_testing

# Use the existing mixed_transactions.csv fixture file
TEST_DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'fixtures', 'csv_samples', 'mixed_transactions.csv')

@pytest.fixture
def client():
    """Create a test client."""
    update_app_config_for_testing(app)
    with app.test_client() as client:
        yield client

def test_download_no_report(client):
    """Test download route when no report is available."""
    # Follow redirects to get the flash message
    response = client.get('/download', follow_redirects=True)
    assert b'No report available for download' in response.data

def test_download_success(client):
    """Test successful download of a report."""
    import tempfile
    
    # Create a temporary file for the download test instead of using the fixture
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
        temp_file.write('ClientAccountID,Symbol,Buy/Sell,Quantity,UnitPrice\n')
        temp_file.write('U12345,AAPL,BUY,100,150.00\n')
        temp_path = temp_file.name
    
    try:
        with client.session_transaction() as session:
            session['output_path'] = temp_path
            session['tax_year'] = '2024-2025'
            session['output_format'] = 'csv'
        
        response = client.get('/download')
        assert response.status_code == 200
        assert response.headers['Content-Type'].startswith('text/csv')
        assert 'attachment; filename=tax_report_2024-2025.csv' in response.headers['Content-Disposition']
    finally:
        # Clean up the temporary file
        import os
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def test_download_missing_file(client):
    """Test download when the file is missing."""
    with client.session_transaction() as session:
        session['output_path'] = '/nonexistent/path'
        session['tax_year'] = '2024-2025'
        session['output_format'] = 'csv'
    
    # Follow redirects to get the flash message
    response = client.get('/download', follow_redirects=True)
    assert b'Error downloading file' in response.data

def test_api_calculate_no_file(client):
    """Test API calculation endpoint with no file."""
    response = client.post('/api/calculate')
    assert response.status_code == 400
    assert response.json['error'] == 'No file uploaded'

def test_api_calculate_empty_filename(client):
    """Test API calculation endpoint with empty filename."""
    data = {'tax_year': '2024-2025', 'output_format': 'csv'}
    response = client.post(
        '/api/calculate',
        data=data,
        content_type='multipart/form-data'
    )
    assert response.status_code == 400
    assert response.json['error'] == 'No file uploaded'

def test_api_calculate_success(client):
    """Test successful API calculation."""
    from io import BytesIO
    import werkzeug
    
    # Use proper IBKR CSV format for testing
    test_data = b'ClientAccountID,Symbol,SecurityID,SecurityIDType,Buy/Sell,TradeDate,SettleDate,Quantity,UnitPrice,TotalAmount,Commission,Currency,CurrencyRate,AssetClass\nU12345,AAPL,US0378331005,ISIN,BUY,2024-01-15,2024-01-17,100,150.00,-15000.00,7.95,USD,0.787,STK\nU12345,AAPL,US0378331005,ISIN,SELL,2024-06-15,2024-06-17,50,180.00,9000.00,8.25,USD,0.780,STK\n'
    file = werkzeug.datastructures.FileStorage(
        stream=BytesIO(test_data),
        filename='test.csv',
        content_type='text/csv'
    )
    
    data = {
        'tax_year': '2024-2025',
        'output_format': 'csv',
        'file': file
    }
    response = client.post(
        '/async_calculate',
        data=data,
        content_type='multipart/form-data'
    )
    assert response.status_code == 200
    result = response.json
    assert result is not None

def test_api_calculate_invalid_file(client):
    """Test API calculation with invalid file."""
    from io import BytesIO
    invalid_file = BytesIO(b'invalid,csv,content')
    response = client.post('/api/calculate', data={
        'file': (invalid_file, 'invalid.csv'),
        'tax_year': '2024-2025',
        'output_format': 'csv'
    })
    # The API accepts the file and returns 202, but the task will fail during processing
    assert response.status_code == 202
    assert response.json['status'] == 'accepted'
