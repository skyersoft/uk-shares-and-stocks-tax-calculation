import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastVariant, ToastPosition, ToastContextType } from '../../types';
import { ToastContainer } from './ToastContainer';

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook to use toast context
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultAutoHide?: number;
  animationDuration?: number;
  showCloseButton?: boolean;
}

// Toast provider component
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-end',
  maxToasts = 5,
  defaultAutoHide = 5000,
  animationDuration = 300,
  showCloseButton = true
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast
  const addToast = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    options: Partial<Omit<Toast, 'id' | 'message' | 'variant'>> = {}
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      message,
      variant,
      autoHide: defaultAutoHide,
      showTimestamp: false,
      ...options
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [defaultAutoHide]);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showError = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast(message, 'danger', options);
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        maxToasts={maxToasts}
        animationDuration={animationDuration}
        showCloseButton={showCloseButton}
        onDismiss={removeToast}
      />
    </ToastContext.Provider>
  );
};