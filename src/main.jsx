import { StrictMode, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import './styles/theme.css';
import App from './App.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { ErrorBoundary, DefaultErrorFallback } from './components/common/ErrorBoundary.jsx';
import { Toaster } from 'sonner';

// React 18/19 StrictMode provoca doble montaje en dev que puede interferir con
// Portals de Radix (Select/Popover) y disparar NotFoundError al removeChild.
// Usamos StrictMode solo en producción para evitar crasheos en desarrollo.
const StrictWrapper = import.meta.env.PROD ? StrictMode : Fragment;

createRoot(document.getElementById('root')).render(
  <StrictWrapper>
    <ThemeProvider>
      <ErrorBoundary fallback={DefaultErrorFallback}>
        <App />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictWrapper>,
);
