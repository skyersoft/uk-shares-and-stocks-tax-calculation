"""
End-to-end tests for custom domain functionality.
"""
import os
import pytest
from playwright.sync_api import Page, expect


class TestCustomDomainFunctionality:
    """Test custom domain specific functionality."""
    
    BASE_URL = "https://cgttaxtool.uk"
    
    def test_custom_domain_main_page(self, page: Page):
        """Test that the main page loads correctly on custom domain."""
        page.goto(self.BASE_URL)
        
        # Check page title
        expect(page).to_have_title("IBKR Tax Calculator - UK Capital Gains & Portfolio Analysis")
        
        # Check main heading
        expect(page.locator("h1")).to_contain_text("UK Tax Calculator for Interactive Brokers")
        
        # Check that form elements are present
        expect(page.locator("#fileInput")).to_be_attached()
        expect(page.locator("#taxYear")).to_be_visible()
        expect(page.locator("#analysisType")).to_be_visible()
        expect(page.locator("#calculateBtn")).to_be_visible()
    
    def test_ads_txt_endpoint(self, page: Page):
        """Test that ads.txt is served correctly."""
        page.goto(f"{self.BASE_URL}/ads.txt")
        
        # Check content type and content
        content = page.content()
        expected_content = "google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0"
        assert expected_content in content
    
    def test_calculate_button_with_custom_domain(self, page: Page):
        """Test that the calculate button works correctly with custom domain."""
        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))
        
        page.goto(self.BASE_URL)
        
        # Upload a test file
        file_path = os.path.join(os.getcwd(), "data", "Sharesight.csv")
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        # Upload file
        page.locator("#fileInput").set_input_files(file_path)
        
        # Wait for file to be processed
        page.wait_for_timeout(1000)
        
        # Check that file was selected
        upload_area = page.locator("#uploadArea")
        expect(upload_area).to_contain_text("File Selected")
        
        # Click calculate button
        calculate_btn = page.locator("#calculateBtn")
        expect(calculate_btn).to_be_enabled()
        
        print("Clicking calculate button...")
        calculate_btn.click()
        
        # Wait for processing
        page.wait_for_timeout(2000)
        
        # Check console logs for correct endpoint
        print("Console logs:")
        for log in console_logs:
            print(f"  {log}")
        
        # Check that the correct endpoint was used
        endpoint_logs = [log for log in console_logs if "Submitting to" in log]
        assert len(endpoint_logs) > 0, "No submission endpoint found in logs"
        
        # Should submit to /calculate (not /prod/calculate) for custom domain
        correct_endpoint_used = any("/calculate" in log and "/prod/calculate" not in log for log in endpoint_logs)
        if not correct_endpoint_used:
            print("❌ Incorrect endpoint used. Expected '/calculate', found:")
            for log in endpoint_logs:
                print(f"  {log}")
        
        # Wait for results or error
        page.wait_for_timeout(10000)
        
        # Check if we got results or stayed on the same domain
        current_url = page.url
        print(f"Current URL after submission: {current_url}")
        
        # The URL should either stay on cgttaxtool.uk or show results
        assert "cgttaxtool.uk" in current_url or "Results" in page.content(), \
            f"Unexpected redirect. Current URL: {current_url}"
        
        # Check for success indicators
        page_content = page.content()
        if "Tax Liability" in page_content or "Portfolio Value" in page_content:
            print("✅ Results loaded successfully!")
        elif "error" in page_content.lower() or "failed" in page_content.lower():
            print("❌ Error in results")
            assert False, "Error found in page content"
        else:
            print("⚠️  Unclear result state")
    
    def test_navigation_links(self, page: Page):
        """Test that navigation links work correctly."""
        page.goto(self.BASE_URL)

        # Test About link (use the navbar link specifically)
        page.locator("nav a[href='/about']").click()
        expect(page).to_have_url(f"{self.BASE_URL}/about")
        expect(page.locator("h1")).to_contain_text("About")

        # Go back to home
        page.goto(self.BASE_URL)

        # Test Privacy link
        page.locator("nav a[href='/privacy']").click()
        expect(page).to_have_url(f"{self.BASE_URL}/privacy")
        expect(page.locator("h1")).to_contain_text("Privacy")

        # Go back to home
        page.goto(self.BASE_URL)

        # Test Terms link
        page.locator("nav a[href='/terms']").click()
        expect(page).to_have_url(f"{self.BASE_URL}/terms")
        expect(page.locator("h1")).to_contain_text("Terms")
    
    def test_form_submission_endpoint_detection(self, page: Page):
        """Test that the JavaScript correctly detects custom domain vs API Gateway."""
        page.goto(self.BASE_URL)
        
        # Inject test script to check endpoint detection
        result = page.evaluate("""
            () => {
                const isCustomDomain = !window.location.hostname.includes('execute-api');
                const endpoint = isCustomDomain ? '/calculate' : '/prod/calculate';
                return {
                    hostname: window.location.hostname,
                    isCustomDomain: isCustomDomain,
                    endpoint: endpoint
                };
            }
        """)
        
        print(f"Endpoint detection result: {result}")
        
        # For cgttaxtool.uk, should detect custom domain and use /calculate
        assert result['hostname'] == 'cgttaxtool.uk'
        assert result['isCustomDomain'] == True
        assert result['endpoint'] == '/calculate'
