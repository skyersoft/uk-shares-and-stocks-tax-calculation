#!/usr/bin/env python3
"""Test the deployed IBKR Tax Calculator web application using Playwright."""

import asyncio
import tempfile
import os
from playwright.async_api import async_playwright

# Test data - sample CSV content
SAMPLE_CSV_CONTENT = """Date,Symbol,Name,AssetClass,SubCategory,ListingExchange,Exchange,Buy/Sell,Quantity,Price,IBCommission,Taxes,ClosePrice,FXRateToBase,MtmPnl,FifoPnlRealized
2024-01-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,BUY,100,150.00,10.00,0.00,150.00,0.75,0.00,0.00
2024-02-15,AAPL,Apple Inc,STK,COMMON,NASDAQ,NASDAQ,SELL,50,160.00,5.00,0.00,160.00,0.75,500.00,500.00
2024-03-15,MSFT,Microsoft Corp,STK,COMMON,NASDAQ,NASDAQ,BUY,50,300.00,7.50,0.00,300.00,0.75,0.00,0.00"""

# Test data - sample QFX content (simplified)
SAMPLE_QFX_CONTENT = """OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20240101000000
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<INVSTMTMSGSRSV1>
<INVSTMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<INVSTMTRS>
<INVACCTFROM>
<BROKERID>123456789
<ACCTID>U1234567
</INVACCTFROM>
<INVTRANLIST>
<DTSTART>20240101000000
<DTEND>20241231000000
<BUYSTOCK>
<INVBUY>
<INVTRAN>
<FITID>12345
<DTTRADE>20240115000000
</INVTRAN>
<SECID>
<UNIQUEID>037833100
<UNIQUEIDTYPE>CUSIP
</SECID>
<UNITS>100
<UNITPRICE>150.00
<COMMISSION>10.00
<TOTAL>-15010.00
</INVBUY>
</BUYSTOCK>
</INVTRANLIST>
</INVSTMTRS>
</INVSTMTTRNRS>
</INVSTMTMSGSRSV1>
</OFX>"""

async def test_webapp():
    """Test the web application functionality."""
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)  # Set to False to see the browser
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            print("🌐 Testing IBKR Tax Calculator Web Application")
            print("=" * 60)
            
            # Navigate to the application
            url = "https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/"
            print(f"📍 Navigating to: {url}")
            await page.goto(url)
            
            # Wait for page to load
            await page.wait_for_load_state('networkidle')
            
            # Check if the page loaded correctly
            title = await page.title()
            print(f"📄 Page title: {title}")
            
            # Check for key elements
            print("\n🔍 Checking page elements...")
            
            # Check for main heading
            heading = await page.locator('h1').first.text_content()
            print(f"✅ Main heading: {heading}")
            
            # Check for file upload area
            upload_area = page.locator('#uploadArea')
            if await upload_area.count() > 0:
                print("✅ File upload area found")
            else:
                print("❌ File upload area not found")
            
            # Check for form elements
            file_input = page.locator('#fileInput')
            tax_year_select = page.locator('#taxYear')
            analysis_type_select = page.locator('#analysisType')
            
            if await file_input.count() > 0:
                print("✅ File input found")
            else:
                print("❌ File input not found")
                
            if await tax_year_select.count() > 0:
                print("✅ Tax year selector found")
            else:
                print("❌ Tax year selector not found")
                
            if await analysis_type_select.count() > 0:
                print("✅ Analysis type selector found")
            else:
                print("❌ Analysis type selector not found")
            
            # Test CSV file upload
            print("\n📁 Testing CSV file upload...")
            await test_csv_upload(page)
            
            # Test QFX file upload
            print("\n📁 Testing QFX file upload...")
            await test_qfx_upload(page)
            
            # Test navigation
            print("\n🧭 Testing navigation...")
            await test_navigation(page)
            
        except Exception as e:
            print(f"❌ Error during testing: {e}")
            # Take a screenshot for debugging
            await page.screenshot(path="error_screenshot.png")
            print("📸 Screenshot saved as error_screenshot.png")
            
        finally:
            await browser.close()

async def test_csv_upload(page):
    """Test CSV file upload functionality."""
    
    try:
        # Create a temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_file:
            temp_file.write(SAMPLE_CSV_CONTENT)
            csv_file_path = temp_file.name
        
        print(f"📄 Created test CSV file: {csv_file_path}")
        
        # Upload the file
        file_input = page.locator('#fileInput')
        await file_input.set_input_files(csv_file_path)
        
        # Wait a moment for the file to be processed
        await page.wait_for_timeout(1000)
        
        # Check if the upload area updated
        upload_area_text = await page.locator('#uploadArea').text_content()
        if "File Selected" in upload_area_text or "CSV" in upload_area_text:
            print("✅ CSV file upload successful - UI updated")
        else:
            print("⚠️ CSV file upload - UI may not have updated")
            print(f"Upload area text: {upload_area_text}")
        
        # Try to submit the form
        print("🚀 Attempting to submit CSV calculation...")
        
        # Set tax year and analysis type
        await page.locator('#taxYear').select_option('2024-2025')
        await page.locator('#analysisType').select_option('both')
        
        # Listen for network requests
        requests = []
        page.on('request', lambda request: requests.append({
            'url': request.url,
            'method': request.method,
            'headers': dict(request.headers)
        }))

        # Click submit button
        submit_button = page.locator('#calculateBtn')
        await submit_button.click()

        # Wait for response (with timeout)
        try:
            await page.wait_for_load_state('networkidle', timeout=30000)

            # Print network requests for debugging
            print("📡 Network requests made:")
            for req in requests[-3:]:  # Show last 3 requests
                print(f"  {req['method']} {req['url']}")
                if 'content-type' in req['headers']:
                    print(f"    Content-Type: {req['headers']['content-type']}")
            
            # Check if we got a results page or error
            current_url = page.url
            page_content = await page.content()
            
            if "Tax Calculation Results" in page_content:
                print("✅ CSV processing successful - Results page loaded")
            elif "error" in page_content.lower() or "Error" in page_content:
                print("❌ CSV processing failed - Error in response")
                # Extract error message
                error_text = await page.locator('body').text_content()
                print(f"Error details: {error_text[:500]}...")
            else:
                print("⚠️ CSV processing - Unexpected response")
                print(f"Current URL: {current_url}")
                
        except Exception as e:
            print(f"❌ CSV processing timeout or error: {e}")
            
        # Clean up
        os.unlink(csv_file_path)
        
    except Exception as e:
        print(f"❌ CSV upload test failed: {e}")

async def test_qfx_upload(page):
    """Test QFX file upload functionality."""
    
    try:
        # Navigate back to main page
        await page.goto("https://qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod/")
        await page.wait_for_load_state('networkidle')
        
        # Create a temporary QFX file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.qfx', delete=False) as temp_file:
            temp_file.write(SAMPLE_QFX_CONTENT)
            qfx_file_path = temp_file.name
        
        print(f"📄 Created test QFX file: {qfx_file_path}")
        
        # Upload the file
        file_input = page.locator('#fileInput')
        await file_input.set_input_files(qfx_file_path)
        
        # Wait a moment for the file to be processed
        await page.wait_for_timeout(1000)
        
        # Check if the upload area updated
        upload_area_text = await page.locator('#uploadArea').text_content()
        if "File Selected" in upload_area_text or "QFX" in upload_area_text:
            print("✅ QFX file upload successful - UI updated")
        else:
            print("⚠️ QFX file upload - UI may not have updated")
            print(f"Upload area text: {upload_area_text}")
        
        # Try to submit the form
        print("🚀 Attempting to submit QFX calculation...")
        
        # Set tax year and analysis type
        await page.locator('#taxYear').select_option('2024-2025')
        await page.locator('#analysisType').select_option('both')
        
        # Click submit button
        submit_button = page.locator('#calculateBtn')
        await submit_button.click()
        
        # Wait for response (with timeout)
        try:
            await page.wait_for_load_state('networkidle', timeout=30000)
            
            # Check if we got a results page or error
            current_url = page.url
            page_content = await page.content()
            
            if "Tax Calculation Results" in page_content:
                print("✅ QFX processing successful - Results page loaded")
            elif "error" in page_content.lower() or "Error" in page_content:
                print("❌ QFX processing failed - Error in response")
                # Extract error message
                error_text = await page.locator('body').text_content()
                print(f"Error details: {error_text[:500]}...")
            else:
                print("⚠️ QFX processing - Unexpected response")
                print(f"Current URL: {current_url}")
                
        except Exception as e:
            print(f"❌ QFX processing timeout or error: {e}")
            
        # Clean up
        os.unlink(qfx_file_path)
        
    except Exception as e:
        print(f"❌ QFX upload test failed: {e}")

async def test_navigation(page):
    """Test navigation between pages."""
    
    try:
        # Test About page
        about_link = page.locator('a[href="/about"]')
        if await about_link.count() > 0:
            await about_link.click()
            await page.wait_for_load_state('networkidle')
            
            if "About IBKR Tax Calculator" in await page.content():
                print("✅ About page navigation successful")
            else:
                print("❌ About page navigation failed")
        
        # Test Privacy page
        privacy_link = page.locator('a[href="/privacy"]')
        if await privacy_link.count() > 0:
            await privacy_link.click()
            await page.wait_for_load_state('networkidle')
            
            if "Privacy Policy" in await page.content():
                print("✅ Privacy page navigation successful")
            else:
                print("❌ Privacy page navigation failed")
        
        # Test Terms page
        terms_link = page.locator('a[href="/terms"]')
        if await terms_link.count() > 0:
            await terms_link.click()
            await page.wait_for_load_state('networkidle')
            
            if "Terms of Service" in await page.content():
                print("✅ Terms page navigation successful")
            else:
                print("❌ Terms page navigation failed")
                
    except Exception as e:
        print(f"❌ Navigation test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_webapp())
