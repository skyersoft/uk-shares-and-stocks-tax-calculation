import React from 'react';

// Import our global styles
import '../frontend/src/styles/global.scss';

// Import providers for context - Create a simple mock for now
const CalculationProvider = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'calculation-provider' }, children);
};

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    // Controls panel
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    
    // Layout options
    layout: 'padded',
    
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
      return React.createElement(
        CalculationProvider,
        {},
        React.createElement(
          'div',
          { style: { margin: '1rem' } },
          React.createElement(Story, context)
        )
      );
    },
  ],
};

export default preview;