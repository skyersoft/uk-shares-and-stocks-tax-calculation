#!/usr/bin/env python3
"""
Comprehensive Playwright E2E tests for the React SPA
Tests routing, navigation, component functionality, and user interactions
"""

import asyncio
import os
import sys
import pytest
from playwright.async_api import async_playwright, expect


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_loads_correctly():
    """Test that the SPA loads and initializes correctly"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging for debugging
        page.on("console", lambda msg: print(f"[BROWSER] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: print(f"[ERROR] {error}"))
        
        try:
            # Navigate to SPA
            print(f"Navigating to {base_url}/spa/index.html")
            await page.goto(f"{base_url}/spa/index.html")
            
            # Wait for React to load
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Check that React has rendered content
            spa_root = page.locator('#spa-root')
            await expect(spa_root).not_to_be_empty()
            
            # Check for common React components
            await page.wait_for_selector('[data-testid], .container, .nav, h1, h2', timeout=5000)
            
            # Verify page title
            title = await page.title()
            assert "IBKR Tax Calculator" in title, f"Expected title to contain 'IBKR Tax Calculator', got: {title}"
            
            print("✅ SPA loads and initializes correctly")
            
        except Exception as e:
            # Take screenshot for debugging
            await page.screenshot(path='tests/e2e/artifacts/spa_load_error.png')
            print(f"❌ SPA loading failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_navigation_routing():
    """Test SPA navigation and routing - this is the main issue we're debugging"""
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
            print(f"Testing SPA routing at {base_url}/spa/index.html")
            await page.goto(f"{base_url}/spa/index.html")
            
            # Wait for React to load
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Find navigation links
            nav_links = await page.locator('nav a, .nav a, [href*="about"], [href*="calculator"], [href*="help"]').all()
            print(f"Found {len(nav_links)} navigation links")
            
            # Test About link specifically (the one mentioned in the issue)
            about_link = page.locator('[href*="about"]').first
            if await about_link.count() > 0:
                print("Testing About link navigation...")
                current_url = page.url
                
                # Click the About link
                await about_link.click()
                
                # Wait a moment for any navigation
                await page.wait_for_timeout(2000)
                
                new_url = page.url
                print(f"URL before click: {current_url}")
                print(f"URL after click: {new_url}")
                
                # Check if we stayed in the SPA or navigated away
                if "spa" not in new_url and new_url != current_url:
                    print(f"❌ ROUTING ISSUE: About link navigated to {new_url} instead of staying in SPA")
                    print("This confirms the routing problem!")
                    
                    # Check if the new URL returns 404 or error
                    response = await page.goto(new_url)
                    if response and response.status >= 400:
                        print(f"❌ Navigation target returns {response.status} error")
                else:
                    print("✅ Navigation stayed within SPA")
            
            # Test other navigation links
            nav_items = ['calculator', 'help', 'guide', 'results']
            for nav_item in nav_items:
                link = page.locator(f'[href*="{nav_item}"]').first
                if await link.count() > 0:
                    print(f"Testing {nav_item} link...")
                    current_url = page.url
                    await link.click()
                    await page.wait_for_timeout(1000)
                    new_url = page.url
                    
                    if "spa" not in new_url and new_url != current_url:
                        print(f"❌ ROUTING ISSUE: {nav_item} link navigated to {new_url}")
                    else:
                        print(f"✅ {nav_item} navigation OK")
            
        except Exception as e:
            await page.screenshot(path='tests/e2e/artifacts/spa_routing_error.png')
            print(f"❌ SPA routing test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_components_functionality():
    """Test that SPA components load and function correctly"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Test for common UI components
            components_to_test = [
                'button',
                'input',
                'form',
                '.btn',
                '.container',
                '.card',
                'h1, h2, h3'
            ]
            
            for component in components_to_test:
                elements = await page.locator(component).count()
                if elements > 0:
                    print(f"✅ Found {elements} {component} elements")
                else:
                    print(f"⚠️ No {component} elements found")
            
            # Test for file upload functionality if present
            file_input = page.locator('input[type="file"]')
            if await file_input.count() > 0:
                print("✅ File upload component found")
            
            # Test for tax calculation forms
            calc_forms = await page.locator('form, [data-testid*="calc"], [data-testid*="tax"]').count()
            print(f"Found {calc_forms} calculation-related elements")
            
        except Exception as e:
            await page.screenshot(path='tests/e2e/artifacts/spa_components_error.png')
            print(f"❌ SPA components test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_console_errors():
    """Test for JavaScript console errors in the SPA"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        console_errors = []
        page_errors = []
        
        # Collect console messages
        page.on("console", lambda msg: 
            console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        
        try:
            await page.goto(f"{base_url}/spa/index.html")
            await page.wait_for_selector('#spa-root', timeout=10000)
            
            # Wait for any async operations to complete
            await page.wait_for_timeout(3000)
            
            # Report any errors found
            if console_errors:
                print("❌ Console errors found:")
                for error in console_errors:
                    print(f"  - {error}")
            else:
                print("✅ No console errors found")
            
            if page_errors:
                print("❌ Page errors found:")
                for error in page_errors:
                    print(f"  - {error}")
            else:
                print("✅ No page errors found")
            
            # Take screenshot for reference
            await page.screenshot(path='tests/e2e/artifacts/spa_final_state.png')
            
        except Exception as e:
            print(f"❌ Console error test failed: {e}")
            raise
        finally:
            await browser.close()


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_spa_vs_static_comparison():
    """Compare SPA functionality with static site to identify differences"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        
        try:
            # Test static site
            static_page = await context.new_page()
            await static_page.goto(f"{base_url}")
            static_title = await static_page.title()
            static_nav_links = await static_page.locator('nav a, .nav a').count()
            
            # Test SPA
            spa_page = await context.new_page()
            await spa_page.goto(f"{base_url}/spa/index.html")
            await spa_page.wait_for_selector('#spa-root', timeout=10000)
            spa_title = await spa_page.title()
            spa_nav_links = await spa_page.locator('nav a, .nav a').count()
            
            print(f"Static site title: {static_title}")
            print(f"SPA title: {spa_title}")
            print(f"Static nav links: {static_nav_links}")
            print(f"SPA nav links: {spa_nav_links}")
            
            # Compare functionality
            if static_nav_links > 0 and spa_nav_links == 0:
                print("⚠️ SPA might not be rendering navigation properly")
            
        except Exception as e:
            print(f"❌ Comparison test failed: {e}")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    # Run tests directly if called as script
    asyncio.run(test_spa_loads_correctly())
    asyncio.run(test_spa_navigation_routing())
    asyncio.run(test_spa_components_functionality())
    asyncio.run(test_spa_console_errors())
    asyncio.run(test_spa_vs_static_comparison())