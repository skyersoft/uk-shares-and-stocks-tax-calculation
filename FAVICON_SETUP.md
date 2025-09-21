# Favicon Setup

## Current Status
✅ **Basic favicon files created** to prevent 403 errors:
- `favicon.svg` - Simple SVG with £ symbol on blue background
- `favicon.ico` - Empty placeholder file

## Current Implementation
```html
<!-- In HTML head sections -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="alternate icon" href="favicon.ico">
```

## Issues Resolved
- ✅ Fixed 403 error when browser requests favicon.ico
- ✅ Added proper favicon meta tags to HTML files
- ✅ Created basic SVG favicon with tax-related symbol (£)

## Future Improvements
To create a professional favicon:

1. **Design Options:**
   - Calculator icon
   - UK pound symbol (£)
   - Tax/finance related icon
   - Company/brand logo

2. **Tools to Create Favicon:**
   - https://favicon.io/ (free favicon generator)
   - https://realfavicongenerator.net/ (comprehensive favicon generator)
   - Canva, Figma, or similar design tools

3. **Recommended Sizes:**
   - 16x16 pixels (browser tab)
   - 32x32 pixels (browser bookmark)
   - 180x180 pixels (Apple touch icon)
   - 192x192 pixels (Android home screen)

4. **File Formats:**
   - `.ico` for legacy browser support
   - `.svg` for modern browsers (scalable)
   - `.png` for mobile devices

## Complete Favicon Implementation
For a professional setup, replace current files with:

```html
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="manifest" href="site.webmanifest">
```

## Current Files
- `/static/favicon.svg` - Blue square with £ symbol
- `/static/favicon.ico` - Empty placeholder
- Added to: `index.html`, `calculate.html`
- Need to add to: `about.html`, `privacy.html`, other pages as needed