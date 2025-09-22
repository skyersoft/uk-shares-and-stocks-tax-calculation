import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { AdPlacementManager } from '../ads/AdPlacement';
import { PrivacyConsent } from '../ads/AdUnit';
import { useAd } from '../../context/AdContext';

interface LayoutProps {
  children: ReactNode;
  pageType: 'calculator' | 'results' | 'help' | 'about' | 'blog' | 'guide';
  showSidebar?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  pageType,
  showSidebar = true,
  className = ''
}) => {
  const { hasAdConsent, setAdConsent, screenSize } = useAd();
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

  const toggleNavbar = () => {
    setIsNavbarExpanded(!isNavbarExpanded);
  };

  const closeNavbar = () => {
    setIsNavbarExpanded(false);
  };

  // Close navbar when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: Event) => {
      const target = event.target as Element;
      if (isNavbarExpanded && !target.closest('.navbar')) {
        setIsNavbarExpanded(false);
      }
    };

    if (isNavbarExpanded) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [isNavbarExpanded]);

  return (
    <div className={`layout ${className}`}>
      {/* Privacy consent banner */}
      <PrivacyConsent onConsentChange={setAdConsent}>
        <div className="d-none">Consent managed by banner</div>
      </PrivacyConsent>

      {/* Header with navigation and header ad */}
      <header className="header-section">
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <i className="bi bi-calculator-fill me-2 text-primary"></i>
              <span className="fw-bold">UK Tax Calculator</span>
            </a>
            
            <button 
              className="navbar-toggler" 
              type="button" 
              onClick={toggleNavbar}
              aria-controls="navbarNav"
              aria-expanded={isNavbarExpanded}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className={`collapse navbar-collapse ${isNavbarExpanded ? 'show' : ''}`} id="navbarNav">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <a className="nav-link" href="#calculator" onClick={closeNavbar}>Calculator</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about" onClick={closeNavbar}>About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#help" onClick={closeNavbar}>Help</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#guide" onClick={closeNavbar}>CGT Guide</a>
                </li>
              </ul>
              
              <div className="d-flex">
                <span className="navbar-text small text-muted">
                  Free UK Tax Calculator
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Header Ad Placement */}
        <AdPlacementManager 
          pageType={pageType} 
          hasAdConsent={hasAdConsent} 
          screenSize={screenSize} 
        />
      </header>

      {/* Main content area */}
      <main className="main-content">
        <div className="container-fluid">
          <div className="row">
            {/* Main content column */}
            <div className={`col ${showSidebar && screenSize !== 'mobile' ? 'col-lg-9' : 'col-12'}`}>
              <div className="content-wrapper py-4">
                {children}
                
                {/* Content Ad for long pages */}
                {pageType === 'guide' || pageType === 'help' || pageType === 'about' ? (
                  <div className="content-ad-wrapper my-5">
                    <AdPlacementManager 
                      pageType={pageType} 
                      hasAdConsent={hasAdConsent} 
                      screenSize={screenSize} 
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sidebar with ads */}
            {showSidebar && screenSize !== 'mobile' && (
              <div className="col-lg-3">
                <aside className="sidebar py-4">
                  {/* Sidebar Ad */}
                  <AdPlacementManager 
                    pageType={pageType} 
                    hasAdConsent={hasAdConsent} 
                    screenSize={screenSize} 
                  />
                  
                  {/* Additional sidebar content */}
                  <div className="sidebar-content mt-4">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">Need Help?</h6>
                        <p className="card-text small">
                          Check our comprehensive guide for UK capital gains tax calculations.
                        </p>
                        <a href="/help" className="btn btn-sm btn-outline-primary">
                          Get Help
                        </a>
                      </div>
                    </div>
                    
                    <div className="card mt-3">
                      <div className="card-body">
                        <h6 className="card-title">About This Tool</h6>
                        <p className="card-text small">
                          Free, accurate UK tax calculations for Interactive Brokers users.
                        </p>
                        <a href="/about" className="btn btn-sm btn-outline-secondary">
                          Learn More
                        </a>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer with footer ad */}
      <footer className="footer bg-dark text-light py-4 mt-5">
        {/* Footer Ad */}
        <div className="footer-ad-section">
          <AdPlacementManager 
            pageType={pageType} 
            hasAdConsent={hasAdConsent} 
            screenSize={screenSize} 
          />
        </div>
        
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6>UK Tax Calculator</h6>
              <p className="small mb-0">
                Free capital gains tax calculations for UK residents.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="footer-links">
                <a href="/privacy" className="text-light text-decoration-none me-3">Privacy</a>
                <a href="/terms" className="text-light text-decoration-none me-3">Terms</a>
                <a href="/about" className="text-light text-decoration-none">About</a>
              </div>
              <p className="small mt-2 mb-0 text-muted">
                © 2024 UK Tax Calculator. Educational purposes only.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;