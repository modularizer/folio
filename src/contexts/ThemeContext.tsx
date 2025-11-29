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

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Partial<Theme>;
}

/**
 * Detect if background is light or dark and return appropriate theme
 * This analyzes the body element's background to determine theme
 */
const detectThemeFromBackground = (): ThemeName => {
  if (typeof window === 'undefined') return 'dark';
  
  try {
    const body = document.body;
    
    // First check for explicit data-theme attribute on body (highest priority)
    if (body.dataset.theme === 'light') {
      return 'light';
    }
    if (body.dataset.theme === 'dark') {
      return 'dark';
    }
    
    // Check for CSS classes
    if (body.classList.contains('light-theme')) {
      return 'light';
    }
    if (body.classList.contains('dark-theme')) {
      return 'dark';
    }
    
    const computedStyle = window.getComputedStyle(body);
    
    // Check background-color (simpler case)
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      // Parse RGB values
      const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        // Calculate relative luminance (perceived brightness)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // If luminance > 0.5, it's light, otherwise dark
        return luminance > 0.5 ? 'light' : 'dark';
      }
    }
    
    // Check background-image
    const bgImage = computedStyle.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      // If there's a background image, we can't easily analyze it without loading it
      // For now, default to dark mode for images (safer for glass morphism)
      // In the future, could load image and analyze pixel brightness
      return 'dark';
    }
    
    // Default to dark
    return 'dark';
  } catch (error) {
    console.warn('[ThemeProvider] Failed to detect theme from background:', error);
    return 'dark';
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
  // Try to detect theme from background on mount, but respect initialTheme if provided
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // If initialTheme specifies a theme name, use it
    if (initialTheme?.name === 'light' || initialTheme?.name === 'dark') {
      return initialTheme.name;
    }
    // Only detect on client side
    if (typeof window !== 'undefined') {
      return detectThemeFromBackground();
    }
    return 'dark';
  });
  const [background, setBackground] = useState<BackgroundSource | undefined>(
    initialTheme?.background || undefined
  );

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
    
    // Re-detect theme after a short delay to ensure background is loaded
    const timer = setTimeout(() => {
      const detectedTheme = detectThemeFromBackground();
      if (detectedTheme !== themeName) {
        setThemeName(detectedTheme);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const theme: Theme = {
    ...themes[themeName],
    ...(initialTheme || {}),
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

