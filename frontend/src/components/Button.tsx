// Sample Button component for testing Storybook setup
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Is this the principal call to action on the page? */
  primary?: boolean;
  /** What background color to use */
  backgroundColor?: string | null;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Button contents */
  label: string;
  /** Show loading state */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Icon to display */
  icon?: React.ReactNode;
}

/**
 * Primary UI component for user interaction
 */
export const Button: React.FC<ButtonProps> = ({ 
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
      style={{ backgroundColor: backgroundColor || undefined }}
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

export default Button;