/**
 * Google Analytics 4 Event Tracking Utilities
 * 
 * This module provides type-safe wrappers for tracking events in Google Analytics 4.
 * All events are sent using the gtag.js library loaded in index.html.
 */

// Extend Window interface to include gtag
declare global {
    interface Window {
        gtag?: (
            command: 'config' | 'event' | 'js' | 'set',
            targetId: string | Date,
            config?: Record<string, any>
        ) => void;
        dataLayer?: any[];
    }
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(
    eventName: string,
    eventParams?: Record<string, any>
): void {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);
    }
}

/**
 * Track file upload event
 */
export function trackFileUpload(fileCount: number, fileType: string): void {
    trackEvent('file_upload', {
        file_count: fileCount,
        file_type: fileType,
    });
}

/**
 * Track calculation start
 */
export function trackCalculationStart(
    taxYear: string,
    analysisType: string,
    fileCount: number
): void {
    trackEvent('calculation_start', {
        tax_year: taxYear,
        analysis_type: analysisType,
        file_count: fileCount,
    });
}

/**
 * Track calculation success
 */
export function trackCalculationSuccess(
    taxYear: string,
    transactionCount: number,
    processingTime: number,
    disposalCount: number
): void {
    trackEvent('calculation_success', {
        tax_year: taxYear,
        transaction_count: transactionCount,
        processing_time_ms: processingTime,
        disposal_count: disposalCount,
    });
}

/**
 * Track calculation error
 */
export function trackCalculationError(
    errorType: string,
    errorMessage: string
): void {
    trackEvent('calculation_error', {
        error_type: errorType,
        error_message: errorMessage,
    });
}

/**
 * Track broker detection
 */
export function trackBrokerDetection(
    broker: string,
    confidence: number,
    fileType: string
): void {
    trackEvent('broker_detected', {
        broker,
        confidence,
        file_type: fileType,
    });
}

/**
 * Track CTA (Call-to-Action) click
 */
export function trackCTAClick(
    ctaName: string,
    ctaLocation: string
): void {
    trackEvent('cta_click', {
        cta_name: ctaName,
        cta_location: ctaLocation,
    });
}

/**
 * Track page view (manual tracking for SPA)
 */
export function trackPageView(pagePath: string, pageTitle: string): void {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-Y32G88HFJ4', {
            page_path: pagePath,
            page_title: pageTitle,
        });
    }
}

/**
 * Track feature engagement
 */
export function trackFeatureEngagement(featureName: string): void {
    trackEvent('feature_engagement', {
        feature_name: featureName,
    });
}

/**
 * Track help article view
 */
export function trackHelpArticleView(articleTitle: string): void {
    trackEvent('help_article_view', {
        article_title: articleTitle,
    });
}
