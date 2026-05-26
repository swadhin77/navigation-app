// src/Frontend/Other/Theam.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import "./Theam.css";

// Create Theme Context
const ThemeContext = createContext();

// Custom Hook
export const useTheme = () => useContext(ThemeContext);

// Theme Provider
export const ThemeProvider = ({ children }) => {

  // Get initial theme (localStorage → system → default light)
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme) return savedTheme;

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to <html>
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem("themeMode", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("themeMode", "light");
    }
  }, [theme]);

  // Toggle
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};