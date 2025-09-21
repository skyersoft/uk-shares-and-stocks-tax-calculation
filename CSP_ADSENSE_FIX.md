# Content Security Policy (CSP) Fix for Google AdSense

## Problem
Getting error: `Refused to frame 'https://www.google.com/' because an ancestor violates the following Content Security Policy directive: "frame-ancestors 'self'"`

This was preventing Google Ads from loading properly.

## Root Cause
The default Content Security Policy was too restrictive and blocked Google AdSense domains from loading ads in frames/iframes.

## Solution Applied
Added comprehensive CSP meta tags to all HTML pages with AdSense to allow:

### Frame Ancestors
- `'self'` - Allow same-origin framing
- `https://www.google.com` - Google's main domain
- `https://tpc.googlesyndication.com` - Third-party content
- `https://googleads.g.doubleclick.net` - Ad serving
- `https://pagead2.googlesyndication.com` - AdSense ads

### Script Sources
- `'self'` - Same-origin scripts
- `'unsafe-inline'` - Inline scripts (needed for AdSense)
- `https://pagead2.googlesyndication.com` - AdSense scripts
- `https://www.googletagservices.com` - Google Tag Services
- `https://tpc.googlesyndication.com` - Third-party content
- `https://cdn.jsdelivr.net` - Bootstrap CDN
- `https://cdnjs.cloudflare.com` - Font Awesome CDN

### Style Sources
- `'self'` - Same-origin styles
- `'unsafe-inline'` - Inline styles (needed for dynamic ads)
- `https://fonts.googleapis.com` - Google Fonts
- `https://cdn.jsdelivr.net` - Bootstrap CDN
- `https://cdnjs.cloudflare.com` - Font Awesome CDN

### Font Sources
- `'self'` - Same-origin fonts
- `https://fonts.gstatic.com` - Google Fonts static content
- `https://cdnjs.cloudflare.com` - Font Awesome fonts

## Implementation
Added to HTML `<head>` section of all AdSense pages:

```html
<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://www.google.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com https://tpc.googlesyndication.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;">
```

## Files Updated
- ✅ `index.html`
- ✅ `calculate.html`
- ✅ `about.html`
- ✅ `privacy.html`
- ✅ `adsense-test.html`

## Deployment
- **Deployed**: 2025-09-21 13:34 UTC
- **CloudFront Invalidation**: `I2JXLXIVVS1QSG5XLSN6H4FQR8`

## Expected Results
After cache clears (5-10 minutes):
- ✅ No more CSP violations in browser console
- ✅ Google AdSense should be able to load ads properly
- ✅ Frames/iframes from Google domains should work
- ✅ All existing functionality preserved

## Testing
1. Wait for CloudFront cache to clear (5-10 minutes)
2. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
3. Check browser console - CSP errors should be gone
4. Test AdSense loading at: https://cgttaxtool.uk/adsense-test.html
5. Enable Auto Ads in Google AdSense dashboard if not already done

## Security Note
This CSP is specifically tailored for Google AdSense requirements while maintaining reasonable security. It allows:
- Google's ad serving domains
- Required inline styles/scripts for ads
- CDN resources for Bootstrap and Font Awesome
- Same-origin content

The policy blocks unauthorized third-party content while allowing legitimate advertising functionality.