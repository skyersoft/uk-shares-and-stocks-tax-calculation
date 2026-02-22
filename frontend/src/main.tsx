
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Import global styles (overrides Bootstrap where needed)
import './styles/app.css';

console.log('[SPA] Starting React application SSG entry...');

export const createRoot = ViteReactSSG(
  { routes },
  ({ isClient }) => {
    if (isClient) {
      console.log('[SPA] Client app hydration started');
      import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }
);
