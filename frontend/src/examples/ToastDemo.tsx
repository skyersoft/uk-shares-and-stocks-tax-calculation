import React from 'react';
import { ToastProvider, useToast, Button } from '../components/ui';

// Example component showing how to use the toast system
const ToastDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, addToast } = useToast();

  const handleShowSuccess = () => {
    showSuccess('Calculation completed successfully!', {
      icon: 'fa-check-circle',
      showTimestamp: true,
      autoHide: 5000
    });
  };

  const handleShowError = () => {
    showError('Failed to upload file. Please try again.', {
      icon: 'fa-exclamation-triangle',
      showTimestamp: true,
      autoHide: 8000
    });
  };

  const handleShowWarning = () => {
    showWarning('Some transactions may need manual review.', {
      icon: 'fa-exclamation-circle',
      showTimestamp: true
    });
  };

  const handleShowInfo = () => {
    showInfo('Processing your tax data...', {
      icon: 'fa-info-circle',
      showTimestamp: true,
      autoHide: 3000
    });
  };

  const handleCustomToast = () => {
    addToast(
      'This is a custom toast with all features',
      'info',
      {
        title: 'Custom Toast',
        icon: 'fa-cog',
        showTimestamp: true,
        autoHide: 10000
      }
    );
  };

  return (
    <div className="container py-4">
      <h2>Toast Notification Demo</h2>
      <p>Click the buttons below to see different types of toast notifications:</p>
      
      <div className="d-flex gap-2 flex-wrap">
        <Button variant="success" onClick={handleShowSuccess}>
          Show Success Toast
        </Button>
        
        <Button variant="danger" onClick={handleShowError}>
          Show Error Toast
        </Button>
        
        <Button variant="warning" onClick={handleShowWarning}>
          Show Warning Toast
        </Button>
        
        <Button variant="info" onClick={handleShowInfo}>
          Show Info Toast
        </Button>
        
        <Button variant="primary" onClick={handleCustomToast}>
          Show Custom Toast
        </Button>
      </div>

      <div className="mt-4">
        <h4>Usage Examples:</h4>
        <div className="bg-light p-3 rounded">
          <h6>Basic Usage:</h6>
          <pre><code>{`import { useToast } from 'components/ui';

const MyComponent = () => {
  const { showSuccess, showError } = useToast();
  
  const handleSuccess = () => {
    showSuccess('Operation completed!');
  };
  
  return <button onClick={handleSuccess}>Success</button>;
};`}</code></pre>

          <h6 className="mt-3">With Options:</h6>
          <pre><code>{`showError('Upload failed', {
  title: 'Error',
  icon: 'fa-exclamation-triangle',
  showTimestamp: true,
  autoHide: 8000
});`}</code></pre>

          <h6 className="mt-3">App Setup:</h6>
          <pre><code>{`import { ToastProvider } from 'components/ui';

function App() {
  return (
    <ToastProvider position="top-end" maxToasts={5}>
      <YourAppContent />
    </ToastProvider>
  );
}`}</code></pre>
        </div>
      </div>
    </div>
  );
};

// Main App wrapper that shows how to setup the ToastProvider
const ToastDemoApp: React.FC = () => {
  return (
    <ToastProvider
      position="top-end"
      maxToasts={5}
      defaultAutoHide={5000}
      showCloseButton={true}
    >
      <ToastDemo />
    </ToastProvider>
  );
};

export default ToastDemoApp;