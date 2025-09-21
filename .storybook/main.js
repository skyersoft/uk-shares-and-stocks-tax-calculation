

import path from 'path';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../frontend/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../frontend/src/**/*.mdx"
  ],
  "previewHead": (head) => `
    ${head}
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  `,
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "viteFinal": async (config) => {
    // Merge with our Vite config
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../frontend/src'),
      '@components': path.resolve(__dirname, '../frontend/src/components'),
      '@pages': path.resolve(__dirname, '../frontend/src/pages'),
      '@services': path.resolve(__dirname, '../frontend/src/services'),
      '@utils': path.resolve(__dirname, '../frontend/src/utils'),
      '@styles': path.resolve(__dirname, '../frontend/src/styles'),
      '@context': path.resolve(__dirname, '../frontend/src/context'),
      '@hooks': path.resolve(__dirname, '../frontend/src/hooks'),
    };
    
    // Handle CSS modules
    config.css = {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }
    };
    
    return config;
  },
  "typescript": {
    "reactDocgen": "react-docgen-typescript",
    "reactDocgenTypescriptOptions": {
      "shouldExtractLiteralValuesFromEnum": true,
      "propFilter": (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  }
};

export default config;