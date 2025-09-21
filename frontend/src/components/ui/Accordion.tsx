import React, { useState } from 'react';
import { AccordionProps } from '../../types';

/**
 * Accordion component for displaying collapsible content panels
 * Built on Bootstrap 5 Accordion component with additional customization options
 */
export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultExpanded = [],
  expanded,
  onToggle,
  bordered = false,
  flush = false,
  className = '',
  ...props
}) => {
  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = useState<string[]>(() => {
    // Filter out disabled items from defaultExpanded
    return defaultExpanded.filter(itemId => {
      const item = items.find(i => i.id === itemId);
      return item && !item.disabled;
    });
  });

  // Use controlled expanded state if provided, otherwise use internal state
  const expandedItems = expanded !== undefined ? expanded : internalExpanded;

  // Handle accordion item toggle
  const handleToggle = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.disabled) return;

    const isCurrentlyExpanded = expandedItems.includes(itemId);
    const newExpanded = isCurrentlyExpanded;

    if (onToggle) {
      // Controlled mode - let parent handle state
      onToggle(itemId, !newExpanded);
    } else {
      // Uncontrolled mode - manage internal state
      setInternalExpanded(prev => {
        if (isCurrentlyExpanded) {
          // Collapse the item
          return prev.filter(id => id !== itemId);
        } else {
          // Expand the item
          if (allowMultiple) {
            return [...prev, itemId];
          } else {
            return [itemId]; // Only one item can be expanded
          }
        }
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle(itemId);
    }
  };

  // Generate unique IDs for accessibility
  const generateId = (itemId: string, suffix: string) => {
    return `accordion-${itemId}-${suffix}`;
  };

  // Build CSS classes
  const accordionClasses = [
    'accordion',
    bordered && 'accordion-bordered',
    flush && 'accordion-flush',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={accordionClasses} {...props}>
      {items.map((item) => {
        const isExpanded = expandedItems.includes(item.id);
        const headerId = generateId(item.id, 'header');
        const collapseId = generateId(item.id, 'collapse');

        return (
          <div
            key={item.id}
            className={`accordion-item ${item.className || ''}`}
            data-item-id={item.id}
          >
            <h2 className="accordion-header" id={headerId}>
              <button
                className={`accordion-button ${isExpanded ? '' : 'collapsed'}`}
                type="button"
                disabled={item.disabled}
                aria-expanded={isExpanded}
                aria-controls={collapseId}
                aria-disabled={item.disabled}
                onClick={() => handleToggle(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
              >
                {item.header}
              </button>
            </h2>
            <div
              id={collapseId}
              className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}
              aria-labelledby={headerId}
              data-bs-parent={!allowMultiple ? `#${(props as any).id || 'accordion'}` : undefined}
            >
              <div className="accordion-body">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;