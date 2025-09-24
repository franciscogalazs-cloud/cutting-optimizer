import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import './styles/theme.css';
import App from './App.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { ErrorBoundary, DefaultErrorFallback } from './components/common/ErrorBoundary.jsx';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary fallback={DefaultErrorFallback}>
        <App />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
