import React from 'react';
import { Toast as ToastComponent } from './Toast';
import { ToastContainerProps } from '../../types';

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts = [],
  position = 'top-end',
  maxToasts = 5,
  animationDuration = 300,
  showCloseButton = true,
  className = '',
  onDismiss
}) => {
  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-start':
        return 'toast-container position-fixed top-0 start-0';
      case 'top-center':
        return 'toast-container position-fixed top-0 start-50 translate-middle-x';
      case 'top-end':
        return 'toast-container position-fixed top-0 end-0';
      case 'middle-start':
        return 'toast-container position-fixed top-50 start-0 translate-middle-y';
      case 'middle-center':
        return 'toast-container position-fixed top-50 start-50 translate-middle';
      case 'middle-end':
        return 'toast-container position-fixed top-50 end-0 translate-middle-y';
      case 'bottom-start':
        return 'toast-container position-fixed bottom-0 start-0';
      case 'bottom-center':
        return 'toast-container position-fixed bottom-0 start-50 translate-middle-x';
      case 'bottom-end':
        return 'toast-container position-fixed bottom-0 end-0';
      default:
        return 'toast-container position-fixed top-0 end-0';
    }
  };

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className={`${getPositionClasses()} p-3 ${className}`}>
      {visibleToasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          animationDuration={animationDuration}
          showCloseButton={showCloseButton}
        />
      ))}
    </div>
  );
};