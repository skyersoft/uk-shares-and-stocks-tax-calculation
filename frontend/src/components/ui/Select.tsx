import React from 'react';
import { SelectProps } from '../../types';

/**
 * Select component with Bootstrap styling and validation states
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    options = [],
    size = 'md',
    isValid,
    placeholder,
    className = '',
    disabled,
    required,
    multiple,
    ...props
  }, ref) => {
    // Build CSS classes
    const classes = [
      // Base class
      'form-select',
      
      // Size classes
      size === 'sm' && 'form-select-sm',
      size === 'lg' && 'form-select-lg',
      
      // Validation classes
      isValid === true && 'is-valid',
      isValid === false && 'is-invalid',
      
      // Custom classes
      className
    ].filter(Boolean).join(' ');

    // Build ARIA attributes
    const ariaProps: React.SelectHTMLAttributes<HTMLSelectElement> = {};
    
    if (isValid !== undefined) {
      ariaProps['aria-invalid'] = !isValid;
    }

    return (
      <select
        ref={ref}
        className={classes}
        disabled={disabled}
        required={required}
        multiple={multiple}
        {...ariaProps}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option, index) => (
          <option
            key={`${option.value}-${index}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';