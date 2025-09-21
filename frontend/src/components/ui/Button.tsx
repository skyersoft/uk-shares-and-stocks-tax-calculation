import React from 'react';
import { ButtonProps } from '../../types/index';

/**
 * Button component with Bootstrap styling and comprehensive functionality
 * Supports variants, sizes, loading states, icons, and accessibility features
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  icon,
  iconPosition = 'left',
  'data-testid': dataTestId,
  ...props
}) => {
  // Calculate CSS classes
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const disabledClasses = disabled ? 'disabled' : '';
  
  const classes = [
    baseClasses,
    variantClasses,
    sizeClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  // Handle click events
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <span 
      className="spinner-border spinner-border-sm me-2" 
      role="status" 
      aria-hidden="true"
      data-testid="loading-spinner"
    />
  );

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <i 
        className={`fa ${icon} ${children ? (iconPosition === 'left' ? 'me-2' : 'ms-2') : ''}`}
        data-testid="button-icon"
        aria-hidden="true"
      />
    );
  };

  // Render button content
  const renderContent = () => {
    if (loading) {
      return renderLoadingSpinner();
    }

    const iconElement = renderIcon();
    
    if (!children) {
      return iconElement;
    }

    if (iconPosition === 'right') {
      return (
        <>
          {children}
          {iconElement}
        </>
      );
    }

    return (
      <>
        {iconElement}
        {children}
      </>
    );
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      data-testid={dataTestId}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

Button.displayName = 'Button';