import os
import pytest
import requests

# API URL - can be overridden by env var
API_URL = os.environ.get("API_URL", "https://d1tr8kb7oh.execute-api.us-east-1.amazonaws.com/prod")

class TestMultiBrokerAPI:
    
    def _get_sample_file(self, broker, filename="sample.csv"):
        path = os.path.join(os.path.dirname(__file__), "..", "data", broker, filename)
        return path

    def test_detect_ibkr(self):
        file_path = self._get_sample_file("ibkr", "flex_query.csv")
        # If flex_query.csv doesn't exist, try another one or skip
        if not os.path.exists(file_path):
            pytest.skip(f"Sample file not found: {file_path}")
            
        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{API_URL}/detect-broker", files=files)
            
        assert response.status_code == 200
        data = response.json()
        assert data["detected"] is True
        assert data["broker"] == "Interactive Brokers"
        assert data["confidence"] > 0.8

    def test_detect_trading212(self):
        file_path = self._get_sample_file("trading212", "export.csv")
        if not os.path.exists(file_path):
            pytest.skip(f"Sample file not found: {file_path}")

        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{API_URL}/detect-broker", files=files)
            
        assert response.status_code == 200
        data = response.json()
        assert data["detected"] is True
        assert data["broker"] == "Trading 212"
        assert data["confidence"] > 0.8

    def test_detect_hargreaves_lansdown(self):
        file_path = self._get_sample_file("hargreaves_lansdown", "sample.csv")
        if not os.path.exists(file_path):
            pytest.skip(f"Sample file not found: {file_path}")

        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{API_URL}/detect-broker", files=files)
            
        assert response.status_code == 200
        data = response.json()
        assert data["detected"] is True
        assert data["broker"] == "Hargreaves Lansdown"
        assert data["confidence"] > 0.8

    def test_detect_freetrade(self):
        file_path = self._get_sample_file("freetrade", "sample.csv")
        if not os.path.exists(file_path):
            pytest.skip(f"Sample file not found: {file_path}")

        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{API_URL}/detect-broker", files=files)
            
        # Note: Freetrade support is not deployed yet, so this might fail or return "detected": false
        # But we want to verify it works once deployed.
        # For now, we can assert response structure.
        assert response.status_code == 200
        data = response.json()
        assert data["detected"] is True
        assert data["broker"] == "Freetrade"

    def test_detect_fidelity(self):
        file_path = self._get_sample_file("fidelity", "sample.csv")
        if not os.path.exists(file_path):
            pytest.skip(f"Sample file not found: {file_path}")

        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{API_URL}/detect-broker", files=files)
            
        assert response.status_code == 200
        data = response.json()
        assert data["detected"] is True
        assert data["broker"] == "Fidelity"
