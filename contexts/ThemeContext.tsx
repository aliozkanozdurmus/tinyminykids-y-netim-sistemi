import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeSettings, CurrencyCode, LogActionType } from '../types'; 
import { AVAILABLE_ACCENT_COLORS, CURRENCIES, APP_NAME, DEFAULT_LOGO_URL } from '../constants';
import { apiService } from '../services/apiService';

interface ThemeContextType {
  theme: Theme;
  accentColor: string;
  currency: CurrencyCode;
  appName: string;
  logoUrl: string;
  passwordProtectionActive: boolean;
  dataSource: 'localStorage' | 'postgresql';
  backendApiUrl?: string;
  toggleTheme: () => void;
  setAccentColor: (colorName: string) => void;
  setCurrency: (currencyCode: CurrencyCode) => void;
  setAppName: (name: string) => void;
  setLogoUrl: (url: string) => void;
  setPasswordProtectionActive: (isActive: boolean) => void;
  setDataSourceAndApiUrl: (source: 'localStorage' | 'postgresql', apiUrl?: string) => void;
  themeSettings: ThemeSettings;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemeSettings: ThemeSettings = {
  selectedTheme: 'light',
  primaryColor: 'amber', 
  currency: 'TRY',
  appName: APP_NAME,
  logoUrl: DEFAULT_LOGO_URL,
  passwordProtectionActive: false,
  dataSource: 'localStorage',
  backendApiUrl: '',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const storedSettings = localStorage.getItem('themeSettings');
    let parsedSettings = defaultThemeSettings;
    if (storedSettings) {
        try {
            const fromStorage = JSON.parse(storedSettings) as Partial<ThemeSettings>; // Use Partial for robustness
            parsedSettings = {
                selectedTheme: fromStorage.selectedTheme || defaultThemeSettings.selectedTheme,
                primaryColor: AVAILABLE_ACCENT_COLORS[fromStorage.primaryColor || ''] ? fromStorage.primaryColor! : defaultThemeSettings.primaryColor,
                currency: CURRENCIES[fromStorage.currency || ''] ? fromStorage.currency! : defaultThemeSettings.currency,
                appName: fromStorage.appName || defaultThemeSettings.appName,
                logoUrl: fromStorage.logoUrl || defaultThemeSettings.logoUrl,
                passwordProtectionActive: typeof fromStorage.passwordProtectionActive === 'boolean' 
                                            ? fromStorage.passwordProtectionActive 
                                            : defaultThemeSettings.passwordProtectionActive,
                dataSource: fromStorage.dataSource === 'postgresql' ? 'postgresql' : 'localStorage',
                backendApiUrl: fromStorage.backendApiUrl || defaultThemeSettings.backendApiUrl,
            };
        } catch (e) {
            console.error("Failed to parse themeSettings from localStorage, using defaults.", e);
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

    Object.keys(AVAILABLE_ACCENT_COLORS).forEach(color => {
        root.classList.remove(`theme-accent-${color}`);
    });
    const validAccentColorName = AVAILABLE_ACCENT_COLORS[currentAccentColorName] ? currentAccentColorName : defaultThemeSettings.primaryColor;
    root.classList.add(`theme-accent-${validAccentColorName}`);

    const accent = AVAILABLE_ACCENT_COLORS[validAccentColorName] || AVAILABLE_ACCENT_COLORS[defaultThemeSettings.primaryColor];
    
    if (accent && accent.light && accent.DEFAULT && accent.dark) {
        root.style.setProperty('--color-primary-light', accent.light); 
        root.style.setProperty('--color-primary-DEFAULT', accent.DEFAULT);
        root.style.setProperty('--color-primary-dark', accent.dark);
    } else {
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
    try {
      localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
    } catch (error) {
      console.error("Error saving themeSettings to localStorage:", error);
    }
    document.title = themeSettings.appName;
  }, [themeSettings, applyThemeToDOM]);

  const toggleTheme = () => {
    const newTheme = themeSettings.selectedTheme === 'light' ? 'dark' : 'light';
    apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_THEME, `Tema değiştirildi: ${newTheme}`);
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      selectedTheme: newTheme,
    }));
  };

  const setAccentColor = (colorName: string) => {
    if (AVAILABLE_ACCENT_COLORS[colorName]) {
      apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_ACCENT_COLOR, `Vurgu rengi değiştirildi: ${colorName}`);
      setThemeSettings(prevSettings => ({
        ...prevSettings,
        primaryColor: colorName,
      }));
    }
  };

  const setCurrency = (currencyCode: CurrencyCode) => {
    if (CURRENCIES[currencyCode]) {
        apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_CURRENCY, `Para birimi değiştirildi: ${currencyCode}`);
        setThemeSettings(prevSettings => ({
            ...prevSettings,
            currency: currencyCode,
        }));
    }
  };

  const setAppName = (name: string) => {
    const newName = name.trim() || defaultThemeSettings.appName;
    apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_APP_NAME, `Uygulama adı değiştirildi: "${newName}"`);
    setThemeSettings(prevSettings => ({
        ...prevSettings,
        appName: newName, 
    }));
  };

  const setLogoUrl = (url: string) => {
    const newUrl = url.trim() || defaultThemeSettings.logoUrl;
    apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_LOGO_URL, `Logo URL'si değiştirildi: ${newUrl}`);
    setThemeSettings(prevSettings => ({
        ...prevSettings,
        logoUrl: newUrl, 
    }));
  };

  const setPasswordProtectionActive = (isActive: boolean) => {
    apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_PASSWORD_PROTECTION, `Şifre Koruması ${isActive ? 'Aktif Edildi' : 'Devre Dışı Bırakıldı'}.`);
    setThemeSettings(prevSettings => ({
        ...prevSettings,
        passwordProtectionActive: isActive,
    }));
  };

  const setDataSourceAndApiUrl = (source: 'localStorage' | 'postgresql', apiUrl?: string) => {
    const newApiUrl = source === 'postgresql' ? (apiUrl || '').trim() : '';
    apiService.addLogEntry(LogActionType.SETTINGS_UPDATED_DATA_SOURCE, `Veri kaynağı değiştirildi: ${source}. API URL: ${newApiUrl || 'Yok'}`);
    setThemeSettings(prevSettings => ({
        ...prevSettings,
        dataSource: source,
        backendApiUrl: newApiUrl,
    }));
  };
  
  return (
    <ThemeContext.Provider value={{ 
        theme: themeSettings.selectedTheme, 
        accentColor: themeSettings.primaryColor, 
        currency: themeSettings.currency,
        appName: themeSettings.appName,
        logoUrl: themeSettings.logoUrl,
        passwordProtectionActive: themeSettings.passwordProtectionActive,
        dataSource: themeSettings.dataSource,
        backendApiUrl: themeSettings.backendApiUrl,
        toggleTheme, 
        setAccentColor, 
        setCurrency,
        setAppName,
        setLogoUrl,
        setPasswordProtectionActive,
        setDataSourceAndApiUrl,
        themeSettings 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};