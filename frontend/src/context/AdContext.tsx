import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdContextType {
  hasAdConsent: boolean;
  setAdConsent: (consent: boolean) => void;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const useAd = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
};

interface AdProviderProps {
  children: ReactNode;
}

export const AdProvider: React.FC<AdProviderProps> = ({ children }) => {
  const [hasAdConsent, setHasAdConsent] = useState<boolean>(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Initialize consent from localStorage
  useEffect(() => {
    const consent = localStorage.getItem('adConsentGiven');
    if (consent !== null) {
      setHasAdConsent(consent === 'true');
    } else {
      // For development: default to true so we can see test ads
      setHasAdConsent(true);
    }
  }, []);

  // Handle screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1200) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setAdConsent = (consent: boolean) => {
    setHasAdConsent(consent);
    localStorage.setItem('adConsentGiven', consent.toString());
  };

  return (
    <AdContext.Provider value={{ hasAdConsent, setAdConsent, screenSize }}>
      {children}
    </AdContext.Provider>
  );
};

export default AdProvider;