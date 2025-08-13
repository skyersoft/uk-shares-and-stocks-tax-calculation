"""
Comprehensive test to verify all content enhancements for Google AdSense approval.
"""
import pytest
from playwright.sync_api import Page, expect


class TestContentVerification:
    """Test all content enhancements and functionality."""
    
    BASE_URL = "https://cgttaxtool.uk"
    
    def test_landing_page_content_richness(self, page: Page):
        """Test that the landing page has substantial content."""
        page.goto(self.BASE_URL)
        
        # Check for educational content section
        expect(page.locator("h2:has-text('Understanding UK Tax on International Investments')")).to_be_visible()
        
        # Check for key educational topics
        expect(page.locator("text=Why You Need This Calculator")).to_be_visible()
        expect(page.locator("text=Capital Gains Tax: What You Need to Know")).to_be_visible()
        expect(page.locator("text=Dividend Taxation for UK Residents")).to_be_visible()
        expect(page.locator("text=Section 104 Pooling: The UK Method")).to_be_visible()
        expect(page.locator("text=Currency Conversion Requirements")).to_be_visible()
        expect(page.locator("text=Reporting Obligations and Deadlines")).to_be_visible()
        
        # Check for 2024-25 rate change warning
        expect(page.locator("text=Important: 2024-25 Rate Changes")).to_be_visible()
        expect(page.locator("text=Before 30 Oct 2024")).to_be_visible()
        expect(page.locator("text=After 30 Oct 2024")).to_be_visible()
        
        # Verify content length (should be substantial)
        content = page.locator("body").inner_text()
        assert len(content) > 5000, f"Landing page content too short: {len(content)} characters"
        
    def test_faq_section_functionality(self, page: Page):
        """Test the FAQ accordion functionality."""
        page.goto(self.BASE_URL)
        
        # Check FAQ section exists
        expect(page.locator("h2:has-text('Frequently Asked Questions')")).to_be_visible()
        
        # Test accordion functionality
        faq_items = [
            "What file formats does the calculator accept?",
            "How accurate are the tax calculations?",
            "What about data privacy and security?",
            "Do I need to report small gains to HMRC?",
            "How does currency conversion work?",
            "What if I have losses from previous years?"
        ]
        
        for faq_item in faq_items:
            # Check FAQ item exists
            faq_button = page.locator(f"button:has-text('{faq_item}')")
            expect(faq_button).to_be_visible()
            
            # Click to expand (if not already expanded)
            if faq_button.get_attribute("aria-expanded") == "false":
                faq_button.click()
                page.wait_for_timeout(500)  # Wait for animation
        
        # Check that detailed answers are present
        expect(page.locator("text=QFX (Quicken Financial Exchange)")).to_be_visible()
        expect(page.locator("li:has-text('Section 104 pooling for same-class shares')")).to_be_visible()
        expect(page.locator("text=HTTPS encryption")).to_be_visible()
        
    def test_tax_planning_strategies_section(self, page: Page):
        """Test the tax planning strategies section."""
        page.goto(self.BASE_URL)
        
        # Check main heading
        expect(page.locator("h2:has-text('Tax Planning Strategies for International Investors')")).to_be_visible()
        
        # Check all strategy cards
        strategies = [
            "Timing Your Disposals",
            "Harvesting Tax Losses",
            "ISA and SIPP Utilization",
            "Spouse/Civil Partner Transfers"
        ]
        
        for strategy in strategies:
            expect(page.locator(f"h4:has-text('{strategy}')")).to_be_visible()
        
        # Check for practical examples
        expect(page.locator("text=If you have £10,000 of gains")).to_be_visible()
        expect(page.locator("text=£20,000 for 2024-25")).to_be_visible()
        
    def test_blog_page_navigation_and_content(self, page: Page):
        """Test blog page navigation and content."""
        page.goto(self.BASE_URL)
        
        # Check blog link in navigation
        blog_link = page.locator("a[href='/blog']")
        expect(blog_link).to_be_visible()
        
        # Navigate to blog page
        blog_link.click()
        page.wait_for_load_state("networkidle")
        
        # Check blog page loaded correctly
        expect(page.locator("h1:has-text('UK Tax & Investment Insights')")).to_be_visible()
        
        # Check featured articles section
        expect(page.locator("h2:has-text('Featured Articles')")).to_be_visible()
        
        # Check all featured articles are present and clickable
        featured_articles = [
            "Understanding the 2024-25 CGT Rate Changes",
            "Section 104 Pooling Explained", 
            "Maximizing Your Dividend Allowance"
        ]
        
        for article in featured_articles:
            article_link = page.locator(f"a:has(h5:has-text('{article}'))")
            expect(article_link).to_be_visible()
            
    def test_blog_article_links_functionality(self, page: Page):
        """Test that featured article links work correctly."""
        page.goto(f"{self.BASE_URL}/blog")
        
        # Test CGT rate changes article link
        cgt_link = page.locator("a[href='#cgt-rate-changes']")
        expect(cgt_link).to_be_visible()
        cgt_link.click()
        page.wait_for_timeout(1000)
        
        # Check that we scrolled to the article
        cgt_article = page.locator("#cgt-rate-changes")
        expect(cgt_article).to_be_visible()
        expect(page.locator("#cgt-rate-changes h2:has-text('Understanding the 2024-25 Capital Gains Tax Rate Changes')")).to_be_visible()
        
        # Test Section 104 pooling article link
        pooling_link = page.locator("a[href='#section-104-pooling']")
        expect(pooling_link).to_be_visible()
        pooling_link.click()
        page.wait_for_timeout(1000)
        
        # Check that we scrolled to the article
        pooling_article = page.locator("#section-104-pooling")
        expect(pooling_article).to_be_visible()
        expect(page.locator("#section-104-pooling h2:has-text('Section 104 Pooling: The UK Method for Share Calculations')")).to_be_visible()
        
        # Test dividend allowance article link
        dividend_link = page.locator("a[href='#dividend-allowance']")
        expect(dividend_link).to_be_visible()
        dividend_link.click()
        page.wait_for_timeout(1000)
        
        # Check that we scrolled to the article
        dividend_article = page.locator("#dividend-allowance")
        expect(dividend_article).to_be_visible()
        expect(page.locator("#dividend-allowance h2:has-text('Maximizing Your Dividend Allowance')")).to_be_visible()
        
    def test_blog_content_quality_and_length(self, page: Page):
        """Test that blog content is substantial and high-quality."""
        page.goto(f"{self.BASE_URL}/blog")
        
        # Check for detailed article content
        expect(page.locator("h5:has-text('Period 2: 30 October 2024 to 5 April 2025')")).to_be_visible()
        expect(page.locator("text=Section 104 pooling treats all shares")).to_be_visible()
        expect(page.locator("text=dividend allowance reduced to just £500")).to_be_visible()
        
        # Check for practical examples
        expect(page.locator("text=January 2024: Buy 100 shares")).to_be_visible()
        expect(page.locator("text=8.75% on dividends above £500")).to_be_visible()
        
        # Check content length
        content = page.locator("body").inner_text()
        assert len(content) > 6000, f"Blog page content too short: {len(content)} characters"
        
        # Check for professional disclaimers
        expect(page.locator("text=This content is for educational purposes only")).to_be_visible()
        
    def test_navigation_consistency_across_pages(self, page: Page):
        """Test that navigation is consistent across all pages."""
        pages_to_test = [
            ("/", "Calculator"),
            ("/help", "Help"),
            ("/cgt-guide", "CGT Guide"),
            ("/blog", "Blog")
        ]
        
        for page_url, page_name in pages_to_test:
            page.goto(f"{self.BASE_URL}{page_url}")
            
            # Check that all navigation links are present
            expect(page.locator("a[href='/help']")).to_be_visible()
            expect(page.locator("a[href='/cgt-guide']")).to_be_visible()
            expect(page.locator("a[href='/blog']")).to_be_visible()
            
            # Check that current page is highlighted (if applicable)
            if page_url == "/blog":
                expect(page.locator("a[href='/blog'].active")).to_be_visible()
                
    def test_adsense_placeholder_integration(self, page: Page):
        """Test that AdSense placeholders are properly integrated."""
        page.goto(f"{self.BASE_URL}/blog")
        
        # Check for AdSense script tags and placeholders
        content = page.content()
        assert "adsbygoogle" in content, "AdSense placeholders not found"
        assert "data-ad-client" in content, "AdSense client ID not found"
        
        # Check for multiple ad placements
        ad_containers = page.locator(".ad-container")
        expect(ad_containers.first).to_be_visible()
        
    def test_existing_calculator_functionality_preserved(self, page: Page):
        """Test that existing calculator functionality still works."""
        page.goto(self.BASE_URL)
        
        # Check that calculator section is still present
        expect(page.locator("#calculator")).to_be_visible()
        expect(page.locator("#uploadBtn")).to_be_visible()  # The visible upload button
        expect(page.locator("#calculateBtn")).to_be_visible()
        
        # Check tax year selector
        expect(page.locator("#taxYear")).to_be_visible()
        
        # Check analysis type selector
        expect(page.locator("#analysisType")).to_be_visible()
        
    def test_content_seo_and_structure(self, page: Page):
        """Test content structure for SEO and readability."""
        pages_to_test = ["/", "/blog", "/cgt-guide", "/help"]
        
        for page_url in pages_to_test:
            page.goto(f"{self.BASE_URL}{page_url}")
            
            # Check for proper heading structure
            h1_count = page.locator("h1").count()
            assert h1_count >= 1, f"Page {page_url} missing H1 heading"
            
            # Check for meta description
            meta_desc = page.locator("meta[name='description']")
            if meta_desc.count() > 0:
                desc_content = meta_desc.get_attribute("content")
                assert len(desc_content) > 50, f"Meta description too short on {page_url}"
            
            # Check for proper title
            title = page.title()
            assert len(title) > 10, f"Page title too short on {page_url}"
            assert "IBKR" in title or "Tax" in title, f"Page title not descriptive on {page_url}"
