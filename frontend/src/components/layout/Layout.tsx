import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AffiliateDisclosure } from '../affiliate';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className = ''
}) => {
  const location = useLocation();
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

  const isLandingPage = location.pathname === '/' || location.pathname === '';

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
    <div className={`layout ${className} ${isLandingPage ? 'layout-landing' : ''}`}>

      {/* Header with navigation and header ad */}
      <header className="header-section">
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
          <div className="container-fluid">
            <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeNavbar}>
              <i className="bi bi-calculator-fill me-2 text-primary"></i>
              <span className="fw-bold">UK Tax Calculator</span>
            </Link>

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
                  <Link className="nav-link" to="/calculator" onClick={closeNavbar}>Calculator</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about" onClick={closeNavbar}>About</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/help" onClick={closeNavbar}>Help</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/guide" onClick={closeNavbar}>CGT Guide</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/blog" onClick={closeNavbar}>Blog</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/affiliate-demo" onClick={closeNavbar}>
                    <span className="badge bg-primary me-1">New</span>
                    Resources
                  </Link>
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
      </header>

      {/* Main content area */}
      <main className="main-content">
        {isLandingPage ? (
          <>{children}</>
        ) : (
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="content-wrapper py-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer bg-dark text-light py-4 mt-5">

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
                <Link to="/privacy" className="text-light text-decoration-none me-3">Privacy</Link>
                <Link to="/terms" className="text-light text-decoration-none me-3">Terms</Link>
                <Link to="/about" className="text-light text-decoration-none me-3">About</Link>
                <a href="https://www.reddit.com/user/OpinionActual9772/" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none">Contact</a>
              </div>
              <p className="small mt-2 mb-0 text-muted">
                © 2024 UK Tax Calculator. Educational purposes only.
              </p>
            </div>
          </div>

          {/* Global Affiliate Disclosure */}
          <div className="row mt-3 pt-3 border-top border-secondary">
            <div className="col-12">
              <AffiliateDisclosure
                style="footer"
                className="text-light"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
