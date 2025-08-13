"""
End-to-end tests for additional inputs functionality.
"""
import os
import pytest
from playwright.sync_api import Page, expect


class TestAdditionalInputsFunctionality:
    """Test additional income and expenses input functionality."""
    
    BASE_URL = "https://cgttaxtool.uk"
    
    def test_additional_inputs_section_appears(self, page: Page):
        """Test that additional inputs section appears after calculation."""
        page.goto(self.BASE_URL)
        
        # Upload a test file
        file_path = os.path.join(os.getcwd(), "data", "U14657426_20240408_20250404.qfx")
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        # Upload file
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        # Submit calculation
        page.locator("#calculateBtn").click()
        page.wait_for_timeout(15000)  # Wait for results
        
        # Check that additional inputs section is present
        expect(page.locator("text=Additional Income & Expenses")).to_be_visible()
        
        # Check for specific input fields
        expect(page.locator("#otherCapitalGains")).to_be_visible()
        expect(page.locator("#otherDividends")).to_be_visible()
        expect(page.locator("#additionalTradingCosts")).to_be_visible()
        expect(page.locator("#professionalFees")).to_be_visible()
        expect(page.locator("#recalculateBtn")).to_be_visible()
    
    def test_additional_inputs_calculation(self, page: Page):
        """Test that additional inputs calculation works."""
        page.goto(self.BASE_URL)
        
        # Upload a test file
        file_path = os.path.join(os.getcwd(), "data", "U14657426_20240408_20250404.qfx")
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        # Upload file and calculate
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        page.locator("#calculateBtn").click()
        page.wait_for_timeout(15000)
        
        # Fill in additional inputs
        page.locator("#otherCapitalGains").fill("5000")
        page.locator("#otherDividends").fill("1000")
        page.locator("#additionalTradingCosts").fill("500")
        page.locator("#professionalFees").fill("200")
        
        # Click recalculate
        page.locator("#recalculateBtn").click()
        page.wait_for_timeout(2000)
        
        # Check that updated tax summary appears
        expect(page.locator("#updatedTaxSummary")).to_be_visible()
        expect(page.locator("#updatedTaxSummary h4:has-text('Updated Tax Calculation')")).to_be_visible()

        # Check that the calculation includes the additional amounts
        updated_content = page.locator("#updatedTaxContent").inner_text()
        assert "£1000.00" in updated_content or "£1,000.00" in updated_content  # Dividend income
        assert "£700.00" in updated_content  # Total allowable costs (500 + 200)
        assert "Total Tax Due:" in updated_content  # Tax calculation present
    
    def test_help_page_navigation(self, page: Page):
        """Test navigation to help page."""
        page.goto(self.BASE_URL)
        
        # Click help link in navigation
        page.locator("nav a[href='/help']").click()
        
        # Check we're on the help page
        expect(page).to_have_url(f"{self.BASE_URL}/help")
        expect(page.locator("h1")).to_contain_text("How to Export Data from Interactive Brokers")
        
        # Check for key sections
        expect(page.locator("h4:has-text('QFX Format (Recommended)')")).to_be_visible()
        expect(page.locator("h4:has-text('CSV Format')")).to_be_visible()
        expect(page.locator("h2:has-text('Method 1: Export QFX File')")).to_be_visible()
        expect(page.locator("h2:has-text('Method 2: Export CSV File')")).to_be_visible()
    
    def test_cgt_guide_page_navigation(self, page: Page):
        """Test navigation to CGT guide page."""
        page.goto(self.BASE_URL)
        
        # Click CGT guide link in navigation
        page.locator("nav a[href='/cgt-guide']").click()
        
        # Check we're on the CGT guide page
        expect(page).to_have_url(f"{self.BASE_URL}/cgt-guide")
        expect(page.locator("h1")).to_contain_text("UK Capital Gains Tax Guide")
        
        # Check for key sections
        expect(page.locator("h2:has-text('What is Capital Gains Tax?')")).to_be_visible()
        expect(page.locator("h2:has-text('Annual CGT Allowance')")).to_be_visible()
        expect(page.locator("h3:has-text('Section 104 Holding')")).to_be_visible()
        expect(page.locator("text=Important Limitations")).to_be_visible()
    
    def test_navigation_links_updated(self, page: Page):
        """Test that navigation includes new links."""
        page.goto(self.BASE_URL)
        
        # Check that new navigation links are present
        expect(page.locator("nav a[href='/help']")).to_be_visible()
        expect(page.locator("nav a[href='/cgt-guide']")).to_be_visible()
        
        # Check link text
        expect(page.locator("nav a[href='/help']")).to_contain_text("Help")
        expect(page.locator("nav a[href='/cgt-guide']")).to_contain_text("CGT Guide")
