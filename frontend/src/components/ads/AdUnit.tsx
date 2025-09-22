import React, { useEffect, useState, useRef } from 'react';

export interface AdUnitProps {
  /** AdSense slot ID */
  slot: string;
  /** Ad format (rectangle, banner, square, etc.) */
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  /** Layout key for responsive ads */
  layoutKey?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Custom CSS class */
  className?: string;
  /** Whether to respect user privacy preferences */
  respectPrivacy?: boolean;
  /** Fallback content when ad fails to load */
  fallback?: React.ReactNode;
  /** Test mode for development */
  testMode?: boolean;
}

export interface AdBlockerDetectorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface PrivacyConsentProps {
  onConsentChange: (hasConsent: boolean) => void;
  children: React.ReactNode;
}

declare global {
  interface Window {
    adsbygoogle: any[];
    googletag: any;
  }
}

/**
 * Google AdSense component with privacy compliance and performance optimization
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  format = 'auto',
  layoutKey,
  style,
  className = '',
  respectPrivacy = true,
  fallback,
  testMode = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check privacy consent from localStorage
  useEffect(() => {
    if (!respectPrivacy) {
      setPrivacyConsent(true);
      return;
    }

    const consent = localStorage.getItem('adConsentGiven');
    setPrivacyConsent(consent === 'true');
  }, [respectPrivacy]);

  // Initialize AdSense when component is in viewport
  useEffect(() => {
    if (!privacyConsent || testMode) return;

    const initializeAd = () => {
      try {
        // Ensure adsbygoogle is available
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          window.adsbygoogle.push({});
          setAdLoaded(true);
        }
      } catch (error) {
        console.error('AdSense initialization error:', error);
        setAdError(true);
      }
    };

    // Use Intersection Observer for lazy loading
    if (adRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              initializeAd();
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: '100px', // Load ad 100px before it comes into view
        }
      );

      observerRef.current.observe(adRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [privacyConsent, testMode]);

  // Don't render ad if no privacy consent
  if (respectPrivacy && !privacyConsent) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // Test mode - render placeholder
  if (testMode) {
    return (
      <div 
        ref={adRef}
        className={`ad-unit-test ${className}`}
        style={{
          ...style,
          backgroundColor: '#f0f0f0',
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div>Test Ad Unit - Slot: {slot}</div>
        <div>Format: {format}</div>
      </div>
    );
  }

  // Error state
  if (adError && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={`ad-unit ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          minHeight: '90px', // Prevent layout shift
        }}
        data-ad-client="ca-pub-2934063890442014"
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
      {!adLoaded && !adError && (
        <div className="ad-loading" style={{ 
          height: '90px', 
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          Loading ad...
        </div>
      )}
    </div>
  );
};

/**
 * Ad Blocker Detection Component
 */
export const AdBlockerDetector: React.FC<AdBlockerDetectorProps> = ({
  children,
  fallback
}) => {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);

  useEffect(() => {
    // Simple ad blocker detection
    const detectAdBlocker = async () => {
      try {
        // Try to load a small ad script
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.position = 'absolute';
        testAd.style.left = '-9999px';
        document.body.appendChild(testAd);

        setTimeout(() => {
          const isBlocked = testAd.offsetHeight === 0;
          setAdBlockerDetected(isBlocked);
          document.body.removeChild(testAd);
        }, 100);
      } catch (error) {
        // If there's an error, assume ad blocker is present
        setAdBlockerDetected(true);
      }
    };

    detectAdBlocker();
  }, []);

  if (adBlockerDetected && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Privacy Consent Management
 */
export const PrivacyConsent: React.FC<PrivacyConsentProps> = ({
  onConsentChange,
  children
}) => {
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('adConsentGiven');
    if (consent === null) {
      setShowConsent(true);
    } else {
      const consentValue = consent === 'true';
      setHasConsent(consentValue);
      onConsentChange(consentValue);
    }
  }, [onConsentChange]);

  const handleConsent = (consent: boolean) => {
    localStorage.setItem('adConsentGiven', consent.toString());
    setHasConsent(consent);
    setShowConsent(false);
    onConsentChange(consent);
  };

  if (showConsent) {
    return (
      <div className="privacy-consent-banner" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        zIndex: 9999,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <p className="mb-2">
                We use cookies and serve ads to fund our free tax calculator. 
                Your privacy is important to us.
              </p>
              <small>
                <a href="/privacy" className="text-light">Learn more about our privacy policy</a>
              </small>
            </div>
            <div className="col-md-4 text-end">
              <button 
                className="btn btn-outline-light me-2"
                onClick={() => handleConsent(false)}
              >
                Decline
              </button>
              <button 
                className="btn btn-light"
                onClick={() => handleConsent(true)}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Ad Performance Monitor
 */
export const useAdPerformance = () => {
  const [metrics, setMetrics] = useState({
    impressions: 0,
    clicks: 0,
    revenue: 0,
    ctr: 0,
    fillRate: 0
  });

  const trackImpression = (adSlot: string) => {
    // Track ad impression
    setMetrics(prev => ({
      ...prev,
      impressions: prev.impressions + 1
    }));

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ad_impression', {
        ad_slot: adSlot,
        value: 1
      });
    }
  };

  const trackClick = (adSlot: string) => {
    // Track ad click
    setMetrics(prev => ({
      ...prev,
      clicks: prev.clicks + 1,
      ctr: ((prev.clicks + 1) / prev.impressions) * 100
    }));

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ad_click', {
        ad_slot: adSlot,
        value: 1
      });
    }
  };

  return {
    metrics,
    trackImpression,
    trackClick
  };
};

/**
 * Strategic Ad Placement Hook
 */
export const useAdPlacement = () => {
  const [placements, setPlacements] = useState({
    headerBanner: true,
    sidebarRectangle: true,
    contentBanner: true,
    footerBanner: true
  });

  const optimizePlacements = (performanceData: any) => {
    // A/B testing and optimization logic
    // This would integrate with your analytics to optimize ad positions
    console.log('Optimizing ad placements based on performance:', performanceData);
  };

  return {
    placements,
    optimizePlacements
  };
};

export default AdUnit;