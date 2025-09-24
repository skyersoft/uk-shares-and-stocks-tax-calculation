/**
 * AffiliateDisclosure Component
 * Displays FTC-compliant affiliate marketing disclosure
 */

import React from 'react';
import { AffiliateDisclosureProps } from '../../types/affiliate';
import { getAffiliateConfig } from '../../utils/affiliateLoader';

const AffiliateDisclosure: React.FC<AffiliateDisclosureProps> = ({
  text,
  style = 'inline',
  className = '',
  showIcon = true
}) => {
  const config = getAffiliateConfig();
  const disclosureText = text || config.defaultDisclosure;
  
  const getDisclosureClasses = () => {
    const baseClasses = ['affiliate-disclosure'];
    
    switch (style) {
      case 'banner':
        return [
          ...baseClasses,
          'alert',
          'alert-info',
          'mb-3',
          'd-flex',
          'align-items-center',
          className
        ].filter(Boolean).join(' ');
        
      case 'footer':
        return [
          ...baseClasses,
          'text-muted',
          'small',
          'border-top',
          'pt-3',
          'mt-4',
          className
        ].filter(Boolean).join(' ');
        
      case 'inline':
      default:
        return [
          ...baseClasses,
          'text-muted',
          'small',
          className
        ].filter(Boolean).join(' ');
    }
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    
    switch (style) {
      case 'banner':
        return <i className="bi bi-info-circle-fill me-2 text-info"></i>;
      case 'footer':
        return <i className="bi bi-asterisk me-1"></i>;
      case 'inline':
      default:
        return <i className="bi bi-asterisk me-1"></i>;
    }
  };

  const renderBannerStyle = () => (
    <div className={getDisclosureClasses()} role="complementary" aria-label="Affiliate Disclosure">
      {renderIcon()}
      <div>
        <strong className="me-2">Disclosure:</strong>
        {disclosureText}
      </div>
    </div>
  );

  const renderFooterStyle = () => (
    <div className={getDisclosureClasses()} role="contentinfo" aria-label="Affiliate Disclosure">
      <div className="d-flex align-items-start">
        {renderIcon()}
        <div>
          <strong className="d-block mb-1">Affiliate Disclosure</strong>
          <p className="mb-0">{disclosureText}</p>
          <p className="mb-0 mt-2">
            This helps support our free educational content. Thank you for your support!
          </p>
        </div>
      </div>
    </div>
  );

  const renderInlineStyle = () => (
    <span className={getDisclosureClasses()} title="Affiliate Disclosure">
      {renderIcon()}
      {disclosureText}
    </span>
  );

  switch (style) {
    case 'banner':
      return renderBannerStyle();
    case 'footer':
      return renderFooterStyle();
    case 'inline':
    default:
      return renderInlineStyle();
  }
};

export default AffiliateDisclosure;