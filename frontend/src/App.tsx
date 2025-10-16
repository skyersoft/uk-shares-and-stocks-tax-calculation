import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CalculationProvider } from './context/CalculationContext';
import { ToastProvider } from './components/ui/ToastContext';
import { Layout } from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import GuidePage from './pages/GuidePage';
import BlogPage from './pages/BlogPage';
import AffiliateDemo from './pages/AffiliateDemo';

const App: React.FC = () => {
  console.log('[SPA] App component rendering with HashRouter...');

  return (
    <Router>
      <ToastProvider position="top-end">
        <CalculationProvider>
          <div className="min-vh-100 bg-light">
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/blog/*" element={<BlogPage />} />
                <Route path="/affiliate-demo" element={<AffiliateDemo />} />
              </Routes>
            </Layout>
          </div>
        </CalculationProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
