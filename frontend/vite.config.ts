import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'src'),
    base: './', // Use relative paths for assets
    
    // Environment variables
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      __API_URL__: JSON.stringify(env.VITE_API_URL || (
        mode === 'production' 
          ? 'https://cgttaxtool.uk/prod' 
          : 'http://localhost:8000'
      )),
    },
    
    build: {
      outDir: path.resolve(__dirname, '../static/spa'),
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/index.html'),
        output: {
          // Manual chunks for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            bootstrap: ['bootstrap'],
          }
        }
      }
    },
    
    server: {
      port: 5173,
      host: true,
      // Proxy API calls during development
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/prod')
        }
      }
    },
    
    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production' 
          ? '[hash:base64:5]' 
          : '[name]__[local]___[hash:base64:5]'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "${path.resolve(__dirname, 'src/styles/variables.scss')}";`,
          // Suppress Bootstrap deprecation warnings until Bootstrap updates for Dart Sass 3.0
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions']
        }
      }
    },
    
    // Resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@context': path.resolve(__dirname, 'src/context'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
      }
    }
  };
});
