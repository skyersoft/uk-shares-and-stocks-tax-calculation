import React from 'react';

interface MatchingRuleBadgeProps {
  rule: 'same-day' | 'bed-breakfast' | 'section104';
  className?: string;
}

const RULE_CONFIG = {
  'same-day': {
    label: 'Same Day',
    variant: 'success',
    bgColor: 'bg-success',
    tooltip: 'Shares acquired on same day as disposal'
  },
  'bed-breakfast': {
    label: '30-Day B&B',
    variant: 'warning',
    bgColor: 'bg-warning',
    tooltip: 'Shares acquired within 30 days after disposal (Bed & Breakfast rule)'
  },
  'section104': {
    label: 'Section 104',
    variant: 'secondary',
    bgColor: 'bg-secondary',
    tooltip: 'Shares from pooled holdings (Section 104 pool)'
  }
};

export const MatchingRuleBadge: React.FC<MatchingRuleBadgeProps> = ({ 
  rule, 
  className = '' 
}) => {
  const config = RULE_CONFIG[rule];
  
  return (
    <span 
      className={`badge ${config.bgColor} text-white ${className}`}
      title={config.tooltip}
      style={{ cursor: 'help' }}
    >
      {config.label}
    </span>
  );
};
