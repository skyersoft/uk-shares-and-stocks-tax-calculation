import React, { useState, useEffect } from 'react';
import { TabsProps } from '../../types';

/**
 * Tabs component for displaying tabbed content
 * Built on Bootstrap 5 Nav Tabs component with additional customization options
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  defaultActiveTab,
  onTabChange,
  variant = 'tabs',
  justified = false,
  vertical = false,
  fade = true,
  lazy = false,
  className = '',
  ...props
}) => {
  // Find first non-disabled tab
  const getFirstEnabledTab = () => {
    const firstEnabled = items.find(item => !item.disabled);
    return firstEnabled?.id || '';
  };

  // Initialize active tab
  const getInitialActiveTab = () => {
    if (defaultActiveTab) {
      const defaultTab = items.find(item => item.id === defaultActiveTab && !item.disabled);
      if (defaultTab) return defaultActiveTab;
    }
    return getFirstEnabledTab();
  };

  // Internal state for uncontrolled mode
  const [internalActiveTab, setInternalActiveTab] = useState<string>(getInitialActiveTab);
  
  // Keep track of tabs that have been rendered (for lazy loading)
  const [renderedTabs, setRenderedTabs] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (lazy) {
      const initialTab = activeTab || internalActiveTab;
      if (initialTab) initial.add(initialTab);
    } else {
      items.forEach(item => initial.add(item.id));
    }
    return initial;
  });

  // Use controlled active tab if provided, otherwise use internal state
  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;

  // Update rendered tabs when active tab changes
  useEffect(() => {
    if (lazy && currentActiveTab) {
      setRenderedTabs(prev => new Set(prev).add(currentActiveTab));
    }
  }, [currentActiveTab, lazy]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = items.find(item => item.id === tabId);
    if (!tab || tab.disabled) return;

    if (onTabChange) {
      // Controlled mode - let parent handle state
      onTabChange(tabId);
    } else {
      // Uncontrolled mode - manage internal state
      setInternalActiveTab(tabId);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabChange(tabId);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      
      const enabledItems = items.filter(item => !item.disabled);
      const currentIndex = enabledItems.findIndex(item => item.id === tabId);
      
      let nextIndex;
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % enabledItems.length;
      } else {
        nextIndex = currentIndex === 0 ? enabledItems.length - 1 : currentIndex - 1;
      }
      
      const nextTab = enabledItems[nextIndex];
      if (nextTab) {
        const nextTabElement = document.querySelector(`[data-tab-id="${nextTab.id}"] .nav-link`) as HTMLElement;
        nextTabElement?.focus();
      }
    }
  };

  // Generate unique IDs for accessibility
  const generateId = (tabId: string, suffix: string) => {
    return `tab-${tabId}-${suffix}`;
  };

  // Build CSS classes
  const getNavClasses = () => {
    const classes = ['nav'];
    
    switch (variant) {
      case 'pills':
        classes.push('nav-pills');
        break;
      case 'underline':
        classes.push('nav-underline');
        break;
      default:
        classes.push('nav-tabs');
    }
    
    if (justified) classes.push('nav-justified');
    if (vertical) classes.push('flex-column');
    
    return classes.join(' ');
  };

  const getContainerClasses = () => {
    const classes = ['tabs-container'];
    if (vertical) classes.push('d-flex', 'flex-column');
    if (className) classes.push(className);
    return classes.join(' ');
  };

  const getTabPaneClasses = (tabId: string) => {
    const classes = ['tab-pane'];
    if (fade) classes.push('fade');
    if (tabId === currentActiveTab) {
      classes.push('active');
      if (fade) classes.push('show');
    }
    return classes.join(' ');
  };

  return (
    <div className={getContainerClasses()} {...props}>
      <ul className={getNavClasses()} role="tablist">
        {items.map((item) => {
          const tabId = generateId(item.id, 'tab');
          const panelId = generateId(item.id, 'panel');
          const isActive = item.id === currentActiveTab;

          return (
            <li key={item.id} className="nav-item" data-tab-id={item.id}>
              <button
                id={tabId}
                className={`nav-link ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${item.className || ''}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={item.disabled}
                disabled={item.disabled}
                onClick={() => handleTabChange(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="tab-content">
        {items.map((item) => {
          const tabId = generateId(item.id, 'tab');
          const panelId = generateId(item.id, 'panel');
          const shouldRender = !lazy || renderedTabs.has(item.id);

          return (
            <div
              key={item.id}
              id={panelId}
              className={getTabPaneClasses(item.id)}
              role="tabpanel"
              aria-labelledby={tabId}
              data-tab-id={item.id}
            >
              {shouldRender ? item.content : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;