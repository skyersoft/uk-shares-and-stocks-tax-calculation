import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

// Mock data for tests
const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: 'Test Modal',
  children: 'Modal content goes here'
};

describe('Modal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock body style
    Object.defineProperty(document.body.style, 'overflow', {
      value: '',
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up any modals that might be left in DOM
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
    
    // Reset body overflow
    document.body.style.overflow = '';
  });

  // Basic Rendering Tests
  test('renders modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content goes here')).toBeInTheDocument();
  });

  test('does not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders modal without title', () => {
    render(<Modal {...defaultProps} title={undefined} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content goes here')).toBeInTheDocument();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  // Size Tests
  test('renders small size modal correctly', () => {
    render(<Modal {...defaultProps} size="sm" />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).toHaveClass('modal-sm');
  });

  test('renders medium size modal correctly (default)', () => {
    render(<Modal {...defaultProps} size="md" />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).not.toHaveClass('modal-sm');
    expect(modalDialog).not.toHaveClass('modal-lg');
    expect(modalDialog).not.toHaveClass('modal-xl');
  });

  test('renders large size modal correctly', () => {
    render(<Modal {...defaultProps} size="lg" />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).toHaveClass('modal-lg');
  });

  test('renders extra large size modal correctly', () => {
    render(<Modal {...defaultProps} size="xl" />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).toHaveClass('modal-xl');
  });

  // Close Button Tests
  test('renders close button by default', () => {
    render(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('does not render close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    
    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Backdrop Click Tests
  test('calls onClose when backdrop is clicked by default', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const backdrop = screen.getByRole('dialog').closest('.modal');
    await user.click(backdrop!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when backdrop is clicked and closeOnBackdrop is false', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} closeOnBackdrop={false} />);
    
    const backdrop = screen.getByRole('dialog').closest('.modal');
    await user.click(backdrop!);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onClose when modal content is clicked', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const modalContent = screen.getByText('Modal content goes here');
    await user.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Keyboard Tests
  test('calls onClose when Escape key is pressed by default', () => {
    const mockOnClose = jest.fn();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when Escape key is pressed and closeOnEscape is false', () => {
    const mockOnClose = jest.fn();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} closeOnEscape={false} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onClose for other key presses', () => {
    const mockOnClose = jest.fn();
    
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Centering Tests
  test('renders centered modal when centered is true', () => {
    render(<Modal {...defaultProps} centered />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).toHaveClass('modal-dialog-centered');
  });

  test('does not render centered modal when centered is false', () => {
    render(<Modal {...defaultProps} centered={false} />);
    
    const modalDialog = screen.getByRole('dialog').closest('.modal-dialog');
    expect(modalDialog).not.toHaveClass('modal-dialog-centered');
  });

  // Animation Tests
  test('renders with fade animation by default', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog').closest('.modal');
    expect(modal).toHaveClass('fade');
  });

  test('renders without fade animation when fade is false', () => {
    render(<Modal {...defaultProps} fade={false} />);
    
    const modal = screen.getByRole('dialog').closest('.modal');
    expect(modal).not.toHaveClass('fade');
  });

  // Accessibility Tests
  test('has proper ARIA role', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  test('has proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('tabindex', '-1');
  });

  test('uses custom aria-label when provided', () => {
    render(<Modal {...defaultProps} ariaLabel="Custom modal label" />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-label', 'Custom modal label');
  });

  test('uses aria-labelledby when title is provided', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    
    const titleId = modal.getAttribute('aria-labelledby');
    expect(document.getElementById(titleId!)).toHaveTextContent('Test Modal');
  });

  test('close button has proper ARIA label', () => {
    render(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close');
  });

  // Focus Management Tests
  test('focuses modal when opened', async () => {
    render(<Modal {...defaultProps} />);
    
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveFocus();
    });
  });

  test('traps focus within modal', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Outside button</button>
        <Modal {...defaultProps}>
          <button>Inside button</button>
        </Modal>
      </div>
    );

    const insideButton = screen.getByText('Inside button');
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Tab should cycle between modal elements
    await user.tab();
    expect(closeButton).toHaveFocus();
    
    await user.tab();
    expect(insideButton).toHaveFocus();
    
    await user.tab();
    expect(closeButton).toHaveFocus(); // Should cycle back
  });

  // Custom Content Tests
  test('renders custom header content', () => {
    const customHeader = <div data-testid="custom-header">Custom Header</div>;
    
    render(<Modal {...defaultProps} header={customHeader} />);
    
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  test('renders custom footer content', () => {
    const customFooter = (
      <div data-testid="custom-footer">
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );
    
    render(<Modal {...defaultProps} footer={customFooter} />);
    
    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  // Body Scroll Lock Tests
  test('locks body scroll when modal is open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('restores body scroll when modal is closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });

  // Custom Styling Tests
  test('applies custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    const modal = screen.getByRole('dialog').closest('.modal');
    expect(modal).toHaveClass('custom-modal');
  });

  test('forwards HTML attributes', () => {
    render(<Modal {...defaultProps} data-testid="test-modal" />);
    
    const modal = screen.getByTestId('test-modal');
    expect(modal).toBeInTheDocument();
  });

  test('applies custom z-index', () => {
    render(<Modal {...defaultProps} zIndex={9999} />);
    
    const modal = screen.getByRole('dialog').closest('.modal');
    expect(modal).toHaveStyle('z-index: 9999');
  });

  // Complex Content Tests
  test('renders complex children content', () => {
    const complexContent = (
      <div>
        <h4>Complex Content</h4>
        <p>This is a paragraph with <strong>bold text</strong></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );
    
    render(<Modal {...defaultProps}>{complexContent}</Modal>);
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  // Tax Calculator Specific Tests
  test('renders confirmation modal for delete action', () => {
    const footer = (
      <div className="d-flex gap-2">
        <button className="btn btn-secondary">Cancel</button>
        <button className="btn btn-danger">Delete</button>
      </div>
    );
    
    render(
      <Modal 
        {...defaultProps} 
        title="Confirm Delete" 
        footer={footer}
        size="sm"
      >
        Are you sure you want to delete this calculation? This action cannot be undone.
      </Modal>
    );
    
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('renders settings modal with form content', () => {
    render(
      <Modal {...defaultProps} title="Settings" size="lg">
        <form>
          <div className="mb-3">
            <label htmlFor="tax-year" className="form-label">Tax Year</label>
            <select id="tax-year" className="form-select">
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="currency" className="form-label">Currency</label>
            <select id="currency" className="form-select">
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </form>
      </Modal>
    );
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  // Edge Cases
  test('handles rapid open/close cycles', () => {
    const mockOnClose = jest.fn();
    const { rerender } = render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    rerender(<Modal {...defaultProps} onClose={mockOnClose} isOpen={false} />);
    rerender(<Modal {...defaultProps} onClose={mockOnClose} isOpen={true} />);
    rerender(<Modal {...defaultProps} onClose={mockOnClose} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });

  test('handles missing onClose handler gracefully', () => {
    render(<Modal isOpen={true} title="Test">Content</Modal>);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Should not throw error when clicked
    expect(() => {
      fireEvent.click(closeButton);
    }).not.toThrow();
  });

  test('handles empty children gracefully', () => {
    render(<Modal {...defaultProps}>{null}</Modal>);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });
});