"""
Debug test for additional inputs functionality.
"""
import os
import pytest
from playwright.sync_api import Page, expect


class TestDebugAdditionalInputs:
    """Debug additional inputs functionality."""
    
    BASE_URL = "https://cgttaxtool.uk"
    
    def test_debug_additional_inputs_javascript(self, page: Page):
        """Debug the JavaScript functionality for additional inputs."""
        # Capture console logs and errors
        console_logs = []
        errors = []
        
        page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: errors.append(str(error)))
        
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
        
        print("Console logs after calculation:")
        for log in console_logs:
            print(f"  {log}")
        
        print("Errors:")
        for error in errors:
            print(f"  {error}")
        
        # Check if the additional inputs section is present
        additional_inputs_visible = page.locator("#additionalInputsForm").is_visible()
        print(f"Additional inputs form visible: {additional_inputs_visible}")
        
        # Check if recalculate button exists
        recalc_button_exists = page.locator("#recalculateBtn").count() > 0
        print(f"Recalculate button exists: {recalc_button_exists}")
        
        if recalc_button_exists:
            # Fill in some test values
            page.locator("#otherCapitalGains").fill("1000")
            page.locator("#otherDividends").fill("500")
            
            print("Filled in test values")
            
            # Check if the updated tax summary div exists
            updated_summary_exists = page.locator("#updatedTaxSummary").count() > 0
            print(f"Updated tax summary div exists: {updated_summary_exists}")
            
            # Try to click the recalculate button
            print("Clicking recalculate button...")
            page.locator("#recalculateBtn").click()
            page.wait_for_timeout(3000)
            
            print("Console logs after recalculate click:")
            for log in console_logs[-10:]:  # Last 10 logs
                print(f"  {log}")
            
            print("Errors after recalculate:")
            for error in errors:
                print(f"  {error}")
            
            # Check if updated summary is now visible
            updated_summary_visible = page.locator("#updatedTaxSummary").is_visible()
            print(f"Updated tax summary visible after click: {updated_summary_visible}")
            
            # Check the style attribute
            style_attr = page.locator("#updatedTaxSummary").get_attribute("style")
            print(f"Updated tax summary style: {style_attr}")
            
            # Check if content was added
            content = page.locator("#updatedTaxContent").inner_text()
            print(f"Updated tax content: {content[:200]}...")
        
        # This test is for debugging, so we don't assert anything
        assert True
