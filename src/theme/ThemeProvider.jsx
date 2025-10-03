import { useEffect, useMemo } from 'react';
import { ThemeContext } from './theme-context.js';

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Forzar tema claro: limpiar cualquier rastro de tema oscuro
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }, []);

  const value = useMemo(
    () => ({
      theme: 'light',
      toggle: () => {},
      set: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
