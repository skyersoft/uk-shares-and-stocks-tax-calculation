# Playwright Test Failures Analysis

## Test Failures Summary

1. **Mobile hamburger menu not visible** - `.navbar-toggler` element is hidden
2. **Active navigation item not highlighted** - Home link doesn't have `active` class
3. **Missing semantic HTML elements** - No `header` element found
4. **Navigation role missing** - No `nav[role="navigation"]` found
5. **Missing main element** - No `main` element found
6. **Footer links missing** - Contact link not found in footer
7. **Copyright text selector too broad** - Multiple elements match copyright selector
8. **Heading hierarchy issues** - Heading levels skip from h1 to h6
9. **Invalid URL navigation** - Double slash in URL (`//`) causing navigation errors
10. **Canonical links hidden** - Link elements exist but are not visible
11. **Favicon links hidden** - Link elements exist but are not visible
12. **Mobile menu timeout** - Elements not visible for interaction
13. **JavaScript disabled test fails** - No main element without JS

## Root Causes Analysis

### 1. Site Structure Issues
- The live site might be using different HTML structure than expected
- Elements might be using different CSS classes or selectors
- Some elements might be dynamically loaded

### 2. Test Selector Issues
- Hardcoded selectors don't match actual site structure
- Expecting specific Bootstrap classes that may not exist
- Visibility checks on `<link>` elements (which are never visible)

### 3. Navigation Path Issues
- URL construction bug causing `//` instead of `/`
- Need to handle empty path correctly

## Fix Strategy
1. Inspect actual site structure and update selectors
2. Fix URL construction bug
3. Adjust visibility expectations for meta elements
4. Update mobile menu detection logic
5. Make tests more resilient to different site structures