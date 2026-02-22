import React from 'react';
import { Outlet } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { CalculationProvider } from './context/CalculationContext';
import { ToastProvider } from './components/ui/ToastContext';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import CalculatorPage from './pages/CalculatorPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import GuidePage from './pages/GuidePage';
import BlogPage from './pages/BlogPage';
import AffiliateDemo from './pages/AffiliateDemo';
import NotFoundPage from './pages/NotFoundPage';

import { ScrollToTop } from './components/common/ScrollToTop';
import { PageTracker } from './components/common/PageTracker';

const RootLayout: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <PageTracker />
      <HelmetProvider>
        <ToastProvider position="top-end">
          <CalculationProvider>
            <div className="min-vh-100 bg-light">
              <Layout>
                <Outlet />
              </Layout>
            </div>
          </CalculationProvider>
        </ToastProvider>
      </HelmetProvider>
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
      { path: 'results', element: <ResultsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/post/:slug', element: <BlogPage /> },
      { path: 'affiliate-demo', element: <AffiliateDemo /> },
      { path: '*', element: <NotFoundPage /> },
    ]
  }
];

export default routes;
