import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggle: () => {},
  set: () => {},
});

const storageKey = 'cutting-optimizer-theme';

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(storageKey);
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (!localStorage.getItem(storageKey)) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    set: setTheme,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

