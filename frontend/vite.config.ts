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
    ssgOptions: {
      entry: 'main.tsx',
      dirStyle: 'nested',
      includedRoutes(paths: string[], routes: any[]) {
        // Read the pre-generated index.json to get all valid blog slugs for SSG
        const fs = require('fs');
        const indexPath = path.resolve(__dirname, 'public/blog/index.json');
        const postRoutes: string[] = [];

        if (fs.existsSync(indexPath)) {
          try {
            const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            indexData.forEach((post: { slug: string }) => {
              if (post.slug) {
                postRoutes.push(`/blog/post/${post.slug}`);
              }
            });
          } catch (e) {
            console.error("Failed to parse blog index for SSG:", e);
          }
        }
        console.log("SSG Paths received:", paths);
        console.log("SSG Post Routes:", postRoutes);

        // Remove any dynamic routes with colons that might have slipped through
        const staticPaths = paths.filter(route => !route.includes(':'));
        // Return original paths plus dynamically discovered blog post routes
        return [...staticPaths, ...postRoutes];
      }
    },
    root: path.resolve(__dirname, 'src'),
    publicDir: path.resolve(__dirname, 'public'),
    base: '/', // Use absolute paths for assets to support nested SSG routes

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
          // Chunking is now handled by Vite defaults to support SSR build
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

    ssr: {
      noExternal: ['react-helmet-async'],
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
      include: ['buffer'],
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
