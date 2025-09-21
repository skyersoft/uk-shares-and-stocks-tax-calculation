# Google AdSense Setup Instructions

## Current Status
- ✅ AdSense script is installed on all pages with pub-2934063890442014
- ✅ Auto Ads configuration is enabled on all pages
- ✅ Placeholder ad slots are commented out with instructions
- ⚠️ Auto Ads need to be enabled in your AdSense account

## Option 1: Auto Ads (Recommended)
Auto Ads automatically place ads on your site without needing specific ad units.

### Steps to Enable Auto Ads:
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign in to your AdSense account
3. Navigate to **Ads** > **By site**
4. Find your site (cgttaxtool.uk)
5. Turn on **Auto ads**
6. Choose ad formats (Display, In-feed, In-article, etc.)
7. Save changes

Auto ads will start showing within a few hours once enabled.

## Option 2: Manual Ad Units
If you prefer manual control over ad placement:

### Create Ad Units:
1. Go to **Ads** > **By ad unit**
2. Create a new **Display ad**
3. Name it (e.g., "CGT Calculator Banner")
4. Choose size: **Responsive**
5. Copy the ad unit ID (format: 1234567890)

### Replace Placeholder IDs:
Replace these placeholder values in your HTML files:
- `YOUR_BANNER_SLOT_ID` → your banner ad unit ID
- `YOUR_SIDEBAR_SLOT_ID` → your sidebar ad unit ID

## Current Files with Ads:
- `static/index.html` - 2 ad placements
- `static/calculate.html` - 1 ad placement  
- `static/about.html` - 1 ad placement
- `static/privacy.html` - (if any)

## Testing:
- Use AdSense preview mode to test ad display
- Check browser console for any AdSense errors
- Allow 24-48 hours for ads to start showing consistently