import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'src'),
    publicDir: path.resolve(__dirname, 'public'),
    base: './', // Use relative paths for assets
    
    // Environment variables and polyfills
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      __API_URL__: JSON.stringify(env.VITE_API_URL || (
        mode === 'production' 
          ? 'https://cgttaxtool.uk/prod' 
          : 'http://localhost:8000'
      )),
      global: 'globalThis',
      // Add Buffer polyfill for gray-matter
      'process.env': {},
    },
    
    build: {
      outDir: path.resolve(__dirname, 'dist'),
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
        },
        plugins: [
          // Add Node.js polyfills for production builds
          NodeGlobalsPolyfillPlugin({
            buffer: true,
          }),
          NodeModulesPolyfillPlugin(),
        ]
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
        // Add polyfills for Node.js modules
        'buffer': 'buffer',
      }
    },
    
    // Polyfill Node.js modules for browser
    optimizeDeps: {
      include: ['buffer', 'gray-matter'],
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true,
          }),
          NodeModulesPolyfillPlugin(),
        ],
      },
    }
  };
});
