import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';
import type { Toast as ToastType } from '../../types';

describe('Toast Component', () => {
  const mockOnDismiss = jest.fn();
  const defaultToast: ToastType = {
    id: 'test-toast-1',
    message: 'Test toast message'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Basic Rendering Tests
  test('renders toast with default props', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast', 'show');
    
    const message = screen.getByText('Test toast message');
    expect(message).toBeInTheDocument();
  });

  test('renders toast with title', () => {
    const toastWithTitle: ToastType = {
      ...defaultToast,
      title: 'Test Title'
    };
    
    render(<Toast toast={toastWithTitle} onDismiss={mockOnDismiss} />);
    
    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('toast-header');
  });

  test('renders toast without title', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const header = screen.queryByText('Test Title');
    expect(header).not.toBeInTheDocument();
  });

  // Variant Tests
  test('renders success variant correctly', () => {
    const successToast: ToastType = {
      ...defaultToast,
      variant: 'success'
    };
    
    render(<Toast toast={successToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast-success');
  });

  test('renders danger variant correctly', () => {
    const dangerToast: ToastType = {
      ...defaultToast,
      variant: 'danger'
    };
    
    render(<Toast toast={dangerToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast-danger');
  });

  test('renders warning variant correctly', () => {
    const warningToast: ToastType = {
      ...defaultToast,
      variant: 'warning'
    };
    
    render(<Toast toast={warningToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast-warning');
  });

  test('renders info variant correctly', () => {
    const infoToast: ToastType = {
      ...defaultToast,
      variant: 'info'
    };
    
    render(<Toast toast={infoToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast-info');
  });

  // Icon Tests
  test('renders with icon when provided', () => {
    const iconToast: ToastType = {
      ...defaultToast,
      icon: 'fa-check-circle'
    };
    
    render(<Toast toast={iconToast} onDismiss={mockOnDismiss} />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('fas', 'fa-check-circle');
  });

  test('does not render icon when not provided', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const icon = screen.queryByRole('img', { hidden: true });
    expect(icon).not.toBeInTheDocument();
  });

  // Close Button Tests
  test('renders close button by default', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('btn-close');
  });

  test('does not render close button when showCloseButton is false', () => {
    render(
      <Toast 
        toast={defaultToast} 
        onDismiss={mockOnDismiss}
        showCloseButton={false}
      />
    );
    
    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  test('calls onDismiss when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast-1');
  });

  // Auto Hide Tests
  test('auto hides toast after specified duration', () => {
    const autoHideToast: ToastType = {
      ...defaultToast,
      autoHide: 1000
    };
    
    render(<Toast toast={autoHideToast} onDismiss={mockOnDismiss} />);
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast-1');
  });

  test('does not auto hide when autoHide is 0', () => {
    const noAutoHideToast: ToastType = {
      ...defaultToast,
      autoHide: 0
    };
    
    render(<Toast toast={noAutoHideToast} onDismiss={mockOnDismiss} />);
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  test('does not auto hide when autoHide is undefined', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  // Timestamp Tests
  test('renders timestamp when showTimestamp is true', () => {
    const timestampToast: ToastType = {
      ...defaultToast,
      showTimestamp: true
    };
    
    render(<Toast toast={timestampToast} onDismiss={mockOnDismiss} />);
    
    const timestamp = screen.getByText(/now|just now|\d+\s*(second|minute|hour)s?\s*ago/i);
    expect(timestamp).toBeInTheDocument();
    expect(timestamp).toHaveClass('toast-timestamp');
  });

  test('does not render timestamp when showTimestamp is false', () => {
    const noTimestampToast: ToastType = {
      ...defaultToast,
      showTimestamp: false
    };
    
    render(<Toast toast={noTimestampToast} onDismiss={mockOnDismiss} />);
    
    const timestamp = screen.queryByText(/now|just now|\d+\s*(second|minute|hour)s?\s*ago/i);
    expect(timestamp).not.toBeInTheDocument();
  });

  // Accessibility Tests
  test('has proper ARIA role', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('role', 'alert');
  });

  test('has proper ARIA attributes', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  test('close button has proper ARIA label', () => {
    render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close');
  });

  // Custom Props Tests
  test('applies custom className', () => {
    render(
      <Toast 
        toast={defaultToast} 
        onDismiss={mockOnDismiss}
        className="custom-toast"
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast', 'show', 'custom-toast');
  });

  test('forwards HTML attributes', () => {
    render(
      <Toast 
        toast={defaultToast} 
        onDismiss={mockOnDismiss}
        data-testid="custom-toast"
        id="my-toast"
      />
    );
    
    const toast = screen.getByTestId('custom-toast');
    expect(toast).toHaveAttribute('id', 'my-toast');
  });

  // Complex Content Tests
  test('renders complex message content', () => {
    const complexToast: ToastType = {
      ...defaultToast,
      title: 'File Upload',
      message: 'Your CSV file has been processed successfully. 1,234 transactions imported.',
      variant: 'success',
      icon: 'fa-check-circle'
    };
    
    render(<Toast toast={complexToast} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText(/Your CSV file has been processed successfully/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('fa-check-circle');
  });

  // Animation Tests
  test('applies custom animation duration', () => {
    render(
      <Toast 
        toast={defaultToast} 
        onDismiss={mockOnDismiss}
        animationDuration={500}
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveStyle('--bs-toast-animation-duration: 500ms');
  });

  // Tax Calculator Use Case Tests
  test('renders calculation success notification', () => {
    const successToast: ToastType = {
      id: 'calc-success',
      title: 'Calculation Complete',
      message: 'Your tax calculation has been completed successfully.',
      variant: 'success',
      icon: 'fa-calculator',
      autoHide: 3000
    };
    
    render(<Toast toast={successToast} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Calculation Complete')).toBeInTheDocument();
    expect(screen.getByText(/Your tax calculation has been completed/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('fa-calculator');
  });

  test('renders file upload error notification', () => {
    const errorToast: ToastType = {
      id: 'upload-error',
      title: 'Upload Failed',
      message: 'Unable to process the uploaded file. Please check the format and try again.',
      variant: 'danger',
      icon: 'fa-exclamation-triangle',
      autoHide: 0 // Don't auto-hide errors
    };
    
    render(<Toast toast={errorToast} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    expect(screen.getByText(/Unable to process the uploaded file/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-danger');
    
    const icon = screen.getByRole('img', { hidden: true });  
    expect(icon).toHaveClass('fa-exclamation-triangle');
  });

  test('renders data import progress notification', () => {
    const progressToast: ToastType = {
      id: 'import-progress',
      title: 'Data Import',
      message: 'Processing 1,234 transactions... This may take a moment.',
      variant: 'info',
      icon: 'fa-upload',
      showTimestamp: true
    };
    
    render(<Toast toast={progressToast} onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Data Import')).toBeInTheDocument();
    expect(screen.getByText(/Processing 1,234 transactions/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-info');
    
    const timestamp = screen.getByText(/now|just now|\d+\s*(second|minute|hour)s?\s*ago/i);
    expect(timestamp).toBeInTheDocument();
  });

  // Edge Cases
  test('handles empty message gracefully', () => {
    const emptyToast: ToastType = {
      ...defaultToast,
      message: ''
    };
    
    render(<Toast toast={emptyToast} onDismiss={mockOnDismiss} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
  });

  test('handles long message content', () => {
    const longMessageToast: ToastType = {
      ...defaultToast,
      message: 'This is a very long message that should wrap properly and not break the toast layout. It contains multiple sentences and should demonstrate how the toast handles extensive content gracefully.'
    };
    
    render(<Toast toast={longMessageToast} onDismiss={mockOnDismiss} />);
    
    const message = screen.getByText(/This is a very long message/);
    expect(message).toBeInTheDocument();
  });

  test('cleans up timer on unmount', () => {
    const autoHideToast: ToastType = {
      ...defaultToast,
      autoHide: 1000
    };
    
    const { unmount } = render(<Toast toast={autoHideToast} onDismiss={mockOnDismiss} />);
    
    unmount();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  test('updates timer when autoHide prop changes', () => {
    const initialToast: ToastType = {
      ...defaultToast,
      autoHide: 2000
    };
    
    const { rerender } = render(<Toast toast={initialToast} onDismiss={mockOnDismiss} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
    
    const updatedToast: ToastType = {
      ...defaultToast,
      autoHide: 500
    };
    
    rerender(<Toast toast={updatedToast} onDismiss={mockOnDismiss} />);
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast-1');
  });
});