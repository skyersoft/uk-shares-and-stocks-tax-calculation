import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../utils/analytics';

/**
 * Component that tracks page views in Google Analytics whenever the route changes.
 * This should be placed inside the Router component.
 */
export const PageTracker = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Construct full path including query params
        const fullPath = pathname + search;

        // Get page title (fallback to document title or path)
        const pageTitle = document.title || pathname;

        // Track page view
        trackPageView(fullPath, pageTitle);
    }, [pathname, search]);

    return null;
};
