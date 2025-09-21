import React from 'react';
import { LoadingSpinnerProps } from '../../types';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'border',
  color,
  text = 'Loading...',
  label,
  centered = false,
  inline = false,
  className = '',
  ...props
}) => {
  // Build spinner classes
  const spinnerClasses = [
    variant === 'border' ? 'spinner-border' : 'spinner-grow',
    size === 'sm' ? (variant === 'border' ? 'spinner-border-sm' : 'spinner-grow-sm') : '',
    color ? `text-${color}` : '',
    className
  ].filter(Boolean).join(' ');

  // Build container classes for centering/inline
  const containerClasses = [
    centered ? 'd-flex justify-content-center align-items-center' : '',
    inline ? 'd-inline-flex' : ''
  ].filter(Boolean).join(' ');

  // Apply large size custom styling
  const spinnerStyle = size === 'lg' ? { width: '3rem', height: '3rem' } : {};

  // Render the spinner
  const spinner = (
    <div
      {...props}
      className={spinnerClasses}
      role="status"
      aria-hidden="true"
      style={{ ...spinnerStyle, ...props.style }}
    >
      <span className="visually-hidden">
        {text === '' ? '' : (text || 'Loading...')}
      </span>
    </div>
  );

  // Wrap with container if needed
  if (containerClasses) {
    return (
      <div className={containerClasses}>
        {label && <span className="me-2">{label}</span>}
        {spinner}
      </div>
    );
  }

  // Return spinner with optional label
  if (label) {
    return (
      <>
        <span className="me-2">{label}</span>
        {spinner}
      </>
    );
  }

  return spinner;
};