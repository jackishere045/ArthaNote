import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to false (light mode)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('isDark');
      return savedTheme ? JSON.parse(savedTheme) : false;
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDark(prevIsDark => {
      const newIsDark = !prevIsDark;
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('isDark', JSON.stringify(newIsDark));
      }
      return newIsDark;
    });
  };

  // Apply theme class to document body for global styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = isDark ? 'dark-theme' : 'light-theme';
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? "dark" : "light"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};