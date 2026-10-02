import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './utils/safeLocalStorage';
import App from './App';
import { CrossFilterProvider } from './context/CrossFilterContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { clearAllCaches } from './utils/hybridCacheService';
import './index.css';

// Purga automática de cache residual para garantir dados 100% frescos do Firestore
if (typeof window !== 'undefined') {
  clearAllCaches().catch(() => {});
}

if (typeof window !== 'undefined') {
  // Capture unhandled errors and suppress generic iframe "Script error."
  window.onerror = function (message, source, lineno, colno, error) {
    if (
      message === 'Script error.' ||
      !message ||
      String(message).toLowerCase().includes('script error') ||
      (error && String(error).toLowerCase().includes('script error'))
    ) {
      // Suppress cross-origin iframe errors
      return true;
    }
    console.warn('[Platform Safe Handler] Global window error:', message, error);
    return true; // Prevent noisy host reporting
  };

  window.addEventListener(
    'error',
    (event) => {
      // Intercept generic iframe cross-origin script error or minor resource errors
      if (
        event.message === 'Script error.' ||
        !event.message ||
        String(event.message).toLowerCase().includes('script error') ||
        (event.error && String(event.error).toLowerCase().includes('script error'))
      ) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        return;
      }
      console.warn('[Platform Safe Handler] Global window error event:', event.message || event.error);
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Platform Safe Handler] Unhandled promise rejection:', event.reason);
    try {
      if (event.preventDefault) event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    } catch (_) {}
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <CrossFilterProvider>
          <App />
        </CrossFilterProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
