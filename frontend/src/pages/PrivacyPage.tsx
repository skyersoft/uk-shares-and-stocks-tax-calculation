import React from 'react';
import SEOHead from '../components/seo/SEOHead';
import Privacy from '../components/pages/Privacy';

const PrivacyPage: React.FC = () => (
  <>
    <SEOHead
      title="Privacy Policy - UK Stock Tax Calculator"
      description="How the UK Stock Tax Calculator handles your data, cookies, analytics and advertising."
      canonical="https://cgttaxtool.uk/privacy"
    />
    <Privacy />
  </>
);

export default PrivacyPage;
