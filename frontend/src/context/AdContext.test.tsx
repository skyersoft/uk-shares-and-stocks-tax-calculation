import { act, renderHook } from '@testing-library/react';
import { AdProvider, useAd } from './AdContext';

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

// Mock window.innerWidth for screen size detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200,
});

describe('AdProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Reset window size
    (window as any).innerWidth = 1200;
  });

  it('provides initial state with default values', () => {
    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    expect(result.current.hasAdConsent).toBe(false);
    expect(result.current.screenSize).toBe('desktop');
    expect(typeof result.current.setAdConsent).toBe('function');
  });

  it('initializes consent from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    expect(result.current.hasAdConsent).toBe(true);
  });

  it('sets ad consent and updates localStorage', () => {
    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    act(() => {
      result.current.setAdConsent(true);
    });

    expect(result.current.hasAdConsent).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adConsentGiven', 'true');
  });

  it('detects mobile screen size', () => {
    (window as any).innerWidth = 500;

    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    expect(result.current.screenSize).toBe('mobile');
  });

  it('detects tablet screen size', () => {
    (window as any).innerWidth = 800;

    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    expect(result.current.screenSize).toBe('tablet');
  });

  it('detects desktop screen size', () => {
    (window as any).innerWidth = 1400;

    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    expect(result.current.screenSize).toBe('desktop');
  });

  it('throws error when useAd is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAd());
    }).toThrow('useAd must be used within an AdProvider');

    consoleSpy.mockRestore();
  });

  it('updates screen size on window resize', () => {
    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    // Initially desktop
    expect(result.current.screenSize).toBe('desktop');

    // Simulate window resize to mobile
    act(() => {
      (window as any).innerWidth = 600;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.screenSize).toBe('mobile');

    // Simulate window resize to tablet
    act(() => {
      (window as any).innerWidth = 900;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.screenSize).toBe('tablet');
  });

  it('handles consent changes correctly', () => {
    const { result } = renderHook(() => useAd(), {
      wrapper: AdProvider
    });

    // Start with false
    expect(result.current.hasAdConsent).toBe(false);

    // Set to true
    act(() => {
      result.current.setAdConsent(true);
    });

    expect(result.current.hasAdConsent).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adConsentGiven', 'true');

    // Set back to false
    act(() => {
      result.current.setAdConsent(false);
    });

    expect(result.current.hasAdConsent).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('adConsentGiven', 'false');
  });
});