import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardLayoutProvider } from '@/contexts/CardLayoutContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { storageManager } from '@/storage';
import type { Theme } from '@/types/theme';

export default function RootLayout() {
  useEffect(() => {
    storageManager.initialize().catch((error) => {
      console.error('Failed to initialize storage:', error);
    });

    // Apply background from environment variable
    const background = process.env.EXPO_PUBLIC_FOLIO_BACKGROUND || process.env.REACT_APP_FOLIO_BACKGROUND;
    if (background && typeof window !== 'undefined') {
      const applyBackground = () => {
        const body = document.body;
        if (!body) {
          setTimeout(applyBackground, 10);
          return;
        }
        
        const isColor = background.startsWith('#') || background.startsWith('rgb');
        
        if (isColor) {
          body.style.backgroundColor = background;
          body.style.backgroundImage = 'none';
        } else {
          // Use the path exactly as provided in the env var - no manipulation
          const imagePath = background;
          
          console.log('[RootLayout] Using background image path:', imagePath);
          
          // Inject a style tag to ensure the background is applied with high specificity
          const styleId = 'folio-background-style';
          let styleEl = document.getElementById(styleId) as HTMLStyleElement;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = `
            html, body {
              background-image: url("${imagePath}") !important;
              background-size: cover !important;
              background-position: center !important;
              background-attachment: fixed !important;
              background-repeat: no-repeat !important;
              min-height: 100vh !important;
              background-color: transparent !important;
            }
            #root,
            #root > *,
            #root > * > *,
            #root [style*="background-color"] {
              background-color: transparent !important;
            }
          `;
          
          // Also apply directly to ensure it works
          body.style.backgroundImage = `url("${imagePath}")`;
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center';
          body.style.backgroundAttachment = 'fixed';
          body.style.backgroundRepeat = 'no-repeat';
          body.style.minHeight = '100vh';
          body.style.backgroundColor = 'transparent';
          
          const html = document.documentElement;
          if (html) {
            html.style.backgroundImage = `url("${imagePath}")`;
            html.style.backgroundSize = 'cover';
            html.style.backgroundPosition = 'center';
            html.style.backgroundAttachment = 'fixed';
            html.style.backgroundRepeat = 'no-repeat';
            html.style.minHeight = '100vh';
            html.style.backgroundColor = 'transparent';
          }
          
          // Make root container and all React Native Web containers transparent
          const root = document.getElementById('root');
          if (root) {
            (root as HTMLElement).style.backgroundColor = 'transparent';
            // Also make direct children transparent (React Native Web creates nested divs)
            const children = root.children;
            for (let i = 0; i < children.length; i++) {
              const child = children[i] as HTMLElement;
              if (child) {
                child.style.backgroundColor = 'transparent';
                // Also check grandchildren
                const grandchildren = child.children;
                for (let j = 0; j < grandchildren.length; j++) {
                  const grandchild = grandchildren[j] as HTMLElement;
                  if (grandchild) {
                    grandchild.style.backgroundColor = 'transparent';
                  }
                }
              }
            }
          }
        }
      };
      
      // Apply immediately or wait for body
      if (document.body) {
        applyBackground();
      } else {
        setTimeout(applyBackground, 10);
      }
    }

    return () => {
      storageManager.cleanup().catch((error) => {
        console.error('Failed to cleanup storage:', error);
      });
    };
  }, []);

  const initialTheme: Partial<Theme> | undefined = (() => {
    const themeName = process.env.EXPO_PUBLIC_FOLIO_THEME || process.env.REACT_APP_FOLIO_THEME;
    const background = process.env.EXPO_PUBLIC_FOLIO_BACKGROUND || process.env.REACT_APP_FOLIO_BACKGROUND;
    
    if (!themeName && !background) {
      return undefined;
    }
    
    return {
      ...(themeName === 'light' || themeName === 'dark' ? { name: themeName } : {}),
      ...(background ? { background } : {}),
    };
  })();

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <CardLayoutProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </CardLayoutProvider>
    </ThemeProvider>
  );
}

