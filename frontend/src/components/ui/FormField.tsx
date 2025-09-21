import React from 'react';
import { FormFieldProps } from '../../types';

/**
 * Generate a unique ID for form fields
 */
let fieldIdCounter = 0;
const generateFieldId = (): string => {
  fieldIdCounter += 1;
  return `form-field-${fieldIdCounter}`;
};

/**
 * FormField component that wraps form inputs with label, error display, and help text
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helpText,
  required = false,
  children,
  className = '',
  id: providedId,
  ...props
}) => {
  // Generate or use provided ID
  const fieldId = providedId || generateFieldId();
  
  // Build CSS classes for container
  const containerClasses = [
    'mb-3', // Bootstrap margin bottom
    error && 'has-error', // Custom error state class
    className
  ].filter(Boolean).join(' ');

  // Build aria-describedby for accessibility
  const ariaDescribedBy = [
    helpText && `${fieldId}-help`,
    error && `${fieldId}-error`
  ].filter(Boolean).join(' ');

  // Clone children to inject props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        id: fieldId,
        isValid: error ? false : undefined,
        'aria-describedby': ariaDescribedBy || undefined,
        ...child.props
      });
    }
    return child;
  });

  return (
    <div className={containerClasses} {...props}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && (
            <span className="text-danger ms-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      {enhancedChildren}
      
      {helpText && (
        <div 
          id={`${fieldId}-help`}
          className="form-text text-muted"
        >
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={`${fieldId}-error`}
          className="invalid-feedback d-block"
        >
          {error}
        </div>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';