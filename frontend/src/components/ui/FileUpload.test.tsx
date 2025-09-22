import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUpload } from './FileUpload';

// Helper function to simulate file upload
const simulateFileUpload = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
  });
  fireEvent.change(fileInput);
};

describe('FileUpload Component', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic Rendering Tests
  it('renders file upload area with default props', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/drag & drop your csv or qfx file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/max size: 10mb/i)).toBeInTheDocument();
  });

  it('renders hidden file input with correct attributes', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.csv,.qfx,.ofx');
    expect(fileInput).toHaveAttribute('aria-label', 'Upload IBKR transaction file');
    expect(fileInput).toHaveStyle({ display: 'none' });
  });

  // File Validation Tests
  it('accepts valid CSV files', async () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

    simulateFileUpload(fileInput, validFile);

    // Should show uploading state briefly
    expect(screen.getByText(/uploading file.../i)).toBeInTheDocument();

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
    }, { timeout: 3000 });
  });

  it('rejects invalid file types', async () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    simulateFileUpload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/Upload Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('rejects files that are too large', async () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} maxSize={1024} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(largeFile, 'size', { value: 2048 });

    simulateFileUpload(fileInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/Upload Error:/)).toBeInTheDocument();
      expect(screen.getByText(/File too large/)).toBeInTheDocument();
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  // Drag and Drop Tests
  it('handles drag over events', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    const uploadArea = container.querySelector('.upload-area');

    fireEvent.dragOver(uploadArea!, { dataTransfer: { files: [] } });

    expect(uploadArea).toHaveClass('drag-over');
  });

  it('handles file drop', async () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    const uploadArea = container.querySelector('.upload-area');
    const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

    fireEvent.drop(uploadArea!, {
      dataTransfer: { files: [validFile] },
    });

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
    }, { timeout: 3000 });
  });

  // Disabled State Tests
  it('applies disabled styling when disabled', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
    const uploadArea = container.querySelector('.upload-area');

    expect(uploadArea).toHaveClass('disabled');
    expect(uploadArea).toHaveStyle({ cursor: 'not-allowed', opacity: 0.6 });
  });

  it('disables file input when disabled', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeDisabled();
  });

  // Error Handling Tests
  it('allows dismissing error messages', async () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    simulateFileUpload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/Upload Error:/)).toBeInTheDocument();
    }, { timeout: 3000 });

    const dismissButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Upload Error:/)).not.toBeInTheDocument();
  });

  // Props Tests
  it('accepts custom accept prop', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} accept=".xlsx,.csv" />);
    
    expect(screen.getByText(/supported formats: .xlsx,.csv/i)).toBeInTheDocument();
  });

  it('displays custom max size', () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    render(<FileUpload onFileSelect={mockOnFileSelect} maxSize={maxSize} />);
    
    expect(screen.getByText(/max size: 5mb/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});