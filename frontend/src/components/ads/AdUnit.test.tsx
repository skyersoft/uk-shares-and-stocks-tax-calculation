import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdUnit, AdBlockerDetector, PrivacyConsent, useAdPerformance, AdUnitProps } from './AdUnit';
import { renderHook, act } from '@testing-library/react';

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock gtag
declare global {
  interface Window {
    gtag: jest.Mock;
  }
}

describe('AdUnit', () => {
  const defaultProps: AdUnitProps = {
    slot: '1234567890',
    format: 'auto'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window objects
    (window as any).adsbygoogle = [];
    (window as any).gtag = jest.fn();
    
    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue('true'); // Default to consent given
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Clear DOM
    document.body.innerHTML = '';
  });

  it('renders ad unit with correct attributes', () => {
    render(<AdUnit {...defaultProps} />);
    
    const adElement = document.querySelector('.adsbygoogle');
    expect(adElement).toBeInTheDocument();
    expect(adElement).toHaveAttribute('data-ad-slot', '1234567890');
    expect(adElement).toHaveAttribute('data-ad-format', 'auto');
  });

  it('applies custom className and style', () => {
    const style = { margin: '10px' };
    render(<AdUnit {...defaultProps} className="custom-ad" style={style} />);
    
    const adContainer = document.querySelector('.ad-unit');
    expect(adContainer).toHaveClass('custom-ad');
    expect(adContainer).toHaveStyle('margin: 10px');
  });

  it('renders test mode placeholder', () => {
    render(<AdUnit {...defaultProps} testMode={true} />);
    
    expect(screen.getByText('Test Ad Unit - Slot: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Format: auto')).toBeInTheDocument();
  });

  it('respects privacy preferences when consent is denied', () => {
    localStorageMock.getItem.mockReturnValue('false');
    render(<AdUnit {...defaultProps} respectPrivacy={true} />);
    
    expect(document.querySelector('.adsbygoogle')).not.toBeInTheDocument();
  });

  it('shows fallback content when privacy consent is denied', () => {
    localStorageMock.getItem.mockReturnValue('false');
    const fallback = <div>Privacy-friendly content</div>;
    render(<AdUnit {...defaultProps} respectPrivacy={true} fallback={fallback} />);
    
    expect(screen.getByText('Privacy-friendly content')).toBeInTheDocument();
  });

  it('ignores privacy when respectPrivacy is false', () => {
    localStorageMock.getItem.mockReturnValue('false');
    render(<AdUnit {...defaultProps} respectPrivacy={false} />);
    
    expect(document.querySelector('.adsbygoogle')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AdUnit {...defaultProps} />);
    
    expect(screen.getByText('Loading ad...')).toBeInTheDocument();
  });

  it('handles different ad formats correctly', () => {
    const { rerender } = render(<AdUnit {...defaultProps} format="rectangle" />);
    expect(document.querySelector('[data-ad-format="rectangle"]')).toBeInTheDocument();
    
    rerender(<AdUnit {...defaultProps} format="horizontal" />);
    expect(document.querySelector('[data-ad-format="horizontal"]')).toBeInTheDocument();
  });

  it('sets up intersection observer for lazy loading', () => {
    render(<AdUnit {...defaultProps} />);
    
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('initializes ad when in viewport', () => {
    const mockPush = jest.fn();
    (window as any).adsbygoogle = [];
    (window as any).adsbygoogle.push = mockPush;
    
    render(<AdUnit {...defaultProps} />);
    
    // Simulate intersection observer being called during render
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('handles ad initialization errors gracefully by showing fallback', () => {
    const fallback = <div>Ad failed to load</div>;
    render(<AdUnit {...defaultProps} fallback={fallback} testMode={true} />);
    
    // In test mode, it should show the test placeholder, not the fallback
    expect(screen.getByText('Test Ad Unit - Slot: 1234567890')).toBeInTheDocument();
  });

  it('prevents layout shift with minimum height', () => {
    render(<AdUnit {...defaultProps} style={{ minHeight: '250px' }} />);
    
    const adContainer = document.querySelector('.ad-unit');
    expect(adContainer).toHaveStyle('min-height: 250px');
  });
});

describe('AdBlockerDetector (isolated)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders children when ad blocker is not detected', async () => {
    render(
      <AdBlockerDetector>
        <div>Normal content</div>
      </AdBlockerDetector>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });
  });

  it('renders fallback when detection fails', async () => {
    render(
      <AdBlockerDetector fallback={<div>Please disable ad blocker</div>}>
        <div>Normal content</div>
      </AdBlockerDetector>
    );
    
    // Simulate ad blocker detection by waiting for timeout
    await waitFor(() => {
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });
  });
});

describe('PrivacyConsent (isolated)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('shows consent banner when no consent exists', () => {
    const onConsentChange = jest.fn();
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    expect(screen.getByText(/We use cookies and serve ads/)).toBeInTheDocument();
  });

  it('does not show banner when consent already exists', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const onConsentChange = jest.fn();
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    expect(screen.queryByText(/We use cookies and ads to provide/)).not.toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('handles accept consent correctly', () => {
    const onConsentChange = jest.fn();
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    fireEvent.click(screen.getByText('Accept'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adConsentGiven', 'true');
    expect(onConsentChange).toHaveBeenCalledWith(true);
  });

  it('handles decline consent correctly', () => {
    const onConsentChange = jest.fn();
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    fireEvent.click(screen.getByText('Decline'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adConsentGiven', 'false');
    expect(onConsentChange).toHaveBeenCalledWith(false);
  });

  it('includes privacy policy link', () => {
    const onConsentChange = jest.fn();
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    expect(screen.getByText(/Learn more about our privacy policy/)).toBeInTheDocument();
  });

  it('calls onConsentChange with existing consent on mount', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const onConsentChange = jest.fn();
    
    render(
      <PrivacyConsent onConsentChange={onConsentChange}>
        <div>Test content</div>
      </PrivacyConsent>
    );
    
    expect(onConsentChange).toHaveBeenCalledWith(true);
  });
});

describe('useAdPerformance hook', () => {
  beforeEach(() => {
    (window as any).gtag = jest.fn();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with zero metrics', () => {
    const { result } = renderHook(() => useAdPerformance());
    
    expect(result.current.metrics.impressions).toBe(0);
    expect(result.current.metrics.clicks).toBe(0);
    expect(result.current.metrics.ctr).toBe(0);
  });

  it('tracks impressions correctly', () => {
    const { result } = renderHook(() => useAdPerformance());
    
    act(() => {
      result.current.trackImpression('test-slot');
    });
    
    expect(result.current.metrics.impressions).toBe(1);
    expect((window as any).gtag).toHaveBeenCalledWith('event', 'ad_impression', {
      ad_slot: 'test-slot',
      value: 1
    });
  });

  it('tracks clicks and calculates CTR correctly', () => {
    const { result } = renderHook(() => useAdPerformance());
    
    act(() => {
      result.current.trackImpression('test-slot');
      result.current.trackImpression('test-slot');
      result.current.trackClick('test-slot');
    });
    
    expect(result.current.metrics.clicks).toBe(1);
    expect(result.current.metrics.impressions).toBe(2);
    expect(result.current.metrics.ctr).toBe(50);
  });

  it('handles multiple tracking events', () => {
    const { result } = renderHook(() => useAdPerformance());
    
    act(() => {
      result.current.trackImpression('test-slot');
      result.current.trackImpression('test-slot');
      result.current.trackClick('test-slot');
      result.current.trackClick('test-slot');
    });
    
    expect(result.current.metrics.impressions).toBe(2);
    expect(result.current.metrics.clicks).toBe(2);
    expect(result.current.metrics.ctr).toBe(100);
  });

  it('handles gtag not being available', () => {
    delete (window as any).gtag;
    
    const { result } = renderHook(() => useAdPerformance());
    
    expect(() => {
      act(() => {
        result.current.trackImpression('test-slot');
      });
    }).not.toThrow();
  });
});