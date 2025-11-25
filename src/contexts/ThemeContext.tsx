import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Theme, ThemeName, themes, BackgroundSource } from '@/types/theme';
import { storageManager } from '@/storage';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  setBackground: (background: BackgroundSource | undefined) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [background, setBackground] = useState<BackgroundSource | undefined>(undefined);

  // Load background from user profile on mount
  // Wait for StorageManager to be initialized first
  useEffect(() => {
    const loadProfileBackground = async () => {
      try {
        // Ensure StorageManager is initialized before accessing it
        // If it's already initialized, this will return immediately
        await storageManager.initialize();
        
        const profile = await storageManager.getUserProfile();
        if (profile.background) {
          setBackground(profile.background);
        }
      } catch (error) {
        // Silently fail - background is optional
        // Only log if it's not an initialization error
        if (!(error instanceof Error && error.message.includes('not initialized'))) {
          console.error('Failed to load profile background:', error);
        }
      }
    };
    loadProfileBackground();
  }, []);

  const theme: Theme = {
    ...themes[themeName],
    background,
  };

  const setThemeHandler = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
  };

  const setBackgroundHandler = (newBackground: BackgroundSource | undefined) => {
    setBackground(newBackground);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        setTheme: setThemeHandler,
        setBackground: setBackgroundHandler,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

