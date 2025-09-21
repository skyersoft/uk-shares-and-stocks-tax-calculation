#!/bin/bash

# AdSense Setup Verification Script
# This script checks for common AdSense configuration issues

echo "🔍 AdSense Configuration Verification"
echo "====================================="

echo ""
echo "1. Checking for AdSense script in HTML files..."
ADSENSE_SCRIPT_COUNT=$(grep -l "pagead2.googlesyndication.com" static/*.html | wc -l)
echo "   ✅ Found AdSense script in $ADSENSE_SCRIPT_COUNT files"

echo ""
echo "2. Checking for Auto Ads configuration..."
AUTO_ADS_COUNT=$(grep -l "enable_page_level_ads" static/*.html | wc -l)
echo "   ✅ Found Auto Ads config in $AUTO_ADS_COUNT files"

echo ""
echo "3. Checking for active (uncommented) manual ad units..."
ACTIVE_ADS=$(find static/ -name "*.html" -exec grep -l "^\s*<ins class=\"adsbygoogle\"" {} \; 2>/dev/null | wc -l)
if [ $ACTIVE_ADS -eq 0 ]; then
    echo "   ✅ No active manual ad units found (good for Auto Ads)"
else
    echo "   ⚠️  Found $ACTIVE_ADS files with active manual ad units:"
    find static/ -name "*.html" -exec grep -l "^\s*<ins class=\"adsbygoogle\"" {} \; 2>/dev/null
fi

echo ""
echo "4. Checking for duplicate enable_page_level_ads..."
for file in static/*.html; do
    if [ -f "$file" ]; then
        COUNT=$(grep -c "enable_page_level_ads" "$file" 2>/dev/null || echo "0")
        if [ "$COUNT" -gt 1 ]; then
            echo "   ⚠️  $file has $COUNT enable_page_level_ads declarations"
        fi
    fi
done

echo ""
echo "5. Publisher ID verification..."
PUB_ID=$(grep -o "pub-[0-9]\+" static/index.html | head -1)
echo "   ✅ Publisher ID: $PUB_ID"

echo ""
echo "6. Files with AdSense integration:"
grep -l "adsbygoogle\|pagead2" static/*.html | sort

echo ""
echo "🎯 Recommendations:"
echo "   1. Enable Auto Ads in your Google AdSense account"
echo "   2. Wait 24-48 hours for ads to start showing"
echo "   3. Test at: https://cgttaxtool.uk/adsense-test.html"
echo "   4. Check browser console for any remaining errors"

echo ""
echo "✅ Verification complete!"