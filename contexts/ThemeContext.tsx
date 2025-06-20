import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeSettings } from '../types';
import { AVAILABLE_ACCENT_COLORS } from '../constants';

interface ThemeContextType {
  theme: Theme;
  accentColor: string;
  toggleTheme: () => void;
  setAccentColor: (colorName: string) => void;
  themeSettings: ThemeSettings;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemeSettings: ThemeSettings = {
  selectedTheme: 'light',
  primaryColor: 'amber', // Default accent color name, updated for TinyMinyKids
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const storedSettings = localStorage.getItem('themeSettings');
    let parsedSettings = defaultThemeSettings;
    if (storedSettings) {
        try {
            parsedSettings = JSON.parse(storedSettings);
            // Ensure primaryColor from storage is valid, otherwise fallback
            if (!AVAILABLE_ACCENT_COLORS[parsedSettings.primaryColor]) {
                parsedSettings.primaryColor = defaultThemeSettings.primaryColor;
            }
        } catch (e) {
            // If parsing fails, use default
            parsedSettings = defaultThemeSettings;
        }
    }
    return parsedSettings;
  });

  const applyThemeToDOM = useCallback((currentTheme: Theme, currentAccentColorName: string) => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Remove old accent color classes (still useful for potential direct class usage elsewhere)
    Object.keys(AVAILABLE_ACCENT_COLORS).forEach(color => {
        root.classList.remove(`theme-accent-${color}`);
    });
    const validAccentColorName = AVAILABLE_ACCENT_COLORS[currentAccentColorName] ? currentAccentColorName : defaultThemeSettings.primaryColor;
    root.classList.add(`theme-accent-${validAccentColorName}`);

    const accent = AVAILABLE_ACCENT_COLORS[validAccentColorName] || AVAILABLE_ACCENT_COLORS[defaultThemeSettings.primaryColor];
    
    // Set CSS variables with actual hex values
    if (accent && accent.light && accent.DEFAULT && accent.dark) {
        root.style.setProperty('--color-primary-light', accent.light); 
        root.style.setProperty('--color-primary-DEFAULT', accent.DEFAULT);
        root.style.setProperty('--color-primary-dark', accent.dark);
    } else {
        // Fallback if the accent color is somehow invalid (should not happen with validation)
        const fallbackAccent = AVAILABLE_ACCENT_COLORS[defaultThemeSettings.primaryColor];
        if (fallbackAccent && fallbackAccent.light && fallbackAccent.DEFAULT && fallbackAccent.dark) {
            root.style.setProperty('--color-primary-light', fallbackAccent.light);
            root.style.setProperty('--color-primary-DEFAULT', fallbackAccent.DEFAULT);
            root.style.setProperty('--color-primary-dark', fallbackAccent.dark);
        }
    }
  }, []);


  useEffect(() => {
    applyThemeToDOM(themeSettings.selectedTheme, themeSettings.primaryColor);
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings, applyThemeToDOM]);

  const toggleTheme = () => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      selectedTheme: prevSettings.selectedTheme === 'light' ? 'dark' : 'light',
    }));
  };

  const setAccentColor = (colorName: string) => {
    if (AVAILABLE_ACCENT_COLORS[colorName]) {
      setThemeSettings(prevSettings => ({
        ...prevSettings,
        primaryColor: colorName,
      }));
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme: themeSettings.selectedTheme, accentColor: themeSettings.primaryColor, toggleTheme, setAccentColor, themeSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};