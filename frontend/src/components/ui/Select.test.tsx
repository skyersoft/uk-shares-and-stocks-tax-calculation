import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const sampleOptionsWithDisabled = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2', disabled: true },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  // Basic Rendering Tests
  test('renders select with basic props', () => {
    render(<Select options={sampleOptions} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('form-select');
  });

  test('renders with provided value', () => {
    render(<Select options={sampleOptions} value="option2" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });

  test('renders with placeholder option', () => {
    render(<Select options={sampleOptions} placeholder="Choose an option" />);
    const placeholder = screen.getByText('Choose an option');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('value', '');
  });

  test('renders all provided options', () => {
    render(<Select options={sampleOptions} />);
    
    sampleOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  // Size Tests
  test('applies correct size classes', () => {
    const { rerender } = render(<Select options={sampleOptions} size="sm" />);
    expect(screen.getByRole('combobox')).toHaveClass('form-select-sm');

    rerender(<Select options={sampleOptions} size="lg" />);
    expect(screen.getByRole('combobox')).toHaveClass('form-select-lg');

    rerender(<Select options={sampleOptions} size="md" />);
    expect(screen.getByRole('combobox')).toHaveClass('form-select');
    expect(screen.getByRole('combobox')).not.toHaveClass('form-select-sm');
    expect(screen.getByRole('combobox')).not.toHaveClass('form-select-lg');
  });

  // Validation State Tests
  test('applies validation state classes', () => {
    const { rerender } = render(<Select options={sampleOptions} isValid={true} />);
    expect(screen.getByRole('combobox')).toHaveClass('is-valid');

    rerender(<Select options={sampleOptions} isValid={false} />);
    expect(screen.getByRole('combobox')).toHaveClass('is-invalid');

    rerender(<Select options={sampleOptions} isValid={undefined} />);
    expect(screen.getByRole('combobox')).not.toHaveClass('is-valid');
    expect(screen.getByRole('combobox')).not.toHaveClass('is-invalid');
  });

  // Disabled State Tests
  test('handles disabled state', () => {
    render(<Select options={sampleOptions} disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveAttribute('disabled');
  });

  test('handles disabled options', () => {
    render(<Select options={sampleOptionsWithDisabled} />);
    const disabledOption = screen.getByText('Option 2');
    expect(disabledOption).toHaveAttribute('disabled');
  });

  // Required State Tests
  test('handles required state', () => {
    render(<Select options={sampleOptions} required />);
    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
    expect(select).toHaveAttribute('required');
  });

  // Custom Class Tests
  test('applies custom className', () => {
    render(<Select options={sampleOptions} className="custom-select" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('form-select');
    expect(select).toHaveClass('custom-select');
  });

  // Event Handler Tests
  test('calls onChange when selection changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Select options={sampleOptions} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'option2'
        })
      })
    );
  });

  test('calls onFocus when select receives focus', async () => {
    const handleFocus = jest.fn();
    const user = userEvent.setup();
    
    render(<Select options={sampleOptions} onFocus={handleFocus} />);
    const select = screen.getByRole('combobox');
    
    await user.click(select);
    
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('calls onBlur when select loses focus', async () => {
    const handleBlur = jest.fn();
    const user = userEvent.setup();
    
    render(<Select options={sampleOptions} onBlur={handleBlur} />);
    const select = screen.getByRole('combobox');
    
    await user.click(select);
    await user.tab();
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  // HTML Attributes Tests
  test('forwards HTML attributes', () => {
    render(
      <Select 
        options={sampleOptions}
        id="test-select"
        name="testName"
        data-testid="custom-select"
      />
    );
    
    const select = screen.getByTestId('custom-select');
    expect(select).toHaveAttribute('id', 'test-select');
    expect(select).toHaveAttribute('name', 'testName');
  });

  // Ref Tests
  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(<Select options={sampleOptions} ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    expect(ref.current).toHaveClass('form-select');
  });

  // Focus Method Test
  test('can be focused programmatically', () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(<Select options={sampleOptions} ref={ref} />);
    
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  // Controlled Component Tests
  test('works as controlled component', async () => {
    const ControlledSelect = () => {
      const [value, setValue] = React.useState('');
      return (
        <Select 
          options={sampleOptions}
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-select"
        />
      );
    };

    const user = userEvent.setup();
    render(<ControlledSelect />);
    
    const select = screen.getByTestId('controlled-select');
    await user.selectOptions(select, 'option2');
    
    expect(select).toHaveValue('option2');
  });

  // Uncontrolled Component Tests
  test('works as uncontrolled component', async () => {
    const user = userEvent.setup();
    render(<Select options={sampleOptions} defaultValue="option1" data-testid="uncontrolled-select" />);
    
    const select = screen.getByTestId('uncontrolled-select');
    expect(select).toHaveValue('option1');
    
    await user.selectOptions(select, 'option3');
    
    expect(select).toHaveValue('option3');
  });

  // Accessibility Tests
  test('has proper ARIA attributes when invalid', () => {
    render(<Select options={sampleOptions} isValid={false} id="test-select" />);
    const select = screen.getByRole('combobox');
    
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  test('has proper ARIA attributes when valid', () => {
    render(<Select options={sampleOptions} isValid={true} id="test-select" />);
    const select = screen.getByRole('combobox');
    
    expect(select).toHaveAttribute('aria-invalid', 'false');
  });

  test('can be associated with describedBy', () => {
    render(<Select options={sampleOptions} aria-describedby="help-text" />);
    const select = screen.getByRole('combobox');
    
    expect(select).toHaveAttribute('aria-describedby', 'help-text');
  });

  // Option Value Types Tests
  test('handles string option values', () => {
    const stringOptions = [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
    ];

    render(<Select options={stringOptions} />);
    
    stringOptions.forEach(option => {
      const optionElement = screen.getByText(option.label);
      expect(optionElement).toHaveAttribute('value', option.value);
    });
  });

  test('handles numeric option values', () => {
    const numericOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' },
    ];

    render(<Select options={numericOptions} />);
    
    numericOptions.forEach(option => {
      const optionElement = screen.getByText(option.label);
      expect(optionElement).toHaveAttribute('value', option.value.toString());
    });
  });

  // Edge Cases
  test('handles empty options array', () => {
    render(<Select options={[]} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(0);
  });

  test('handles options with same values', () => {
    const duplicateOptions = [
      { value: 'same', label: 'First Same' },
      { value: 'same', label: 'Second Same' },
    ];

    render(<Select options={duplicateOptions} />);
    
    expect(screen.getByText('First Same')).toBeInTheDocument();
    expect(screen.getByText('Second Same')).toBeInTheDocument();
  });

  test('handles null/undefined onChange gracefully', async () => {
    const user = userEvent.setup();
    render(<Select options={sampleOptions} />);
    const select = screen.getByRole('combobox');
    
    // Should not throw error
    await user.selectOptions(select, 'option2');
    expect(select).toHaveValue('option2');
  });

  // Placeholder Tests
  test('placeholder option is available when provided', () => {
    render(<Select options={sampleOptions} placeholder="Select option" />);
    const placeholder = screen.getByText('Select option');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('value', '');
  });

  test('placeholder option is disabled and not selectable', () => {
    render(<Select options={sampleOptions} placeholder="Select option" />);
    const placeholder = screen.getByText('Select option');
    expect(placeholder).toHaveAttribute('disabled');
  });

  // Multiple Selection Tests (if supported)
  test('supports multiple selection when multiple prop is true', () => {
    render(<Select options={sampleOptions} multiple />);
    const select = screen.getByRole('listbox'); // role changes to listbox for multiple
    expect(select).toHaveAttribute('multiple');
  });
});