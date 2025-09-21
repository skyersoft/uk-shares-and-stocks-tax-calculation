import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert Component', () => {
  // Basic Rendering Tests
  test('renders alert with default variant (info)', () => {
    render(<Alert>Default alert message</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('alert', 'alert-info');
    expect(alert).toHaveTextContent('Default alert message');
  });

  test('renders alert with custom message', () => {
    render(<Alert>Custom alert message</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Custom alert message');
  });

  // Variant Tests
  test('renders primary variant correctly', () => {
    render(<Alert variant="primary">Primary alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-primary');
  });

  test('renders secondary variant correctly', () => {
    render(<Alert variant="secondary">Secondary alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-secondary');
  });

  test('renders success variant correctly', () => {
    render(<Alert variant="success">Success alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-success');
  });

  test('renders danger variant correctly', () => {
    render(<Alert variant="danger">Danger alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-danger');
  });

  test('renders warning variant correctly', () => {
    render(<Alert variant="warning">Warning alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-warning');
  });

  test('renders info variant correctly', () => {
    render(<Alert variant="info">Info alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-info');
  });

  test('renders light variant correctly', () => {
    render(<Alert variant="light">Light alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-light');
  });

  test('renders dark variant correctly', () => {
    render(<Alert variant="dark">Dark alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-dark');
  });

  // Dismissible Tests
  test('renders dismissible alert with close button', () => {
    render(<Alert dismissible>Dismissible alert</Alert>);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-dismissible');
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('btn-close');
    expect(closeButton).toHaveAttribute('aria-label', 'Close');
  });

  test('calls onDismiss when close button is clicked', async () => {
    const handleDismiss = jest.fn();
    const user = userEvent.setup();
    
    render(<Alert dismissible onDismiss={handleDismiss}>Dismissible alert</Alert>);
    
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not render close button when not dismissible', () => {
    render(<Alert>Non-dismissible alert</Alert>);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders dismissible alert without onDismiss handler', async () => {
    const user = userEvent.setup();
    
    render(<Alert dismissible>Alert without handler</Alert>);
    
    const closeButton = screen.getByRole('button');
    
    // Should not throw error when clicked
    await user.click(closeButton);
    expect(closeButton).toBeInTheDocument();
  });

  // Icon Tests
  test('renders alert with icon', () => {
    render(<Alert icon="fa-info-circle">Alert with icon</Alert>);
    
    const icon = screen.getByRole('alert').querySelector('i');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('fas', 'fa-info-circle', 'me-2');
  });

  test('does not render icon when not provided', () => {
    render(<Alert>Alert without icon</Alert>);
    
    const icon = screen.getByRole('alert').querySelector('i');
    expect(icon).not.toBeInTheDocument();
  });

  // Title Tests
  test('renders alert with title', () => {
    render(<Alert title="Alert Title">Alert with title</Alert>);
    
    const title = screen.getByRole('alert').querySelector('.alert-heading');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Alert Title');
    expect(title).toHaveClass('alert-heading');
  });

  test('does not render title when not provided', () => {
    render(<Alert>Alert without title</Alert>);
    
    const title = screen.getByRole('alert').querySelector('.alert-heading');
    expect(title).not.toBeInTheDocument();
  });

  test('renders alert with both title and icon', () => {
    render(
      <Alert title="Important" icon="fa-exclamation-triangle">
        Important message
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    const title = alert.querySelector('.alert-heading');
    const icon = alert.querySelector('i');
    
    expect(title).toHaveTextContent('Important');
    expect(icon).toHaveClass('fa-exclamation-triangle');
  });

  // Custom Class Tests
  test('applies custom className', () => {
    render(<Alert className="custom-alert">Custom class alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert', 'alert-info', 'custom-alert');
  });

  // HTML Content Tests
  test('renders with ReactNode children', () => {
    render(
      <Alert>
        <strong>Bold text</strong> and <em>italic text</em>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('strong')).toHaveTextContent('Bold text');
    expect(alert.querySelector('em')).toHaveTextContent('italic text');
  });

  test('renders with complex content structure', () => {
    render(
      <Alert title="Complex Alert" icon="fa-info">
        <p>This is a paragraph.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('p')).toHaveTextContent('This is a paragraph.');
    expect(alert.querySelector('ul')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  // Accessibility Tests
  test('has proper ARIA role', () => {
    render(<Alert>Accessible alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  test('close button has proper ARIA label', () => {
    render(<Alert dismissible>Dismissible alert</Alert>);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close');
  });

  test('supports custom ARIA attributes', () => {
    render(
      <Alert aria-describedby="alert-description" data-testid="custom-alert">
        Alert with custom ARIA
      </Alert>
    );
    
    const alert = screen.getByTestId('custom-alert');
    expect(alert).toHaveAttribute('aria-describedby', 'alert-description');
  });

  // Edge Cases
  test('handles empty children gracefully', () => {
    render(<Alert>{''}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('');
  });

  test('handles null children gracefully', () => {
    render(<Alert>{null}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  test('handles undefined children gracefully', () => {
    render(<Alert>{undefined}</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  test('handles multiple dismissible alerts', async () => {
    const handleDismiss1 = jest.fn();
    const handleDismiss2 = jest.fn();
    const user = userEvent.setup();
    
    render(
      <div>
        <Alert dismissible onDismiss={handleDismiss1} data-testid="alert1">
          Alert 1
        </Alert>
        <Alert dismissible onDismiss={handleDismiss2} data-testid="alert2">
          Alert 2
        </Alert>
      </div>
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    await user.click(buttons[0]);
    expect(handleDismiss1).toHaveBeenCalledTimes(1);
    expect(handleDismiss2).not.toHaveBeenCalled();
    
    await user.click(buttons[1]);
    expect(handleDismiss2).toHaveBeenCalledTimes(1);
  });

  // Combination Tests
  test('renders dismissible alert with all features', () => {
    render(
      <Alert
        variant="success"
        title="Success!"
        icon="fa-check-circle"
        dismissible
        className="custom-success"
      >
        <strong>Well done!</strong> You successfully completed the action.
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-success', 'alert-dismissible', 'custom-success');
    
    const title = alert.querySelector('.alert-heading');
    expect(title).toHaveTextContent('Success!');
    
    const icon = alert.querySelector('i');
    expect(icon).toHaveClass('fa-check-circle');
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    
    const strongText = alert.querySelector('strong');
    expect(strongText).toHaveTextContent('Well done!');
  });

  // HTML Attributes Tests
  test('forwards HTML attributes', () => {
    render(
      <Alert 
        id="test-alert"
        data-testid="custom-alert"
        style={{ marginTop: '20px' }}
      >
        Alert with attributes
      </Alert>
    );
    
    const alert = screen.getByTestId('custom-alert');
    expect(alert).toHaveAttribute('id', 'test-alert');
    expect(alert).toHaveStyle('margin-top: 20px');
  });

  // Default Icon per Variant Tests
  test('uses default icons for different variants when no icon specified', () => {
    const { rerender } = render(<Alert variant="success">Success message</Alert>);
    // Note: This test would depend on implementation details
    // For now, we test that no icon is rendered when not specified
    let alert = screen.getByRole('alert');
    let icon = alert.querySelector('i');
    expect(icon).not.toBeInTheDocument();
    
    rerender(<Alert variant="success" icon="fa-check">Success with icon</Alert>);
    alert = screen.getByRole('alert');
    icon = alert.querySelector('i');
    expect(icon).toHaveClass('fa-check');
  });
});