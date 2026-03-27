import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from '../theme/theme';

const THEME_KEY = '@prbook_theme_preference';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored) setThemeMode(stored);
      setIsLoaded(true);
    });
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const setSystemTheme = async () => {
    setThemeMode('system');
    await AsyncStorage.removeItem(THEME_KEY);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, toggleTheme, setSystemTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
};
