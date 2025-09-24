import React from 'react';
import { CalculationProvider } from './context/CalculationContext';
import { ToastProvider } from './components/ui/ToastContext';
import { Layout } from './components/layout/Layout';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import GuidePage from './pages/GuidePage';
import BlogPage from './pages/BlogPage';
import AffiliateDemo from './pages/AffiliateDemo';

const App: React.FC = () => {
  console.log('[SPA] App component rendering...');
  const [currentRoute, setCurrentRoute] = React.useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    return hash || 'calculator';
  });
  
  // Listen for hash changes
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'calculator';
      console.log('[SPA] Hash changed to:', hash);
      setCurrentRoute(hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  console.log('[SPA] Current route:', currentRoute);
  
  const renderContent = () => {
    // Normalize route patterns for switch simplicity
    if (currentRoute.startsWith('blog')) {
      return <BlogPage />;
    }
    if (currentRoute.startsWith('results')) {
      return <ResultsPage />;
    }
    switch (currentRoute) {
      case 'about':
        return <AboutPage />;
      case 'help':
        return <HelpPage />;
      case 'guide':
        return <GuidePage />;
      case 'affiliate-demo':
        return <AffiliateDemo />;
      default:
        return <CalculatorPage />;
    }
  };
  
  return (
    <ToastProvider position="top-end">
      <CalculationProvider>
        <div className="min-vh-100 bg-light">
          <Layout>
            {renderContent()}
          </Layout>
        </div>
      </CalculationProvider>
    </ToastProvider>
  );
}

export default App;
