import { render, screen } from '@testing-library/react';
import { 
  HeaderAd, 
  SidebarAd, 
  ContentAd, 
  FooterAd, 
  AdPlacementManager,
  NativeAd,
  useAdOptimization,
  AdPlacementProps 
} from './AdPlacement';
import { renderHook } from '@testing-library/react';

// Mock AdUnit component
jest.mock('./AdUnit', () => ({
  AdUnit: ({ slot, format, fallback, className }: any) => (
    <div data-testid={`ad-unit-${slot}`} className={className}>
      Mock Ad Unit - Slot: {slot}, Format: {format}
      {fallback && <div data-testid="ad-fallback">{fallback}</div>}
    </div>
  )
}));

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

describe('HeaderAd', () => {
  it('renders header ad when consent is given and not mobile', () => {
    render(<HeaderAd hasAdConsent={true} screenSize="desktop" />);
    
    expect(screen.getByTestId('ad-unit-1111111111')).toBeInTheDocument();
    expect(screen.getByText(/Mock Ad Unit - Slot: 1111111111, Format: horizontal/)).toBeInTheDocument();
  });

  it('does not render when consent is not given', () => {
    render(<HeaderAd hasAdConsent={false} screenSize="desktop" />);
    
    expect(screen.queryByTestId('ad-unit-1111111111')).not.toBeInTheDocument();
  });

  it('does not render on mobile screen', () => {
    render(<HeaderAd hasAdConsent={true} screenSize="mobile" />);
    
    expect(screen.queryByTestId('ad-unit-1111111111')).not.toBeInTheDocument();
  });

  it('renders on tablet and desktop', () => {
    const { rerender } = render(<HeaderAd hasAdConsent={true} screenSize="tablet" />);
    expect(screen.getByTestId('ad-unit-1111111111')).toBeInTheDocument();
    
    rerender(<HeaderAd hasAdConsent={true} screenSize="desktop" />);
    expect(screen.getByTestId('ad-unit-1111111111')).toBeInTheDocument();
  });

  it('includes fallback message', () => {
    render(<HeaderAd hasAdConsent={true} screenSize="desktop" />);
    
    expect(screen.getByText(/Support our free calculator/)).toBeInTheDocument();
  });
});

describe('SidebarAd', () => {
  it('renders sidebar ad when consent is given and not mobile', () => {
    render(<SidebarAd hasAdConsent={true} screenSize="desktop" />);
    
    expect(screen.getByTestId('ad-unit-2222222222')).toBeInTheDocument();
    expect(screen.getByText(/Mock Ad Unit - Slot: 2222222222, Format: rectangle/)).toBeInTheDocument();
  });

  it('does not render when consent is not given', () => {
    render(<SidebarAd hasAdConsent={false} screenSize="desktop" />);
    
    expect(screen.queryByTestId('ad-unit-2222222222')).not.toBeInTheDocument();
  });

  it('does not render on mobile', () => {
    render(<SidebarAd hasAdConsent={true} screenSize="mobile" />);
    
    expect(screen.queryByTestId('ad-unit-2222222222')).not.toBeInTheDocument();
  });

  it('includes advertisement label', () => {
    render(<SidebarAd hasAdConsent={true} screenSize="desktop" />);
    
    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });

  it('includes supportive fallback content', () => {
    render(<SidebarAd hasAdConsent={true} screenSize="desktop" />);
    
    expect(screen.getByText(/Your support helps us provide free tax calculations/)).toBeInTheDocument();
  });
});

describe('ContentAd', () => {
  it('renders content ad when consent is given', () => {
    render(<ContentAd hasAdConsent={true} />);
    
    expect(screen.getByTestId('ad-unit-3333333333')).toBeInTheDocument();
    expect(screen.getByText(/Mock Ad Unit - Slot: 3333333333, Format: auto/)).toBeInTheDocument();
  });

  it('does not render when consent is not given', () => {
    render(<ContentAd hasAdConsent={false} />);
    
    expect(screen.queryByTestId('ad-unit-3333333333')).not.toBeInTheDocument();
  });

  it('includes advertisement label', () => {
    render(<ContentAd hasAdConsent={true} />);
    
    expect(screen.getByText('Advertisement')).toBeInTheDocument();
  });

  it('does not include fallback to avoid content disruption', () => {
    render(<ContentAd hasAdConsent={true} />);
    
    expect(screen.queryByTestId('ad-fallback')).not.toBeInTheDocument();
  });
});

describe('FooterAd', () => {
  it('renders footer ad when consent is given', () => {
    render(<FooterAd hasAdConsent={true} />);
    
    expect(screen.getByTestId('ad-unit-9999999999')).toBeInTheDocument();
    expect(screen.getByText(/Mock Ad Unit - Slot: 9999999999, Format: horizontal/)).toBeInTheDocument();
  });

  it('does not render when consent is not given', () => {
    render(<FooterAd hasAdConsent={false} />);
    
    expect(screen.queryByTestId('ad-unit-9999999999')).not.toBeInTheDocument();
  });

  it('includes thank you fallback message', () => {
    render(<FooterAd hasAdConsent={true} />);
    
    expect(screen.getByText(/Thank you for supporting our free tax calculator/)).toBeInTheDocument();
  });

  it('has proper styling with border-top', () => {
    render(<FooterAd hasAdConsent={true} />);
    
    const container = screen.getByTestId('ad-unit-9999999999').closest('.footer-ad-container');
    expect(container).toHaveClass('border-top');
  });
});

describe('AdPlacementManager', () => {
  const defaultProps: AdPlacementProps = {
    pageType: 'calculator',
    hasAdConsent: true,
    screenSize: 'desktop'
  };

  it('renders ads for calculator page', () => {
    render(<AdPlacementManager {...defaultProps} />);
    
    // Should render calculator page ads
    expect(screen.getByTestId('ad-unit-1111111111')).toBeInTheDocument(); // header
    expect(screen.getByTestId('ad-unit-2222222222')).toBeInTheDocument(); // sidebar
    expect(screen.getByTestId('ad-unit-3333333333')).toBeInTheDocument(); // content-top
  });

  it('respects screen size restrictions', () => {
    render(<AdPlacementManager {...defaultProps} screenSize="mobile" />);
    
    // Header ad requires tablet+, sidebar requires desktop+
    expect(screen.queryByTestId('ad-unit-1111111111')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-unit-2222222222')).not.toBeInTheDocument();
    // Content ad has no restrictions
    expect(screen.getByTestId('ad-unit-3333333333')).toBeInTheDocument();
  });

  it('handles tablet screen size correctly', () => {
    render(<AdPlacementManager {...defaultProps} screenSize="tablet" />);
    
    // Header ad works on tablet+
    expect(screen.getByTestId('ad-unit-1111111111')).toBeInTheDocument();
    // Sidebar requires desktop+
    expect(screen.queryByTestId('ad-unit-2222222222')).not.toBeInTheDocument();
    // Content ad has no restrictions
    expect(screen.getByTestId('ad-unit-3333333333')).toBeInTheDocument();
  });

  it('does not render ads without consent', () => {
    render(<AdPlacementManager {...defaultProps} hasAdConsent={false} />);
    
    expect(screen.queryByTestId('ad-unit-1111111111')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-unit-2222222222')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-unit-3333333333')).not.toBeInTheDocument();
  });

  it('renders different ads for different page types', () => {
    const { rerender } = render(<AdPlacementManager {...defaultProps} pageType="results" />);
    
    expect(screen.getByTestId('ad-unit-4444444444')).toBeInTheDocument(); // results-top
    expect(screen.getByTestId('ad-unit-5555555555')).toBeInTheDocument(); // results-bottom
    
    rerender(<AdPlacementManager {...defaultProps} pageType="help" />);
    expect(screen.getByTestId('ad-unit-6666666666')).toBeInTheDocument(); // help-sidebar
  });

  it('sorts ads by priority', () => {
    render(<AdPlacementManager {...defaultProps} pageType="calculator" />);
    
    const adElements = screen.getAllByTestId(/ad-unit-/);
    const slots = adElements.map(el => el.getAttribute('data-testid'));
    
    // Should be sorted by priority: header (1), sidebar (2), content-top (3)
    expect(slots).toEqual(['ad-unit-1111111111', 'ad-unit-2222222222', 'ad-unit-3333333333']);
  });

  it('handles unknown page types gracefully', () => {
    render(<AdPlacementManager {...defaultProps} pageType={"unknown" as any} />);
    
    // Should not render any ads for unknown page type
    expect(screen.queryByTestId(/ad-unit-/)).not.toBeInTheDocument();
  });

  it('includes fallback messages for all ads', () => {
    render(<AdPlacementManager {...defaultProps} />);
    
    expect(screen.getAllByText(/Ad space - helps keep our service free/)).toHaveLength(3);
  });
});

describe('NativeAd', () => {
  it('renders native ad when consent is given', () => {
    render(<NativeAd hasAdConsent={true} />);
    
    expect(screen.getByTestId('ad-unit-1212121212')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Ad')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<NativeAd hasAdConsent={true} title="Sponsored Content" />);
    
    expect(screen.getByText('Sponsored Content')).toBeInTheDocument();
  });

  it('does not render when consent is not given', () => {
    render(<NativeAd hasAdConsent={false} />);
    
    expect(screen.queryByTestId('ad-unit-1212121212')).not.toBeInTheDocument();
  });

  it('includes premium features fallback', () => {
    render(<NativeAd hasAdConsent={true} />);
    
    expect(screen.getByText(/Consider our premium features for advanced tax optimization/)).toBeInTheDocument();
  });

  it('has proper card styling', () => {
    render(<NativeAd hasAdConsent={true} />);
    
    const card = screen.getByTestId('ad-unit-1212121212').closest('.card');
    expect(card).toHaveClass('border-0', 'bg-light');
  });
});

describe('useAdOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with variant A or B', () => {
    const { result } = renderHook(() => useAdOptimization());
    
    expect(['A', 'B']).toContain(result.current.variant);
  });

  it('uses saved variant from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('B');
    
    const { result } = renderHook(() => useAdOptimization());
    
    expect(result.current.variant).toBe('B');
  });

  it('saves new variant to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderHook(() => useAdOptimization());
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adVariant', expect.stringMatching(/^[AB]$/));
  });

  it('tracks variant performance', () => {
    // Mock gtag
    const mockGtag = jest.fn();
    Object.defineProperty(window, 'gtag', {
      writable: true,
      value: mockGtag
    });

    localStorageMock.getItem.mockReturnValue('A');
    
    const { result } = renderHook(() => useAdOptimization());
    
    result.current.trackVariantPerformance('click_rate', 0.05);
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'ab_test_metric', {
      variant: 'A',
      metric: 'click_rate',
      value: 0.05
    });
  });

  it('handles missing gtag gracefully', () => {
    delete (window as any).gtag;
    localStorageMock.getItem.mockReturnValue('A');
    
    const { result } = renderHook(() => useAdOptimization());
    
    expect(() => {
      result.current.trackVariantPerformance('click_rate', 0.05);
    }).not.toThrow();
  });
});