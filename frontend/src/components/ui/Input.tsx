import React from 'react';
import { InputProps } from '../../types';

/**
 * Input component with Bootstrap styling and validation states
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    type = 'text',
    size = 'md',
    isValid,
    className = '',
    disabled,
    required,
    readOnly,
    ...props
  }, ref) => {
    // Build CSS classes
    const classes = [
      // Base class
      'form-control',
      
      // Size classes
      size === 'sm' && 'form-control-sm',
      size === 'lg' && 'form-control-lg',
      
      // Validation classes
      isValid === true && 'is-valid',
      isValid === false && 'is-invalid',
      
      // Custom classes
      className
    ].filter(Boolean).join(' ');

    // Build ARIA attributes
    const ariaProps: React.InputHTMLAttributes<HTMLInputElement> = {};
    
    if (isValid !== undefined) {
      ariaProps['aria-invalid'] = !isValid;
    }

    return (
      <input
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        {...ariaProps}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';