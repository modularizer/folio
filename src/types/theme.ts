import { ReactElement } from 'react';

export type ThemeName = 'dark' | 'light';

/**
 * Background source for themes - can be a URL, local asset path, or React element
 */
export type BackgroundSource = 
  | string // URL or local asset path
  | ReactElement; // Custom React component/element

export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string; // Darker gray for muted text on gray backgrounds
    border: string;
    cardBackground: string;
  };
  /**
   * Background image or element.
   * Can be a URL, local asset path, or a React element.
   */
  background?: BackgroundSource;
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    primary: '#ffffff',
    secondary: '#888888',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#777', // Darker gray for muted text on gray backgrounds
    border: '#333333',
    cardBackground: 'rgba(26, 26, 26, 0.8)',
  },
  background: undefined, // Will be set by user profile
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    primary: '#000000',
    secondary: '#666666',
    text: '#000000',
    textSecondary: '#333333',
    textTertiary: '#666666', // Darker gray for muted text on gray backgrounds
    border: '#e0e0e0',
    cardBackground: 'rgba(255, 255, 255, 0.9)',
  },
  background: undefined,
};

export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

