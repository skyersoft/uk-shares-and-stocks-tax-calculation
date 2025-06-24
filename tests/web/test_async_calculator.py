"""Integration tests for asynchronous calculation service."""
import os
import shutil
import time
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock
from web_app.services.calculation_service import CalculationService
from web_app.services.storage_service import StorageService
from src.main.python.calculator import CapitalGainsTaxCalculator

TEST_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'test_uploads')
TEST_DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'fixtures', 'csv_samples', 'basic_transactions.csv')

@pytest.fixture
def storage_service():
    """Create a StorageService instance for testing."""
    service = StorageService(base_path=TEST_UPLOAD_FOLDER)
    yield service
    # Cleanup after tests
    if os.path.exists(TEST_UPLOAD_FOLDER):
        shutil.rmtree(TEST_UPLOAD_FOLDER)

@pytest.fixture
def calculator():
    """Create a CapitalGainsTaxCalculator instance for testing."""
    return Mock(spec=CapitalGainsTaxCalculator)

@pytest.fixture
def calculation_service(storage_service, calculator):
    """Create a CalculationService instance for testing."""
    return CalculationService(
        storage_service=storage_service,
        calculator=calculator
    )

def test_async_calculation_starts_successfully(calculation_service, storage_service):
    """Test that async calculation task starts successfully."""
    # Arrange
    with open(TEST_DATA_FILE, 'rb') as f:
        file_id = storage_service.save_file(f, 'test.csv')
    
    # Act
    task_id = calculation_service.start_calculation(
        file_id=file_id,
        tax_year='2024-2025',
        file_type='csv'
    )
    
    # Assert
    assert task_id is not None
    status = calculation_service.get_calculation_status(task_id)
    assert status in ['pending', 'in_progress']

def test_async_calculation_completes_successfully(calculation_service, storage_service, calculator):
    """Test that async calculation task completes successfully."""
    # Arrange
    calculator.calculate.return_value = {
        'tax_year': '2024-2025',
        'total_gains': 1000.0,
        'total_losses': 500.0,
        'net_gain': 500.0,
        'annual_exemption_used': 500.0,
        'taxable_gain': 0.0
    }
    
    with open(TEST_DATA_FILE, 'rb') as f:
        file_id = storage_service.save_file(f, 'test.csv')
    
    # Act
    task_id = calculation_service.start_calculation(
        file_id=file_id,
        tax_year='2024-2025',
        file_type='csv'
    )
    
    # Wait for calculation to complete
    import time
    max_wait = 5  # seconds
    start_time = time.time()
    while time.time() - start_time < max_wait:
        status = calculation_service.get_calculation_status(task_id)
        if status == 'completed':
            break
        time.sleep(0.1)
    
    # Assert
    result = calculation_service.get_calculation_result(task_id)
    assert result is not None
    assert result['tax_year'] == '2024-2025'
    assert result['total_gains'] == 1000.0
    assert calculator.calculate.called

def test_async_calculation_handles_errors(calculation_service, storage_service, calculator):
    """Test that async calculation task handles errors gracefully."""
    # Arrange
    calculator.calculate.side_effect = ValueError("Test error")
    
    with open(TEST_DATA_FILE, 'rb') as f:
        file_id = storage_service.save_file(f, 'test.csv')
    
    # Act
    task_id = calculation_service.start_calculation(
        file_id=file_id,
        tax_year='2024-2025',
        file_type='csv'
    )
    
    # Wait for calculation to complete
    import time
    max_wait = 5  # seconds
    start_time = time.time()
    while time.time() - start_time < max_wait:
        status = calculation_service.get_calculation_status(task_id)
        if status == 'failed':
            break
        time.sleep(0.1)
    
    # Assert
    assert calculation_service.get_calculation_status(task_id) == 'failed'
    error = calculation_service.get_calculation_error(task_id)
    assert error == "Test error"


def test_cleanup_old_tasks(calculation_service, storage_service, calculator):
    """Test cleaning up old completed tasks."""
    # Arrange: Create a task and make it complete
    with open(TEST_DATA_FILE, 'rb') as f:
        file_id = storage_service.save_file(f, 'test.csv')
    
    task_id = calculation_service.start_calculation(
        file_id=file_id,
        tax_year='2024-2025',
        file_type='csv'
    )
    
    # Wait for task to complete
    import time
    max_wait = 5  # seconds
    start_time = time.time()
    while time.time() - start_time < max_wait:
        status = calculation_service.get_calculation_status(task_id)
        if status == 'completed':
            break
        time.sleep(0.1)
    
    # Artificially age the task
    task = calculation_service.tasks[task_id]
    task.end_time = datetime.now() - timedelta(hours=25)
    
    # Act
    calculation_service.cleanup_old_tasks(max_age_hours=24)
    
    # Assert
    assert task_id not in calculation_service.tasks


def test_storage_service_cleanup(storage_service):
    """Test storage service cleanup of old files."""
    # Arrange: Create test files
    test_files = []
    for i in range(3):
        with open(TEST_DATA_FILE, 'rb') as f:
            file_id = storage_service.save_file(f, f'test{i}.csv')
            test_files.append(file_id)
    
    # Age some files by modifying their timestamps
    old_time = time.time() - (25 * 3600)  # 25 hours ago
    for file_id in test_files[:2]:
        file_path = storage_service.get_file_path(file_id)
        os.utime(file_path, (old_time, old_time))
    
    # Act
    storage_service.cleanup_old_files()
    
    # Assert
    remaining_files = os.listdir(storage_service.base_path)
    assert len(remaining_files) == 1
    assert any(test_files[2] in f for f in remaining_files)  # Only newest file remains
