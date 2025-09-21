import React, { useEffect, useRef } from 'react';
import { ToastProps } from '../../types';

export const Toast: React.FC<ToastProps> = ({
  toast,
  onDismiss,
  animationDuration = 300,
  showCloseButton = true,
  className = '',
  style = {},
  ...props
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide functionality
  useEffect(() => {
    if (toast.autoHide && toast.autoHide > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.autoHide);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.autoHide, toast.id, onDismiss]);

  // Handle dismiss
  const handleDismiss = () => {
    onDismiss(toast.id);
  };

  // Generate variant class
  const variantClass = toast.variant ? `toast-${toast.variant}` : '';

  // Generate timestamp
  const getTimestamp = () => {
    return 'just now'; // Simplified for now, could be enhanced with actual time logic
  };

  // Build toast classes
  const toastClasses = [
    'toast',
    'show',
    variantClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      {...props}
      className={toastClasses}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        '--bs-toast-animation-duration': `${animationDuration}ms`,
        ...style
      } as React.CSSProperties}
    >
      {toast.title && (
        <strong className="toast-header me-auto">
          {toast.icon && (
            <i 
              className={`fas ${toast.icon} me-2`} 
              role="img"
              aria-hidden="true"
            />
          )}
          {toast.title}
          {toast.showTimestamp && (
            <small className="toast-timestamp text-muted ms-2">
              {getTimestamp()}
            </small>
          )}
          {showCloseButton && (
            <button
              type="button"
              className="btn-close ms-auto"
              aria-label="Close"
              onClick={handleDismiss}
            />
          )}
        </strong>
      )}
      
      <div className="toast-body">
        {!toast.title && toast.icon && (
          <i 
            className={`fas ${toast.icon} me-2`} 
            role="img"
            aria-hidden="true"
          />
        )}
        {toast.message}
        
        {!toast.title && showCloseButton && (
          <button
            type="button"
            className="btn-close btn-close-white position-absolute top-50 end-0 translate-middle-y me-2"
            aria-label="Close"
            onClick={handleDismiss}
          />
        )}
        
        {!toast.title && toast.showTimestamp && (
          <div className="toast-timestamp text-muted small mt-1">
            {getTimestamp()}
          </div>
        )}
      </div>
    </div>
  );
};