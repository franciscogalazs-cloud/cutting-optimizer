import { useEffect, useMemo } from 'react';
import { ThemeContext } from './theme-context.js';

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
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
