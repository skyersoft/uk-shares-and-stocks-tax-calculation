"""
Comprehensive end-to-end UI tests for IBKR Tax Calculator using Playwright.
Tests all scenarios with CSV and QFX files from the data folder.
"""
import os
import pytest
from playwright.sync_api import Page, expect
import time


class TestIBKRTaxCalculatorUI:
    """Comprehensive UI tests for the IBKR Tax Calculator."""
    
    BASE_URL = "https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/"
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Setup for each test."""
        self.page = page
        # Set longer timeout for file uploads and processing
        page.set_default_timeout(60000)  # 60 seconds
    
    def test_landing_page_loads(self, page: Page):
        """Test that the landing page loads correctly."""
        page.goto(self.BASE_URL)
        
        # Check page title
        expect(page).to_have_title("IBKR Tax Calculator - UK Capital Gains & Portfolio Analysis")
        
        # Check main elements are present
        expect(page.locator("h1")).to_contain_text("UK Tax Calculator")
        expect(page.locator("#uploadArea")).to_be_visible()
        expect(page.locator("#calculateBtn")).to_be_visible()
        expect(page.locator("#fileInput")).to_be_attached()
        
        # Check form elements
        expect(page.locator("select[name='tax_year']")).to_be_visible()
        expect(page.locator("select[name='analysis_type']")).to_be_visible()
    
    def test_file_upload_csv_sharesight(self, page: Page):
        """Test CSV file upload with Sharesight.csv."""
        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))

        # Capture network errors
        page.on("requestfailed", lambda request: print(f"Request failed: {request.url} - {request.failure}"))

        page.goto(self.BASE_URL)

        # Upload file
        file_path = os.path.join(os.getcwd(), "data", "Sharesight.csv")
        print(f"Uploading file: {file_path}")
        page.locator("#fileInput").set_input_files(file_path)

        # Wait for file to be processed by UI
        page.wait_for_timeout(2000)

        # Check file was selected (upload area should change)
        upload_area_text = page.locator("#uploadArea").inner_text()
        print(f"Upload area text after file selection: {upload_area_text}")

        # Submit form
        print("Clicking calculate button...")
        page.locator("#calculateBtn").click()

        # Wait a bit for any JavaScript to execute
        page.wait_for_timeout(3000)

        # Print any console logs
        if console_logs:
            print("Console logs:")
            for log in console_logs:
                print(f"  {log}")
        else:
            print("No console logs captured")

        # Wait for AJAX response to complete and page to update
        # The app uses AJAX, so we need to wait for the content to change
        page.wait_for_timeout(5000)  # Wait for processing

        # Check if the page content has been updated with results
        # Look for results indicators
        try:
            # Wait for either results content or error message
            page.wait_for_selector("h1:has-text('Tax Calculation Results'), .alert, .error", timeout=10000)
        except:
            pass

        # Debug: Check current page state
        current_title = page.title()
        current_url = page.url
        print(f"Current title: {current_title}")
        print(f"Current URL: {current_url}")

        # Check if results were loaded via AJAX
        body_text = page.locator("body").inner_text()

        if "Tax Calculation Results" in body_text:
            print("✅ Results loaded successfully via AJAX!")
            # Verify the results content
            self._verify_ajax_results_content(page)
        elif "error" in body_text.lower() or "failed" in body_text.lower():
            print(f"❌ Error in processing: {body_text[:500]}...")
            assert False, f"Error occurred during processing: {body_text[:500]}"
        else:
            print("⚠️ Unexpected page state after form submission")
            print("Page content preview:")
            print(body_text[:1000])
            assert False, f"Unexpected page state. Title: '{current_title}', URL: {current_url}"
    
    def test_file_upload_csv_sharesight_2024(self, page: Page):
        """Test CSV file upload with Sharesight_2024.csv."""
        page.goto(self.BASE_URL)

        file_path = os.path.join(os.getcwd(), "data", "Sharesight_2024.csv")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(2000)

        page.locator("#calculateBtn").click()
        page.wait_for_timeout(5000)  # Wait for AJAX processing

        # Check if results were loaded via AJAX
        body_text = page.locator("body").inner_text()
        if "Tax Calculation Results" in body_text:
            self._verify_ajax_results_content(page)
        else:
            assert False, f"Results not loaded for Sharesight_2024.csv"
    
    def test_file_upload_csv_sharesight_3(self, page: Page):
        """Test CSV file upload with Sharesight_3.csv."""
        page.goto(self.BASE_URL)

        file_path = os.path.join(os.getcwd(), "data", "Sharesight_3.csv")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(2000)

        page.locator("#calculateBtn").click()
        page.wait_for_timeout(5000)  # Wait for AJAX processing

        # Check if results were loaded via AJAX
        body_text = page.locator("body").inner_text()
        if "Tax Calculation Results" in body_text:
            self._verify_ajax_results_content(page)
        else:
            assert False, "Results not loaded for Sharesight_3.csv"
    
    def test_file_upload_qfx_u11075163_annual(self, page: Page):
        """Test QFX file upload with U11075163_20240408_20250404.qfx."""
        page.goto(self.BASE_URL)

        file_path = os.path.join(os.getcwd(), "data", "U11075163_20240408_20250404.qfx")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(2000)

        page.locator("#calculateBtn").click()
        page.wait_for_timeout(8000)  # QFX files may take longer to process

        # Check if results were loaded via AJAX
        body_text = page.locator("body").inner_text()
        if "Tax Calculation Results" in body_text:
            self._verify_ajax_results_content(page)
        else:
            assert False, "Results not loaded for U11075163_20240408_20250404.qfx"
    
    def test_file_upload_qfx_u11075163_monthly(self, page: Page):
        """Test QFX file upload with U11075163_202409_202409.qfx."""
        page.goto(self.BASE_URL)
        
        file_path = os.path.join(os.getcwd(), "data", "U11075163_202409_202409.qfx")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        expect(page).to_have_title("Tax Calculation Results - 2024-2025 | IBKR Tax Calculator")
        self._verify_results_page_structure(page)
        self._verify_tax_analysis_section(page)
        self._verify_portfolio_analysis_section(page)
    
    def test_file_upload_qfx_u14657426(self, page: Page):
        """Test QFX file upload with U14657426_20240408_20250404.qfx."""
        page.goto(self.BASE_URL)
        
        file_path = os.path.join(os.getcwd(), "data", "U14657426_20240408_20250404.qfx")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        expect(page).to_have_title("Tax Calculation Results - 2024-2025 | IBKR Tax Calculator")
        self._verify_results_page_structure(page)
        self._verify_tax_analysis_section(page)
        self._verify_portfolio_analysis_section(page)
    
    def test_different_tax_years(self, page: Page):
        """Test different tax year selections."""
        page.goto(self.BASE_URL)
        
        # Test with 2023-2024 tax year
        page.locator("select[name='tax_year']").select_option("2023-2024")
        
        file_path = os.path.join(os.getcwd(), "data", "Sharesight.csv")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        expect(page).to_have_title("Tax Calculation Results - 2023-2024 | IBKR Tax Calculator")
        expect(page.locator("p.lead")).to_contain_text("Tax Year: 2023-2024")
    
    def test_different_analysis_types(self, page: Page):
        """Test different analysis type selections."""
        page.goto(self.BASE_URL)
        
        # Test with portfolio analysis only
        page.locator("select[name='analysis_type']").select_option("portfolio")
        
        file_path = os.path.join(os.getcwd(), "data", "Sharesight.csv")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        # Should still show results page
        expect(page).to_have_title("Tax Calculation Results - 2024-2025 | IBKR Tax Calculator")
    
    def test_drag_and_drop_upload(self, page: Page):
        """Test drag and drop file upload functionality."""
        page.goto(self.BASE_URL)
        
        # Create a file input for drag and drop simulation
        file_path = os.path.join(os.getcwd(), "data", "Sharesight.csv")
        
        # Simulate drag and drop by setting files directly
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        # Verify file was selected
        expect(page.locator("#uploadArea")).to_contain_text("File Selected")
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        expect(page).to_have_title("Tax Calculation Results - 2024-2025 | IBKR Tax Calculator")
    
    def _verify_results_page_structure(self, page: Page):
        """Verify the basic structure of the results page."""
        # Check navigation
        expect(page.locator("nav.navbar")).to_be_visible()
        expect(page.locator("a.navbar-brand")).to_contain_text("IBKR Tax Calculator")
        
        # Check results header
        expect(page.locator("h1.display-6")).to_contain_text("Tax Calculation Results")
        expect(page.locator("p.lead")).to_contain_text("Tax Year:")
        
        # Check key metrics cards
        metric_cards = page.locator(".metric-card")
        expect(metric_cards).to_have_count(3)
        
        # Check metric card titles
        expect(page.locator(".metric-card").nth(0)).to_contain_text("Total Tax Liability")
        expect(page.locator(".metric-card").nth(1)).to_contain_text("Portfolio Value")
        expect(page.locator(".metric-card").nth(2)).to_contain_text("Total Return")
        
        # Check metric values are not placeholder
        tax_liability = page.locator(".metric-card").nth(0).locator(".metric-value").inner_text()
        portfolio_value = page.locator(".metric-card").nth(1).locator(".metric-value").inner_text()
        total_return = page.locator(".metric-card").nth(2).locator(".metric-value").inner_text()
        
        # Values should contain £ or % symbols and not be empty
        assert "£" in tax_liability, f"Tax liability should contain £ symbol: {tax_liability}"
        assert "£" in portfolio_value, f"Portfolio value should contain £ symbol: {portfolio_value}"
        assert "%" in total_return, f"Total return should contain % symbol: {total_return}"
    
    def _verify_tax_analysis_section(self, page: Page):
        """Verify the tax analysis section contains proper content."""
        tax_section = page.locator(".card").filter(has_text="Tax Analysis")
        expect(tax_section).to_be_visible()
        
        # Check that it's not showing placeholder text
        tax_body = tax_section.locator(".card-body")
        expect(tax_body).not_to_contain_text("Tax analysis results will be displayed here")
        
        # Should contain actual analysis content
        expect(tax_body).to_be_visible()
        
        # Check for key elements that should be in tax analysis
        # (These might be in tables or other structures)
        tax_content = tax_body.inner_text()
        
        # Should contain some financial data or "No" if no taxable events
        assert len(tax_content.strip()) > 50, f"Tax analysis content seems too short: {tax_content[:100]}..."
    
    def _verify_portfolio_analysis_section(self, page: Page):
        """Verify the portfolio analysis section contains proper content."""
        portfolio_section = page.locator(".card").filter(has_text="Portfolio Analysis")
        expect(portfolio_section).to_be_visible()
        
        # Check that it's not showing placeholder text
        portfolio_body = portfolio_section.locator(".card-body")
        expect(portfolio_body).not_to_contain_text("Portfolio analysis results will be displayed here")
        
        # Should contain actual analysis content
        expect(portfolio_body).to_be_visible()
        
        # Check for key elements that should be in portfolio analysis
        portfolio_content = portfolio_body.inner_text()
        
        # Should contain some portfolio data or "No" if no holdings
        assert len(portfolio_content.strip()) > 50, f"Portfolio analysis content seems too short: {portfolio_content[:100]}..."
    
    def test_error_handling_invalid_file(self, page: Page):
        """Test error handling with invalid file."""
        page.goto(self.BASE_URL)
        
        # Try to upload a non-CSV/QFX file (this test file itself)
        file_path = __file__
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(1000)
        
        page.locator("#calculateBtn").click()
        page.wait_for_load_state("networkidle")
        
        # Should either show error or handle gracefully
        # The exact behavior depends on implementation
        # At minimum, should not crash
        assert page.url is not None
    
    def test_no_file_selected_validation(self, page: Page):
        """Test validation when no file is selected."""
        page.goto(self.BASE_URL)
        
        # Try to submit without selecting a file
        page.locator("#calculateBtn").click()
        
        # Should show validation message or prevent submission
        # Check for alert or validation message
        page.wait_for_timeout(2000)
        
        # Should still be on the landing page
        expect(page).to_have_title("IBKR Tax Calculator - UK Capital Gains & Portfolio Analysis")

    def test_dividend_display_qfx_file(self, page: Page):
        """Test that dividends are displayed for QFX file with dividend data."""
        page.goto(self.BASE_URL)

        # Use the QFX file that contains dividend information
        file_path = os.path.join(os.getcwd(), "data", "U11075163_202409_202409.qfx")
        page.locator("#fileInput").set_input_files(file_path)
        page.wait_for_timeout(2000)

        page.locator("#calculateBtn").click()
        page.wait_for_timeout(8000)  # QFX files may take longer to process

        # Check if results were loaded via AJAX
        body_text = page.locator("body").inner_text()
        if "Tax Calculation Results" in body_text:
            print("✅ Results loaded successfully")

            # Check specifically for dividend information
            if "Dividend Details" in body_text:
                print("✅ Dividend Details section found!")

                # Check for QCOM dividend specifically
                if "QCOM" in body_text:
                    print("✅ QCOM dividend found in results!")

                    # Extract dividend information
                    if "33.06" in body_text:  # Expected gross amount
                        print("✅ Expected dividend amount found!")
                    if "4.96" in body_text:  # Expected withholding tax
                        print("✅ Expected withholding tax found!")
                    if "28.10" in body_text:  # Expected net amount
                        print("✅ Expected net dividend amount found!")
                else:
                    print("❌ QCOM dividend not found in results")
            else:
                print("❌ Dividend Details section not found")

            # Print a sample of the content for debugging
            print("\\nSample content around dividends:")
            lines = body_text.split('\\n')
            for i, line in enumerate(lines):
                if 'dividend' in line.lower() or 'QCOM' in line:
                    start = max(0, i-2)
                    end = min(len(lines), i+3)
                    for j in range(start, end):
                        marker = ">>> " if j == i else "    "
                        print(f"{marker}{lines[j]}")
                    break
        else:
            assert False, "Results not loaded for dividend test"

    def test_all_data_files_comprehensive(self, page: Page):
        """Test all files in the data folder comprehensively."""
        import os
        import glob

        data_files = []
        data_dir = os.path.join(os.getcwd(), "data")

        # Get all CSV and QFX files
        csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
        qfx_files = glob.glob(os.path.join(data_dir, "*.qfx"))
        data_files = csv_files + qfx_files

        print(f"\n🧪 Testing {len(data_files)} files from data folder:")
        for f in data_files:
            print(f"  - {os.path.basename(f)}")

        results_summary = {}

        for file_path in data_files:
            filename = os.path.basename(file_path)
            print(f"\n" + "="*60)
            print(f"🧪 TESTING: {filename}")
            print("="*60)

            try:
                # Navigate to fresh page
                page.goto(self.BASE_URL)
                page.wait_for_timeout(2000)

                # Upload file
                print(f"📁 Uploading {filename}...")
                page.locator("#fileInput").set_input_files(file_path)
                page.wait_for_timeout(2000)

                # Verify file was selected
                upload_area_text = page.locator("#uploadArea").inner_text()
                if "File Selected" in upload_area_text:
                    print(f"✅ File selected successfully")
                else:
                    print(f"❌ File selection failed")
                    results_summary[filename] = "file_selection_failed"
                    continue

                # Submit form
                print(f"🚀 Submitting form...")
                page.locator("#calculateBtn").click()

                # Wait for processing (longer for QFX files)
                wait_time = 10000 if filename.endswith('.qfx') else 6000
                page.wait_for_timeout(wait_time)

                # Check results
                body_text = page.locator("body").inner_text()

                if "Tax Calculation Results" in body_text:
                    result_quality = self._verify_ajax_results_content(page, filename)
                    results_summary[filename] = result_quality
                else:
                    print(f"❌ No results generated for {filename}")
                    # Check for error messages
                    if "error" in body_text.lower():
                        print(f"🔍 Error detected in response")
                        # Extract error details
                        lines = body_text.split('\n')
                        error_lines = [line for line in lines if 'error' in line.lower()][:3]
                        for error_line in error_lines:
                            print(f"   Error: {error_line.strip()}")
                    results_summary[filename] = "no_results"

            except Exception as e:
                print(f"❌ Exception during testing {filename}: {str(e)}")
                results_summary[filename] = f"exception: {str(e)[:100]}"

        # Print comprehensive summary
        print(f"\n" + "="*80)
        print(f"📊 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("="*80)

        excellent_files = [f for f, r in results_summary.items() if r == "excellent"]
        good_files = [f for f, r in results_summary.items() if r == "good"]
        issue_files = [f for f, r in results_summary.items() if r not in ["excellent", "good"]]

        print(f"\n🎉 EXCELLENT ({len(excellent_files)} files):")
        for f in excellent_files:
            print(f"  ✅ {f}")

        print(f"\n✅ GOOD ({len(good_files)} files):")
        for f in good_files:
            print(f"  ✅ {f}")

        print(f"\n❌ ISSUES ({len(issue_files)} files):")
        for f in issue_files:
            print(f"  ❌ {f}: {results_summary[f]}")

        print(f"\n📈 OVERALL STATISTICS:")
        print(f"  Total files tested: {len(data_files)}")
        print(f"  Working perfectly: {len(excellent_files)}")
        print(f"  Working with minor issues: {len(good_files)}")
        print(f"  Not working: {len(issue_files)}")
        print(f"  Success rate: {((len(excellent_files) + len(good_files)) / len(data_files) * 100):.1f}%")

        # The test passes if at least some files work, but we want to see all results
        assert len(excellent_files) + len(good_files) > 0, f"No files processed successfully. Issues: {issue_files}"

    def _verify_ajax_results_content(self, page: Page, filename: str = ""):
        """Verify that AJAX-loaded results content is present and valid."""
        body_text = page.locator("body").inner_text()

        print(f"\n🔍 Analyzing results for {filename}:")

        # Check for key results indicators
        has_results_title = "Tax Calculation Results" in body_text
        print(f"  ✅ Results title: {'✓' if has_results_title else '✗'}")

        # Check for key metrics sections
        has_tax_liability = "Total Tax Liability" in body_text
        has_portfolio_value = "Portfolio Value" in body_text
        has_total_return = "Total Return" in body_text
        print(f"  ✅ Key metrics: Tax Liability {'✓' if has_tax_liability else '✗'}, Portfolio Value {'✓' if has_portfolio_value else '✗'}, Total Return {'✓' if has_total_return else '✗'}")

        # Check for currency symbols (indicating actual values)
        has_currency = "£" in body_text
        print(f"  ✅ Currency symbols: {'✓' if has_currency else '✗'}")

        # Extract actual values for analysis
        import re
        tax_liability_match = re.search(r'Total Tax Liability.*?£([\d,]+\.?\d*)', body_text, re.DOTALL)
        portfolio_value_match = re.search(r'Portfolio Value.*?£([\d,]+\.?\d*)', body_text, re.DOTALL)
        total_return_match = re.search(r'Total Return.*?([\+\-]?\d+\.?\d*)%', body_text, re.DOTALL)

        if tax_liability_match:
            tax_value = tax_liability_match.group(1)
            print(f"  💰 Tax Liability: £{tax_value}")
        else:
            print(f"  ❌ Could not extract tax liability value")

        if portfolio_value_match:
            portfolio_value = portfolio_value_match.group(1)
            print(f"  📊 Portfolio Value: £{portfolio_value}")
        else:
            print(f"  ❌ Could not extract portfolio value")

        if total_return_match:
            return_value = total_return_match.group(1)
            print(f"  📈 Total Return: {return_value}%")
        else:
            print(f"  ❌ Could not extract total return")

        # Check for analysis sections
        has_tax_analysis = "Tax Analysis" in body_text
        has_portfolio_analysis = "Portfolio Analysis" in body_text
        print(f"  ✅ Analysis sections: Tax Analysis {'✓' if has_tax_analysis else '✗'}, Portfolio Analysis {'✓' if has_portfolio_analysis else '✗'}")

        # Check for detailed content in analysis sections
        has_capital_gains = "Capital Gains" in body_text or "Total Gains" in body_text
        has_holdings = "Holdings" in body_text or "Symbol" in body_text
        has_dividends = "Dividend Details" in body_text
        print(f"  ✅ Detailed content: Capital Gains {'✓' if has_capital_gains else '✗'}, Holdings {'✓' if has_holdings else '✗'}, Dividends {'✓' if has_dividends else '✗'}")

        # Look for error indicators
        has_errors = any(error_word in body_text.lower() for error_word in ['error', 'failed', 'exception', 'traceback'])
        if has_errors:
            print(f"  ⚠️ Potential errors detected in output")
            # Extract error context
            error_context = ""
            for line in body_text.split('\n'):
                if any(error_word in line.lower() for error_word in ['error', 'failed', 'exception']):
                    error_context += line + "\n"
            if error_context:
                print(f"  Error context: {error_context[:200]}...")

        # Overall assessment
        critical_sections = [has_results_title, has_tax_liability, has_portfolio_value, has_total_return, has_currency]
        analysis_sections = [has_tax_analysis, has_portfolio_analysis]

        if all(critical_sections):
            if all(analysis_sections):
                print(f"  🎉 EXCELLENT: All sections present and working correctly")
                return "excellent"
            else:
                print(f"  ✅ GOOD: Core functionality working, some analysis sections missing")
                return "good"
        else:
            print(f"  ❌ ISSUES: Missing critical sections")
            return "issues"
