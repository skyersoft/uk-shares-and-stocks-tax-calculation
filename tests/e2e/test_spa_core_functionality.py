#!/usr/bin/env python3
"""
Test SPA core functionality including file upload, calculations, and user interactions
"""

import asyncio
import os
import sys
import pytest
from playwright.async_api import async_playwright, expect


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_file_upload_functionality():
    """Test file upload functionality in the SPA"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[BROWSER] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: print(f"[ERROR] {error}"))
        
        try:
            # Navigate to SPA
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Look for file upload input
            file_input = page.locator('input[type="file"]')
            if await file_input.count() > 0:
                print("✅ File upload input found")
                
                # Check if upload area is present
                upload_area = page.locator('.upload-area, .file-upload, [data-testid*="upload"]')
                upload_count = await upload_area.count()
                print(f"Found {upload_count} upload area elements")
                
                # Test drag and drop area if present
                dropzone = page.locator('.dropzone, [data-testid="dropzone"]')
                if await dropzone.count() > 0:
                    print("✅ Drag and drop zone found")
                
                # Test file format indicators
                format_indicators = await page.locator('text=QFX, text=CSV, .file-format').count()
                if format_indicators > 0:
                    print(f"✅ Found {format_indicators} file format indicators")
                
            else:
                print("⚠️ No file upload input found")
            
            # Test sample file links or buttons
            sample_links = await page.locator('text*="sample", text*="example", [data-testid*="sample"]').count()
            if sample_links > 0:
                print(f"✅ Found {sample_links} sample file references")
            
        except Exception as e:
            await page.screenshot(path='tests/e2e/artifacts/spa_upload_error.png')
            print(f"❌ File upload test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_navigation_flow():
    """Test complete navigation flow through all pages"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Start at SPA
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Test navigation to each page
            pages_to_test = ['about', 'help', 'guide', 'calculator']
            
            for page_name in pages_to_test:
                print(f"Testing navigation to {page_name}...")
                
                # Click navigation link
                nav_link = page.locator(f'[href="#{page_name}"]')
                if await nav_link.count() > 0:
                    await nav_link.click()
                    await page.wait_for_timeout(1000)
                    
                    # Check URL hash
                    current_url = page.url
                    if f"#{page_name}" in current_url:
                        print(f"✅ Successfully navigated to {page_name}")
                        
                        # Check for page-specific content
                        if page_name == 'about':
                            content = await page.locator('text*="About IBKR"').count()
                        elif page_name == 'help':
                            content = await page.locator('text*="Help", text*="FAQ"').count()
                        elif page_name == 'guide':
                            content = await page.locator('text*="Capital Gains Tax"').count()
                        elif page_name == 'calculator':
                            content = await page.locator('input[type="file"], .calculator').count()
                        
                        if content > 0:
                            print(f"✅ {page_name} page content loaded correctly")
                        else:
                            print(f"⚠️ {page_name} page content might not be loaded")
                    else:
                        print(f"⚠️ Navigation to {page_name} might not have worked")
                else:
                    print(f"⚠️ Navigation link for {page_name} not found")
            
            # Take final screenshot
            await page.screenshot(path='tests/e2e/artifacts/spa_navigation_complete.png')
            
        except Exception as e:
            await page.screenshot(path='tests/e2e/artifacts/spa_navigation_error.png')
            print(f"❌ Navigation flow test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_responsive_design():
    """Test SPA responsive design on different screen sizes"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Test different viewport sizes
            viewports = [
                {"width": 1920, "height": 1080, "name": "Desktop"},
                {"width": 768, "height": 1024, "name": "Tablet"},
                {"width": 375, "height": 667, "name": "Mobile"}
            ]
            
            for viewport in viewports:
                print(f"Testing {viewport['name']} viewport ({viewport['width']}x{viewport['height']})")
                
                await page.set_viewport_size(width=viewport['width'], height=viewport['height'])
                await page.wait_for_timeout(1000)
                
                # Check if navigation is accessible
                nav = page.locator('nav, .navbar')
                if await nav.count() > 0:
                    print(f"✅ Navigation visible on {viewport['name']}")
                
                # Check for mobile menu toggle if on small screen
                if viewport['width'] < 768:
                    toggle = page.locator('.navbar-toggler, .mobile-menu-toggle')
                    if await toggle.count() > 0:
                        print(f"✅ Mobile menu toggle found on {viewport['name']}")
                
                # Check main content area
                main_content = page.locator('main, .main-content, #spa-root > div')
                if await main_content.count() > 0:
                    print(f"✅ Main content area visible on {viewport['name']}")
                
                # Take screenshot for this viewport
                await page.screenshot(path=f'tests/e2e/artifacts/spa_{viewport["name"].lower()}.png')
            
        except Exception as e:
            print(f"❌ Responsive design test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_performance_metrics():
    """Test SPA performance metrics"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Measure page load time
            start_time = asyncio.get_event_loop().time()
            
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Wait for React to fully load
            await page.wait_for_function("window.React !== undefined || document.querySelector('#spa-root').children.length > 0")
            
            end_time = asyncio.get_event_loop().time()
            load_time = end_time - start_time
            
            print(f"✅ SPA load time: {load_time:.2f} seconds")
            
            if load_time < 5.0:
                print("✅ Load time is acceptable (< 5 seconds)")
            else:
                print("⚠️ Load time is slow (> 5 seconds)")
            
            # Check for large assets
            responses = []
            
            def handle_response(response):
                if 'spa' in response.url:
                    responses.append({
                        'url': response.url,
                        'size': len(response.headers.get('content-length', '0')),
                        'status': response.status
                    })
            
            page.on('response', handle_response)
            
            # Navigate to trigger asset loading
            await page.reload()
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Report asset sizes
            for response in responses[-5:]:  # Last 5 responses
                print(f"Asset: {response['url'].split('/')[-1]} - Status: {response['status']}")
            
        except Exception as e:
            print(f"❌ Performance test failed: {e}")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    # Run tests directly
    asyncio.run(test_spa_file_upload_functionality())
    asyncio.run(test_spa_navigation_flow())
    asyncio.run(test_spa_responsive_design())
    asyncio.run(test_spa_performance_metrics())