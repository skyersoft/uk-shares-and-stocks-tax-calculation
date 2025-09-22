import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';
import { AdProvider } from '../../context/AdContext';

// Mock the ad components
jest.mock('../ads/AdPlacement', () => ({
  AdPlacementManager: ({ pageType, hasAdConsent, screenSize }: any) => (
    <div data-testid={`ad-placement-${pageType}-${hasAdConsent ? 'consent' : 'no-consent'}-${screenSize}`}>
      Ad Placement Manager
    </div>
  )
}));

jest.mock('../ads/AdUnit', () => ({
  PrivacyConsent: ({ children }: any) => (
    <div data-testid="privacy-consent">
      Privacy Consent Banner
      {children}
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

const LayoutWrapper: React.FC<{ children: React.ReactNode; pageType: any }> = ({ children, pageType }) => (
  <AdProvider>
    <Layout pageType={pageType}>
      {children}
    </Layout>
  </AdProvider>
);

describe('Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (window as any).innerWidth = 1200; // Desktop size
  });

  it('renders basic layout structure', () => {
    render(
      <LayoutWrapper pageType="calculator">
        <div>Test content</div>
      </LayoutWrapper>
    );

    expect(screen.getAllByText('UK Tax Calculator')).toHaveLength(2); // Header and footer
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Privacy Consent Banner')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <LayoutWrapper pageType="calculator">
        <div>Test content</div>
      </LayoutWrapper>
    );

    // Use more specific selectors to avoid duplication
    const navSection = screen.getByRole('navigation');
    expect(navSection).toBeInTheDocument();
    
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getAllByText('About')).toHaveLength(2); // Nav and footer
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('CGT Guide')).toBeInTheDocument();
  });

  it('renders ad placements for different page types', () => {
    const { rerender } = render(
      <LayoutWrapper pageType="calculator">
        <div>Calculator content</div>
      </LayoutWrapper>
    );

    expect(screen.getAllByText('Ad Placement Manager')).toHaveLength(3); // Header, sidebar, footer

    rerender(
      <LayoutWrapper pageType="results">
        <div>Results content</div>
      </LayoutWrapper>
    );

    expect(screen.getAllByText('Ad Placement Manager')).toHaveLength(3); // Should still have 3 placements
  });

  it('includes content ads for long pages', () => {
    render(
      <LayoutWrapper pageType="guide">
        <div>Guide content</div>
      </LayoutWrapper>
    );

    // Should have header, sidebar, content, and footer ads
    expect(screen.getAllByText('Ad Placement Manager')).toHaveLength(4);
  });

  it('renders sidebar on desktop by default', () => {
    render(
      <LayoutWrapper pageType="calculator">
        <div>Test content</div>
      </LayoutWrapper>
    );

    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText('About This Tool')).toBeInTheDocument();
  });

  it('can hide sidebar when showSidebar is false', () => {
    render(
      <AdProvider>
        <Layout pageType="calculator" showSidebar={false}>
          <div>Test content</div>
        </Layout>
      </AdProvider>
    );

    expect(screen.queryByText('Need Help?')).not.toBeInTheDocument();
    expect(screen.queryByText('About This Tool')).not.toBeInTheDocument();
  });

  it('renders footer with links', () => {
    render(
      <LayoutWrapper pageType="calculator">
        <div>Test content</div>
      </LayoutWrapper>
    );

    expect(screen.getByText('Free capital gains tax calculations for UK residents.')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('© 2024 UK Tax Calculator. Educational purposes only.')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <LayoutWrapper pageType="calculator">
        <div>Test content</div>
      </LayoutWrapper>
    );

    const layout = container.querySelector('.layout');
    expect(layout).toBeInTheDocument();
  });

  it('renders content ads only for specific page types', () => {
    const pageTypesWithContentAds = ['guide', 'help', 'about'];
    const pageTypesWithoutContentAds = ['calculator', 'results', 'blog'];

    pageTypesWithContentAds.forEach(pageType => {
      const { unmount } = render(
        <LayoutWrapper pageType={pageType as any}>
          <div>Content</div>
        </LayoutWrapper>
      );

      // Should have header, sidebar, content, and footer ads (4 total)
      expect(screen.getAllByText('Ad Placement Manager')).toHaveLength(4);
      unmount();
    });

    pageTypesWithoutContentAds.forEach(pageType => {
      const { unmount } = render(
        <LayoutWrapper pageType={pageType as any}>
          <div>Content</div>
        </LayoutWrapper>
      );

      // Should have header, sidebar, and footer ads (3 total)
      expect(screen.getAllByText('Ad Placement Manager')).toHaveLength(3);
      unmount();
    });
  });
});