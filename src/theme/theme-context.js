import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  toggle: () => {},
  set: () => {},
});

export const useTheme = () => useContext(ThemeContext);
