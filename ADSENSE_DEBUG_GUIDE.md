# AdSense Auto Ads Configuration Guide

## Problem: Ads working on index.html but not other pages

The AdSense script is correctly installed on all pages, but Auto Ads may need specific configuration in your AdSense dashboard.

## Quick Fix Steps

### 1. Check AdSense Auto Ads Configuration

1. **Go to Google AdSense**: https://www.google.com/adsense/
2. **Sign in** with your account
3. **Click "Ads"** in the left sidebar
4. **Click "By site"**
5. **Find "cgttaxtool.uk"**

### 2. Enable Auto Ads for All Pages

**Option A: Site-wide Auto Ads (Recommended)**
1. Click on your site name "cgttaxtool.uk"
2. Toggle **"Auto ads" to ON**
3. Click **"Apply to site"**
4. **Save changes**

**Option B: Individual Page Configuration**
1. Click **"Edit"** next to your site
2. Check **"All pages"** or individually enable:
   - `/` (home page) ✅ Already working
   - `/calculate.html`
   - `/about.html` 
   - `/privacy.html`
3. **Save changes**

### 3. Ad Types Configuration

Make sure these ad types are enabled:
- ✅ **Display ads**
- ✅ **In-feed ads**
- ✅ **In-article ads**
- ✅ **Matched content**
- ✅ **Link ads**

### 4. Page-level Settings

1. In AdSense dashboard, go to **"Sites"**
2. Click your site **"cgttaxtool.uk"**
3. Click **"Page exclusions"**
4. Make sure `/calculate.html`, `/about.html`, `/privacy.html` are **NOT** in the exclusion list

## Testing the Fix

### Browser Console Check
Open browser console (F12) on each page and look for:
```javascript
// Should see AdSense loading
(adsbygoogle = window.adsbygoogle || []).push({});
```

### Network Tab Check
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Reload page
4. Look for requests to:
   - `pagead2.googlesyndication.com` ✅
   - `www.googletagservices.com`
   - `tpc.googlesyndication.com`

### AdSense Debug
Add this to browser console to check AdSense status:
```javascript
console.log('AdSense object:', window.adsbygoogle);
console.log('AdSense loaded:', !!window.adsbygoogle);
```

## Common Issues & Solutions

### Issue 1: "Site not verified"
**Solution**: Verify ownership in AdSense dashboard
1. Go to **"Sites"**
2. Click **"Add site"** if cgttaxtool.uk not listed
3. Follow verification steps

### Issue 2: "Ads review pending"
**Solution**: Wait 1-24 hours for Google review
- New sites need approval
- Content review required
- Traffic threshold may apply

### Issue 3: "Auto ads not enabled"
**Solution**: Double-check AdSense dashboard
1. **"Ads"** → **"By site"** → **"cgttaxtool.uk"**
2. Ensure **"Auto ads: ON"**
3. Click **"Apply to site"**

### Issue 4: "Different ad density"
**Solution**: Configure ad density per page
1. Go to site settings
2. Adjust **"Ad load"** slider
3. Set to **"More ads"** for better coverage

## Current Status Verification

✅ **Script installed**: All pages have correct AdSense script
✅ **Client ID**: Using correct `ca-pub-2934063890442014`
✅ **Homepage working**: Ads showing on index.html
⏳ **Dashboard config**: Need to verify Auto Ads enabled for all pages

## Expected Timeline

- **Immediate**: AdSense script loads on all pages
- **5-10 minutes**: After dashboard changes take effect
- **1-24 hours**: For new pages to start showing ads
- **48-72 hours**: For optimization and full ad coverage

## Debug URLs

Test these URLs in your browser:
- ✅ https://cgttaxtool.uk/ (working)
- ❓ https://cgttaxtool.uk/calculate.html
- ❓ https://cgttaxtool.uk/about.html
- ❓ https://cgttaxtool.uk/privacy.html

## Next Steps

1. **Check AdSense dashboard** - Enable Auto Ads for all pages
2. **Wait 10 minutes** - For changes to propagate
3. **Test all pages** - Hard refresh and check for ads
4. **If still not working** - Check console for errors

The technical implementation is correct. This is likely a dashboard configuration issue!