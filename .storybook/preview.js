import React from 'react';

// Import our global styles
import '../frontend/src/styles/global.scss';

// Import providers for context
import { CalculationProvider } from '../frontend/src/context/CalculationContext';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    // Actions panel
    actions: { argTypesRegex: "^on[A-Z].*" },
    
    // Controls panel
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    
    // Docs configuration
    docs: {
      extractComponentDescription: (component, { notes }) => {
        if (notes) {
          return typeof notes === 'string' ? notes : notes.markdown || notes.text;
        }
        return null;
      },
    },
    
    // Layout options
    layout: 'padded',
    
    // Viewport configuration
    viewport: {
      viewports: {
        mobile1: {
          name: 'Small mobile',
          styles: { width: '320px', height: '568px' },
          type: 'mobile',
        },
        mobile2: {
          name: 'Large mobile',
          styles: { width: '414px', height: '896px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '1366px' },
          type: 'desktop',
        },
      },
    },
    
    // Background options
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#333333' },
        { name: 'brand', value: '#2563eb' },
      ]
    }
  },
  
  // Global decorators
  decorators: [
    (Story, context) => {
      // Wrap stories with our context providers
      return (
        <CalculationProvider>
          <div style={{ margin: '1rem' }}>
            <Story {...context} />
          </div>
        </CalculationProvider>
      );
    },
  ],
  
  // Global types for toolbar
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;