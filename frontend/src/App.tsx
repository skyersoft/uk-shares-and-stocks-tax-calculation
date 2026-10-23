import React from 'react';
import { Outlet } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
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
import WatchPage from './pages/WatchPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SEOHead from './components/seo/SEOHead';
import AffiliateDemo from './pages/AffiliateDemo';
import NotFoundPage from './pages/NotFoundPage';
import PrintReportPage from './pages/PrintReportPage';

import { ScrollToTop } from './components/common/ScrollToTop';
import { PageTracker } from './components/common/PageTracker';

const RootLayout: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <PageTracker />
        <ToastProvider position="top-end">
          <CalculationProvider>
            <div className="min-vh-100 bg-light">
              <Layout>
                <Outlet />
              </Layout>
            </div>
          </CalculationProvider>
        </ToastProvider>
    </>
  );
};

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'calculator', element: <CalculatorPage /> },
      { path: 'results', element: (
        <>
          <SEOHead title="Calculation Results" description="Your UK capital gains tax calculation results." robots="noindex, nofollow" />
          <ResultsPage />
        </>
      ) },
      { path: 'about', element: <AboutPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/post/:slug', element: <BlogPage /> },
      { path: 'watch/:slug', element: <WatchPage /> },
      { path: 'affiliate-demo', element: <AffiliateDemo /> },
      { path: 'print-report', element: (
        <>
          <SEOHead title="Printable Tax Report" description="Printable UK capital gains tax report." robots="noindex, nofollow" />
          <PrintReportPage />
        </>
      ) },
      { path: '*', element: <NotFoundPage /> },
    ]
  }
];

export default routes;
