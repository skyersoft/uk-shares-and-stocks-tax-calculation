import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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
  <BrowserRouter>
    <AdProvider>
      <Layout pageType={pageType}>
        {children}
      </Layout>
    </AdProvider>
  </BrowserRouter>
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
    // Privacy Consent is no longer part of Layout
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
});