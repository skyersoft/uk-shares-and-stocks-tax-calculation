import React from 'react';
import { AlertProps } from '../../types';

/**
 * Alert component with Bootstrap styling and dismissible functionality
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  icon,
  dismissible = false,
  onDismiss,
  children,
  className = '',
  ...props
}) => {
  // Build CSS classes
  const classes = [
    // Base classes
    'alert',
    `alert-${variant}`,
    
    // Dismissible class
    dismissible && 'alert-dismissible',
    
    // Custom classes
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" {...props}>
      {title && (
        <h4 className="alert-heading">
          {icon && <i className={`fas ${icon} me-2`} />}
          {title}
        </h4>
      )}
      
      {!title && icon && <i className={`fas ${icon} me-2`} />}
      
      {children}
      
      {dismissible && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onDismiss}
        />
      )}
    </div>
  );
};

Alert.displayName = 'Alert';