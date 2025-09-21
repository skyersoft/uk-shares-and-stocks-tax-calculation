import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { Input } from './Input';

describe('FormField Component', () => {
  // Basic Rendering Tests
  test('renders form field with label and input', () => {
    render(
      <FormField label="Test Label">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  test('renders without label when not provided', () => {
    render(
      <FormField>
        <Input data-testid="test-input" />
      </FormField>
    );
    
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  // Required Field Tests
  test('shows required indicator when required', () => {
    render(
      <FormField label="Required Field" required>
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Required Field');
    expect(label.parentElement).toHaveTextContent('*');
  });

  test('does not show required indicator when not required', () => {
    render(
      <FormField label="Optional Field">
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Optional Field');
    expect(label.parentElement).not.toHaveTextContent('*');
  });

  // Error State Tests
  test('displays error message when provided', () => {
    render(
      <FormField label="Test Field" error="This field is required">
        <Input />
      </FormField>
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('invalid-feedback');
  });

  test('applies error styling to container when error exists', () => {
    render(
      <FormField label="Test Field" error="Error message">
        <Input />
      </FormField>
    );
    
    const container = screen.getByText('Test Field').closest('.mb-3');
    expect(container).toHaveClass('has-error');
  });

  test('does not display error message when not provided', () => {
    render(
      <FormField label="Test Field">
        <Input />
      </FormField>
    );
    
    expect(screen.queryByText(/invalid-feedback/)).not.toBeInTheDocument();
  });

  // Help Text Tests
  test('displays help text when provided', () => {
    render(
      <FormField label="Test Field" helpText="This is helpful information">
        <Input />
      </FormField>
    );
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    expect(screen.getByText('This is helpful information')).toHaveClass('form-text');
  });

  test('does not display help text when not provided', () => {
    render(
      <FormField label="Test Field">
        <Input />
      </FormField>
    );
    
    expect(screen.queryByText(/form-text/)).not.toBeInTheDocument();
  });

  test('displays both help text and error message when both provided', () => {
    render(
      <FormField 
        label="Test Field" 
        helpText="Helpful info"
        error="Error message"
      >
        <Input />
      </FormField>
    );
    
    expect(screen.getByText('Helpful info')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  // ID and Accessibility Tests
  test('generates unique ID when not provided', () => {
    render(
      <FormField label="Test Field">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    const label = screen.getByText('Test Field');
    
    expect(input).toHaveAttribute('id');
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  test('uses provided ID when given', () => {
    render (
      <FormField label="Test Field" id="custom-id">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    const label = screen.getByText('Test Field');
    
    expect(input).toHaveAttribute('id', 'custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  test('associates error message with input via aria-describedby', () => {
    render(
      <FormField label="Test Field" error="Error message" id="test-field">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-describedby', 'test-field-error');
    
    const errorMessage = screen.getByText('Error message');
    expect(errorMessage).toHaveAttribute('id', 'test-field-error');
  });

  test('associates help text with input via aria-describedby', () => {
    render(
      <FormField label="Test Field" helpText="Help text" id="test-field">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-describedby', 'test-field-help');
    
    const helpText = screen.getByText('Help text');
    expect(helpText).toHaveAttribute('id', 'test-field-help');
  });

  test('associates both error and help text via aria-describedby', () => {
    render(
      <FormField 
        label="Test Field" 
        helpText="Help text"
        error="Error message"
        id="test-field"
      >
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    const ariaDescribedBy = input.getAttribute('aria-describedby');
    
    expect(ariaDescribedBy).toContain('test-field-help');
    expect(ariaDescribedBy).toContain('test-field-error');
  });

  // Child Component Props Tests
  test('passes validation state to child input', () => {
    render(
      <FormField label="Test Field" error="Error message">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveClass('is-invalid');
  });

  test('does not pass validation state when no error', () => {
    render(
      <FormField label="Test Field">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).not.toHaveClass('is-invalid');
    expect(input).not.toHaveClass('is-valid');
  });

  // Custom Class Tests
  test('applies custom className to container', () => {
    render(
      <FormField label="Test Field" className="custom-field">
        <Input />
      </FormField>
    );
    
    const container = screen.getByText('Test Field').closest('.mb-3');
    expect(container).toHaveClass('custom-field');
  });

  // Multiple Children Tests
  test('handles multiple child components', () => {
    render(
      <FormField label="Test Field">
        <Input data-testid="input-1" />
        <Input data-testid="input-2" />
      </FormField>
    );
    
    expect(screen.getByTestId('input-1')).toBeInTheDocument();
    expect(screen.getByTestId('input-2')).toBeInTheDocument();
  });

  // Label Element Tests
  test('renders label as label element by default', () => {
    render(
      <FormField label="Test Label">
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Test Label');
    expect(label.tagName).toBe('LABEL');
  });

  test('applies label styling classes', () => {
    render(
      <FormField label="Test Label">
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('form-label');
  });

  // Edge Cases
  test('handles empty label gracefully', () => {
    render(
      <FormField label="">
        <Input data-testid="test-input" />
      </FormField>
    );
    
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  test('handles long error messages', () => {
    const longError = 'This is a very long error message that should wrap properly and still be displayed correctly in the form field component without breaking the layout or accessibility features.';
    
    render(
      <FormField label="Test Field" error={longError}>
        <Input />
      </FormField>
    );
    
    expect(screen.getByText(longError)).toBeInTheDocument();
    expect(screen.getByText(longError)).toHaveClass('invalid-feedback');
  });

  test('handles complex child components', () => {
    const ComplexChild = ({ id, ...props }: any) => (
      <div>
        <Input id={id} {...props} data-testid="complex-input" />
        <span>Additional content</span>
      </div>
    );

    render(
      <FormField label="Complex Field" id="complex-field">
        <ComplexChild />
      </FormField>
    );
    
    expect(screen.getByTestId('complex-input')).toHaveAttribute('id', 'complex-field');
    expect(screen.getByText('Additional content')).toBeInTheDocument();
  });
});