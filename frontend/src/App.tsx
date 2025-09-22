import React from 'react';
import { CalculationProvider } from './context/CalculationContext';
import { ToastProvider } from './components/ui/ToastContext';
import { AdProvider } from './context/AdContext';
import { Layout } from './components/layout/Layout';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import GuidePage from './pages/GuidePage';

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
  
  // Determine page type and content
  const getPageType = (route: string): 'calculator' | 'results' | 'help' | 'about' | 'blog' | 'guide' => {
    if (route.startsWith('results')) return 'results';
    if (route === 'about') return 'about';
    if (route === 'help') return 'help';
    if (route === 'guide') return 'guide';
    if (route === 'blog') return 'blog';
    return 'calculator';
  };
  
  const renderContent = () => {
    switch (currentRoute) {
      case 'about':
        return <AboutPage />;
      case 'help':
        return <HelpPage />;
      case 'guide':
        return <GuidePage />;
      default:
        if (currentRoute.startsWith('results')) {
          return <ResultsPage />;
        }
        return <CalculatorPage />;
    }
  };
  
  return (
    <ToastProvider position="top-end">
      <AdProvider>
        <CalculationProvider>
          <div className="min-vh-100 bg-light">
            <Layout pageType={getPageType(currentRoute)}>
              {renderContent()}
            </Layout>
          </div>
        </CalculationProvider>
      </AdProvider>
    </ToastProvider>
  );
}

export default App;
