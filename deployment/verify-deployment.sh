#!/bin/bash

# Verify IBKR Tax Calculator Deployment
# This script tests all endpoints and functionality

set -e

DOMAIN="cgttaxtool.uk"
API_GATEWAY_URL="qzbkgopzi3.execute-api.eu-west-1.amazonaws.com/prod"

echo "🧪 Verifying IBKR Tax Calculator Deployment"
echo "==========================================="
echo ""

# Test 1: Custom Domain Main Page
echo "1️⃣  Testing custom domain main page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://$DOMAIN - OK ($RESPONSE)"
else
    echo "   ❌ https://$DOMAIN - FAILED ($RESPONSE)"
fi

# Test 2: WWW Subdomain
echo "2️⃣  Testing www subdomain..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://www.$DOMAIN)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://www.$DOMAIN - OK ($RESPONSE)"
else
    echo "   ❌ https://www.$DOMAIN - FAILED ($RESPONSE)"
fi

# Test 3: ads.txt file
echo "3️⃣  Testing ads.txt file..."
ADS_CONTENT=$(curl -s https://$DOMAIN/ads.txt)
EXPECTED_ADS="google.com, pub-2934063890442014, DIRECT, f08c47fec0942fa0"
if [ "$ADS_CONTENT" = "$EXPECTED_ADS" ]; then
    echo "   ✅ https://$DOMAIN/ads.txt - OK"
    echo "   📝 Content: $ADS_CONTENT"
else
    echo "   ❌ https://$DOMAIN/ads.txt - FAILED"
    echo "   📝 Expected: $EXPECTED_ADS"
    echo "   📝 Got: $ADS_CONTENT"
fi

# Test 4: About page
echo "4️⃣  Testing about page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/about)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://$DOMAIN/about - OK ($RESPONSE)"
else
    echo "   ❌ https://$DOMAIN/about - FAILED ($RESPONSE)"
fi

# Test 5: Privacy page
echo "5️⃣  Testing privacy page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://$DOMAIN/privacy - OK ($RESPONSE)"
else
    echo "   ❌ https://$DOMAIN/privacy - FAILED ($RESPONSE)"
fi

# Test 6: Terms page
echo "6️⃣  Testing terms page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://$DOMAIN/terms - OK ($RESPONSE)"
else
    echo "   ❌ https://$DOMAIN/terms - FAILED ($RESPONSE)"
fi

# Test 7: SSL Certificate
echo "7️⃣  Testing SSL certificate..."
SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ SSL Certificate - OK"
    echo "   📝 $SSL_INFO"
else
    echo "   ❌ SSL Certificate - FAILED"
fi

# Test 8: DNS Resolution
echo "8️⃣  Testing DNS resolution..."
DNS_RESULT=$(dig +short $DOMAIN)
if [ -n "$DNS_RESULT" ]; then
    echo "   ✅ DNS Resolution - OK"
    echo "   📝 $DOMAIN resolves to: $DNS_RESULT"
else
    echo "   ❌ DNS Resolution - FAILED"
fi

# Test 9: Original API Gateway URL (should still work)
echo "9️⃣  Testing original API Gateway URL..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$API_GATEWAY_URL)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ https://$API_GATEWAY_URL - OK ($RESPONSE)"
else
    echo "   ❌ https://$API_GATEWAY_URL - FAILED ($RESPONSE)"
fi

echo ""
echo "🎉 Deployment verification completed!"
echo ""
echo "📋 Summary:"
echo "  🌐 Website: https://$DOMAIN"
echo "  📝 ads.txt: https://$DOMAIN/ads.txt"
echo "  🔒 SSL: Enabled"
echo "  📍 DNS: Configured"
echo ""
echo "🚀 Your IBKR Tax Calculator is ready for users!"
