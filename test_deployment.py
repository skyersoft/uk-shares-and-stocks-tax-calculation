#!/usr/bin/env python3
"""
Simple test to check if the deployed file contains the sidebar content
"""

import requests

def test_deployed_content():
    """Check if the deployed results.html contains sidebar content"""
    
    try:
        print("🔄 Fetching results.html from live site...")
        # Add cache busting parameter
        import time
        cache_buster = int(time.time())
        response = requests.get(f"https://cgttaxtool.uk/results.html?v={cache_buster}")
        
        if response.status_code == 200:
            content = response.text
            print(f"✅ Successfully fetched content ({len(content)} characters)")
            
            # Check for sidebar-related content
            checks = [
                ("generateSidebarContent", "generateSidebarContent function"),
                ("col-lg-4", "Sidebar column class"),
                ("col-lg-8", "Main content column class"),
                ("tax-tips", "Tax tips class"),
                ("ad-container", "Advertisement container class"),
                ("book-recommendations", "Book recommendations class"),
                ("Google AdSense", "AdSense integration"),
                ("Amazon Associates", "Amazon Associates"),
                ("Tax Planning Tips", "Tax planning tips text")
            ]
            
            print("\n🔍 Checking for sidebar content...")
            for search_term, description in checks:
                if search_term in content:
                    print(f"✅ {description}: FOUND")
                else:
                    print(f"❌ {description}: NOT FOUND")
                    
            # Check line count to see if it's the full file
            line_count = len(content.split('\n'))
            print(f"\n📊 File contains {line_count} lines")
            
            if line_count < 1000:
                print("⚠️  Warning: File seems shorter than expected (should be ~1200 lines)")
            else:
                print("✅ File length seems correct")
                
        else:
            print(f"❌ Failed to fetch file: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Deployed Content")
    print("=" * 50)
    test_deployed_content()
    print("=" * 50)
