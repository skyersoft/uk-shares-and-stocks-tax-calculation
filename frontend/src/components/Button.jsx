// Sample Button component for testing Storybook setup
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Primary UI component for user interaction
 */
export const Button = ({ 
  primary = false, 
  size = 'medium', 
  backgroundColor = null, 
  label = 'Button',
  loading = false,
  disabled = false,
  icon = null,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClass = primary ? 'btn-primary' : 'btn-secondary';
  const sizeClass = size === 'small' ? 'btn-sm' : size === 'large' ? 'btn-lg' : '';
  const loadingClass = loading ? 'loading' : '';
  
  const className = [baseClasses, variantClass, sizeClass, loadingClass]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      style={{ backgroundColor }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      )}
      {icon && !loading && <span className="me-2">{icon}</span>}
      {label}
    </button>
  );
};

Button.propTypes = {
  /** Is this the principal call to action on the page? */
  primary: PropTypes.bool,
  /** What background color to use */
  backgroundColor: PropTypes.string,
  /** How large should the button be? */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Button contents */
  label: PropTypes.string.isRequired,
  /** Show loading state */
  loading: PropTypes.bool,
  /** Disable button */
  disabled: PropTypes.bool,
  /** Icon to display */
  icon: PropTypes.node,
  /** Optional click handler */
  onClick: PropTypes.func,
};

Button.defaultProps = {
  primary: false,
  size: 'medium',
  backgroundColor: null,
  loading: false,
  disabled: false,
  icon: null,
  onClick: undefined,
};

export default Button;