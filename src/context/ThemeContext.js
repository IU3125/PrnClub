import React, { createContext, useContext, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Provider component
export function ThemeProvider({ children }) {
  // Always use dark mode
  const darkMode = true;
  
  // Apply dark mode on initial render
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-dark-900');
    document.body.classList.remove('bg-gray-100');
    localStorage.setItem('darkMode', 'true');
  }, []);
  
  const value = {
    darkMode
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 