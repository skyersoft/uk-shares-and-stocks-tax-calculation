import React from 'react';
import SEOHead from '../components/seo/SEOHead';
import Terms from '../components/pages/Terms';

const TermsPage: React.FC = () => (
  <>
    <SEOHead
      title="Terms of Service - UK Stock Tax Calculator"
      description="Terms of service for the UK Stock Tax Calculator: acceptable use, disclaimers and limitations of liability."
      canonical="https://cgttaxtool.uk/terms"
    />
    <Terms />
  </>
);

export default TermsPage;
