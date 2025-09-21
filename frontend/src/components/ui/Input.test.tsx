import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  // Basic Rendering Tests
  test('renders input with basic props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('form-control');
  });

  test('renders with provided value', () => {
    render(<Input value="test value" />);
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  test('renders with placeholder', () => {
    render(<Input placeholder="Enter text here" />);
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  // Type Tests
  test('renders with different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="test-input" />);
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="test-input" />);
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="test-input" />);
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'number');
  });

  // Size Tests
  test('applies correct size classes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('form-control-sm');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('form-control-lg');

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('form-control');
    expect(screen.getByRole('textbox')).not.toHaveClass('form-control-sm');
    expect(screen.getByRole('textbox')).not.toHaveClass('form-control-lg');
  });

  // Validation State Tests
  test('applies validation state classes', () => {
    const { rerender } = render(<Input isValid={true} />);
    expect(screen.getByRole('textbox')).toHaveClass('is-valid');

    rerender(<Input isValid={false} />);
    expect(screen.getByRole('textbox')).toHaveClass('is-invalid');

    rerender(<Input isValid={undefined} />);
    expect(screen.getByRole('textbox')).not.toHaveClass('is-valid');
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  // Disabled State Tests
  test('handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('disabled');
  });

  // Required State Tests
  test('handles required state', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('required');
  });

  // ReadOnly State Tests
  test('handles readonly state', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  // Custom Class Tests
  test('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('form-control');
    expect(input).toHaveClass('custom-input');
  });

  // Event Handler Tests
  test('calls onChange when input value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalledTimes(4); // one call per character
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'test'
        })
      })
    );
  });

  test('calls onFocus when input receives focus', async () => {
    const handleFocus = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onFocus={handleFocus} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('calls onBlur when input loses focus', async () => {
    const handleBlur = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    await user.tab();
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('calls onKeyDown when key is pressed', async () => {
    const handleKeyDown = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onKeyDown={handleKeyDown} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'a');
    
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'a'
      })
    );
  });

  // HTML Attributes Tests
  test('forwards HTML attributes', () => {
    render(
      <Input 
        id="test-input"
        name="testName"
        autoComplete="email"
        maxLength={100}
        min="0"
        max="100"
        step="1"
        pattern="[0-9]*"
        data-testid="custom-input"
      />
    );
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testName');
    expect(input).toHaveAttribute('autoComplete', 'email');
    expect(input).toHaveAttribute('maxLength', '100');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '1');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  // Ref Tests
  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveClass('form-control');
  });

  // Focus Method Test
  test('can be focused programmatically', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  // Controlled Component Tests
  test('works as controlled component', async () => {
    const ControlledInput = () => {
      const [value, setValue] = React.useState('');
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-input"
        />
      );
    };

    const user = userEvent.setup();
    render(<ControlledInput />);
    
    const input = screen.getByTestId('controlled-input');
    await user.type(input, 'controlled');
    
    expect(input).toHaveValue('controlled');
  });

  // Uncontrolled Component Tests
  test('works as uncontrolled component', async () => {
    const user = userEvent.setup();
    render(<Input defaultValue="initial" data-testid="uncontrolled-input" />);
    
    const input = screen.getByTestId('uncontrolled-input');
    expect(input).toHaveValue('initial');
    
    await user.clear(input);
    await user.type(input, 'uncontrolled');
    
    expect(input).toHaveValue('uncontrolled');
  });

  // Accessibility Tests
  test('has proper ARIA attributes when invalid', () => {
    render(<Input isValid={false} id="test-input" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('has proper ARIA attributes when valid', () => {
    render(<Input isValid={true} id="test-input" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  test('can be associated with describedBy', () => {
    render(<Input aria-describedby="help-text" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('aria-describedby', 'help-text');
  });

  // Edge Cases
  test('handles empty string value', () => {
    render(<Input value="" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  test('handles null/undefined onChange gracefully', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    // Should not throw error
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
  });

  // Multiple Validation States
  test('handles multiple validation props correctly', () => {
    render(<Input isValid={true} required disabled />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveClass('is-valid');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});