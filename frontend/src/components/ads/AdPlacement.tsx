import React from 'react';
import { AdUnit } from './AdUnit';

export interface AdPlacementProps {
  /** Type of page for contextual ad placement */
  pageType: 'calculator' | 'results' | 'help' | 'about' | 'blog' | 'guide';
  /** Whether user has consented to ads */
  hasAdConsent: boolean;
  /** Current screen size for responsive ads */
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

export interface AdSlotConfig {
  slot: string;
  format: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  position: string;
  priority: number;
  minScreenSize?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Strategic ad placement configuration
 */
const AD_SLOTS: Record<string, AdSlotConfig[]> = {
  calculator: [
    {
      slot: '1111111111',
      format: 'horizontal',
      position: 'header',
      priority: 1,
      minScreenSize: 'tablet'
    },
    {
      slot: '2222222222',
      format: 'rectangle',
      position: 'sidebar',
      priority: 2,
      minScreenSize: 'desktop'
    },
    {
      slot: '3333333333',
      format: 'auto',
      position: 'content-top',
      priority: 3
    }
  ],
  results: [
    {
      slot: '4444444444',
      format: 'rectangle',
      position: 'results-top',
      priority: 1,
      minScreenSize: 'tablet'
    },
    {
      slot: '5555555555',
      format: 'horizontal',
      position: 'results-bottom',
      priority: 2
    }
  ],
  help: [
    {
      slot: '6666666666',
      format: 'rectangle',
      position: 'help-sidebar',
      priority: 1,
      minScreenSize: 'desktop'
    }
  ],
  about: [
    {
      slot: '7777777777',
      format: 'horizontal',
      position: 'about-content',
      priority: 1
    }
  ],
  blog: [
    {
      slot: '8888888888',
      format: 'rectangle',
      position: 'blog-sidebar',
      priority: 1,
      minScreenSize: 'tablet'
    },
    {
      slot: '9999999999',
      format: 'horizontal',
      position: 'blog-footer',
      priority: 2
    }
  ],
  guide: [
    {
      slot: '1010101010',
      format: 'rectangle',
      position: 'guide-sidebar',
      priority: 1,
      minScreenSize: 'desktop'
    },
    {
      slot: '1111101111',
      format: 'auto',
      position: 'guide-content',
      priority: 2
    }
  ]
};

/**
 * Header banner ad placement
 */
export const HeaderAd: React.FC<Pick<AdPlacementProps, 'hasAdConsent' | 'screenSize'>> = ({
  hasAdConsent,
  screenSize
}) => {
  if (!hasAdConsent || screenSize === 'mobile') {
    return null;
  }

  return (
    <div className="header-ad-container mb-3">
      <AdUnit
        slot="1111111111"
        format="horizontal"
        className="d-flex justify-content-center"
        fallback={
          <div className="text-center py-3 text-muted">
            <small>Support our free calculator - ads help keep this service running!</small>
          </div>
        }
      />
    </div>
  );
};

/**
 * Sidebar ad placement
 */
export const SidebarAd: React.FC<Pick<AdPlacementProps, 'hasAdConsent' | 'screenSize'>> = ({
  hasAdConsent,
  screenSize
}) => {
  if (!hasAdConsent || screenSize === 'mobile') {
    return null;
  }

  return (
    <div className="sidebar-ad-container mb-4">
      <div className="text-center mb-2">
        <small className="text-muted">Advertisement</small>
      </div>
      <AdUnit
        slot="2222222222"
        format="rectangle"
        style={{ minHeight: '250px' }}
        fallback={
          <div className="border rounded p-3 text-center text-muted" style={{ minHeight: '250px' }}>
            <div className="d-flex align-items-center justify-content-center h-100">
              <div>
                <i className="bi bi-heart fs-3 d-block mb-2"></i>
                <small>Your support helps us provide free tax calculations</small>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

/**
 * Content ad placement (non-intrusive)
 */
export const ContentAd: React.FC<Pick<AdPlacementProps, 'hasAdConsent'>> = ({ hasAdConsent }) => {
  if (!hasAdConsent) {
    return null;
  }

  return (
    <div className="content-ad-container my-4">
      <div className="row">
        <div className="col-12">
          <div className="text-center mb-2">
            <small className="text-muted">Advertisement</small>
          </div>
          <AdUnit
            slot="3333333333"
            format="auto"
            className="d-flex justify-content-center"
            testMode={true}
            fallback={null} // No fallback for content ads to avoid disruption
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Footer ad placement
 */
export const FooterAd: React.FC<Pick<AdPlacementProps, 'hasAdConsent'>> = ({ hasAdConsent }) => {
  if (!hasAdConsent) {
    return null;
  }

  return (
    <div className="footer-ad-container mt-4 pt-4 border-top">
      <div className="text-center mb-2">
        <small className="text-muted">Advertisement</small>
      </div>
      <AdUnit
        slot="9999999999"
        format="horizontal"
        className="d-flex justify-content-center"
        fallback={
          <div className="text-center py-2 text-muted">
            <small>Thank you for supporting our free tax calculator!</small>
          </div>
        }
      />
    </div>
  );
};

/**
 * Strategic ad placement manager
 */
export const AdPlacementManager: React.FC<AdPlacementProps> = ({
  pageType,
  hasAdConsent,
  screenSize
}) => {
  const getAdSlotsForPage = (page: string): AdSlotConfig[] => {
    return AD_SLOTS[page] || [];
  };

  const shouldShowAd = (config: AdSlotConfig): boolean => {
    if (!hasAdConsent) return false;
    
    if (config.minScreenSize) {
      const screenOrder = { mobile: 0, tablet: 1, desktop: 2 };
      const requiredLevel = screenOrder[config.minScreenSize];
      const currentLevel = screenOrder[screenSize];
      return currentLevel >= requiredLevel;
    }
    
    return true;
  };

  const adSlots = getAdSlotsForPage(pageType);
  
  return (
    <div className="ad-placement-manager">
      {adSlots
        .filter(shouldShowAd)
        .sort((a, b) => a.priority - b.priority)
        .map((config, index) => (
          <div key={`${config.slot}-${index}`} className={`ad-position-${config.position}`}>
            <AdUnit
              slot={config.slot}
              format={config.format}
              className="strategic-ad"
              testMode={true}
              fallback={
                <div className="ad-fallback text-center py-2 text-muted">
                  <small>Ad space - helps keep our service free</small>
                </div>
              }
            />
          </div>
        ))}
    </div>
  );
};

/**
 * Native ad component that blends with content
 */
export const NativeAd: React.FC<{
  hasAdConsent: boolean;
  title?: string;
}> = ({ hasAdConsent, title = 'Recommended' }) => {
  if (!hasAdConsent) {
    return null;
  }

  return (
    <div className="native-ad-container">
      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="card-title mb-0 text-muted">{title}</h6>
            <small className="text-muted">Ad</small>
          </div>
          <AdUnit
            slot="1212121212"
            format="auto"
            className="native-ad-content"
            fallback={
              <div className="text-center py-3">
                <div className="mb-2">
                  <i className="bi bi-info-circle text-muted"></i>
                </div>
                <small className="text-muted">
                  Consider our premium features for advanced tax optimization
                </small>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

/**
 * A/B testing hook for ad optimization
 */
export const useAdOptimization = () => {
  const [variant, setVariant] = React.useState<'A' | 'B'>('A');
  
  React.useEffect(() => {
    // Simple A/B testing - in production, this would integrate with your analytics
    const savedVariant = localStorage.getItem('adVariant') as 'A' | 'B' | null;
    if (savedVariant) {
      setVariant(savedVariant);
    } else {
      const newVariant = Math.random() > 0.5 ? 'A' : 'B';
      setVariant(newVariant);
      localStorage.setItem('adVariant', newVariant);
    }
  }, []);

  const trackVariantPerformance = (metric: string, value: number) => {
    // Track performance metrics for A/B testing
    console.log(`Variant ${variant} - ${metric}: ${value}`);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_metric', {
        variant,
        metric,
        value
      });
    }
  };

  return {
    variant,
    trackVariantPerformance
  };
};

export default AdPlacementManager;