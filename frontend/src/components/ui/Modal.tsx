import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from '../../types';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  centered = false,
  fade = true,
  header,
  footer,
  ariaLabel,
  ariaLabelledBy,
  zIndex = 1055,
  className = '',
  children,
  style,
  ...props
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Date.now()}`);

  // Handle escape key

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Get all focusable elements within modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(modalRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  // Handle tab key for focus trapping
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!isOpen || event.key !== 'Tab') return;
    
    const focusable = getFocusableElements();
    if (focusable.length === 0) return;
    
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isOpen, getFocusableElements]);

  // Lock/unlock body scroll
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);
      
      // Focus modal after next tick
      const focusTimeout = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 0);

      return () => {
        clearTimeout(focusTimeout);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTabKey);
      };
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to previous element
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        try {
          previousActiveElement.current.focus();
        } catch (error) {
          // Element might be removed from DOM, ignore focus error
        }
      }
    }
  }, [isOpen, handleKeyDown, handleTabKey]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Generate modal classes
  const modalClasses = [
    'modal',
    fade ? 'fade show' : 'show',
    className
  ].filter(Boolean).join(' ');

  const modalDialogClasses = [
    'modal-dialog',
    size !== 'md' ? `modal-${size}` : '',
    centered ? 'modal-dialog-centered' : ''
  ].filter(Boolean).join(' ');

  // Determine ARIA labelledby
  const effectiveAriaLabelledBy = ariaLabelledBy || (title ? titleId.current : undefined);

  const modalElement = (
    <div
      {...props}
      className={modalClasses}
      style={{ zIndex, ...style }}
      onClick={handleBackdropClick}
    >
      <div className={modalDialogClasses}>
        <div
          ref={modalRef}
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={effectiveAriaLabelledBy}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || header || showCloseButton) && (
            <div className="modal-header">
              {header ? (
                header
              ) : (
                <>
                  {title && (
                    <h5 className="modal-title" id={titleId.current}>
                      {title}
                    </h5>
                  )}
                </>
              )}
              
              {showCloseButton && (
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                />
              )}
            </div>
          )}

          {/* Body */}
          <div className="modal-body">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalElement, document.body);
};