// AppLayout component - Main application layout with navigation and footer
import React, { useState, Component, ReactNode, ErrorInfo } from 'react';
import type { AppLayoutProps, NavigationItem, FooterLink } from '../../types/index';

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentPath = '', 
  isLoading = false,
  className = '' 
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const navigationItems: NavigationItem[] = [
    { path: '/calculator', label: 'Calculator' },
    { path: '/guide', label: 'Guide' },
    { path: '/help', label: 'Help' },
    { path: '/about', label: 'About' }
  ];

  const footerLinks: FooterLink[] = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/contact', label: 'Contact' }
  ];

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" aria-label="Loading">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-layout ${className}`}>
      {/* Header with Navigation */}
      <header className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm" role="banner">
        <div className="container-fluid">
          {/* Brand */}
          <a className="navbar-brand" href="/">
            <h1 className="h4 mb-0">
              <strong>CGT Tax Calculator</strong>
            </h1>
          </a>

          {/* Mobile Navigation Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleMobileNav}
            aria-expanded={isMobileNavOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Desktop Navigation */}
          <div className="collapse navbar-collapse d-none d-lg-block">
            <nav aria-label="Main navigation">
              <ul className="navbar-nav ms-auto" data-testid="desktop-nav">
                {navigationItems.map((item) => (
                  <li key={item.path} className="nav-item">
                    <a
                      className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
                      href={item.path}
                      aria-current={currentPath === item.path ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - Outside header for proper positioning */}
      {isMobileNavOpen && (
        <div className="d-lg-none bg-primary shadow-lg" data-testid="mobile-nav-menu">
          <nav aria-label="Mobile navigation" className="container-fluid py-2">
            {navigationItems.map((item) => (
              <a
                key={`mobile-${item.path}`}
                className={`d-block nav-link text-white py-2 ${currentPath === item.path ? 'active' : ''}`}
                href={item.path}
                onClick={() => setIsMobileNavOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="container-fluid flex-grow-1 py-4" role="main">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-light border-top py-4 mt-auto" role="contentinfo">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0 text-muted">
                © 2024 CGT Tax Calculator. All rights reserved.
              </p>
            </div>
            <div className="col-md-6">
              <ul className="list-inline mb-0 text-md-end">
                {footerLinks.map((link, index) => (
                  <li key={link.path} className="list-inline-item">
                    <a href={link.path} className="text-muted text-decoration-none">
                      {link.label}
                    </a>
                    {index < footerLinks.length - 1 && (
                      <span className="text-muted mx-2">|</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AppLayout Error Boundary caught an error:', error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-4" role="alert">
          <h4 className="alert-heading">Something went wrong!</h4>
          <p>
            We're sorry, but something unexpected happened. Please refresh the page and try again.
          </p>
          <hr />
          <p className="mb-0">
            If the problem persists, please contact our support team.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppLayout;