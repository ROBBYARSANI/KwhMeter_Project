import React, { createContext, useContext, useState } from 'react';

// Context
export const ThemeContext = createContext({
  darkModeEnabled: true,
  setDarkModeEnabled: () => {},
});

// Provider
export function ThemeProvider({ children }) {
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  return (
    <ThemeContext.Provider value={{ darkModeEnabled, setDarkModeEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useThemeMode() {
  return useContext(ThemeContext);
}
