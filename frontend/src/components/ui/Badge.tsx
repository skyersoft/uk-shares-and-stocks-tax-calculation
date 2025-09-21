import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 
           'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 
           'outline-warning' | 'outline-info' | 'outline-light' | 'outline-dark';
  size?: 'sm' | 'lg';
  pill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size,
  pill = false,
  className = '',
  ...props
}) => {
  const badgeClasses = [
    'badge',
    `bg-${variant}`,
    size && `badge-${size}`,
    pill && 'rounded-pill',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;