/**
 * Bundle Entry Point
 * 
 * Auto-initializes the app when loaded via script tag with init=true parameter or data-init="true" attribute.
 * 
 * Supports configuration via (in priority order, highest first):
 * - URL query params (page-level): ?theme=light&background=assets/image.png
 * - Script tag query parameters: ?username=modularizer&init=true&token=...&theme=dark&background=...
 * - Data attributes: data-username="modularizer" data-init="true" data-token="..." data-theme="dark" data-background="..."
 * - Environment variables: EXPO_PUBLIC_FOLIO_BACKGROUND, EXPO_PUBLIC_FOLIO_THEME, etc.
 * 
 * Theme options:
 * - data-theme="light" or data-theme="dark" (or ?theme=light/dark)
 * - Also checks body[data-theme] attribute
 * 
 * Background options:
 * - data-background="color" or data-background="url(...)" (or ?background=...)
 * - Can be a CSS color (e.g., "#ff0000", "rgba(255,0,0,0.5)") or image URL/path
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BundleApp } from './bundle/BundleApp';

/**
 * Find the script tag that loaded this bundle
 */
function findBundleScript(): HTMLScriptElement | null {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.src;
    if (src && (src.includes('folio.bundle.js') || src.includes('folio.bundle'))) {
      return script;
    }
  }
  return null;
}

/**
 * Get base path from data attribute only (not from script URL)
 */
function getBasePath(script: HTMLScriptElement | null): string {
  if (!script) return '';
  
  // Check for explicit data-base-path attribute only
  const dataBasePath = script.getAttribute('data-base-path');
  if (dataBasePath !== null) {
    return dataBasePath;
  }
  
  // Default: no base path
  return '';
}

/**
 * Process username special keywords
 * - "subdomain": Extract first subdomain from hostname
 * - "domain": Extract domain name from hostname
 * - "route": Extract last path segment from pathname
 */
function processUsername(username: string | undefined): string | undefined {
  if (!username) return username;
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (username === 'subdomain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
  }
  
  if (username === 'domain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
  }
  
  if (username === 'route') {
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  
  return username;
}

/**
 * Parse configuration from script tag
 * Supports both query parameters and data attributes
 */
function parseConfig(): {
  shouldInit: boolean;
  githubUsername?: string;
  githubToken?: string;
  basePath: string;
  theme?: 'light' | 'dark';
  background?: string;
} {
  const script = findBundleScript();
  
  // Check for init flag
  let shouldInit = false;
  let githubUsername: string | undefined;
  let githubToken: string | undefined;
  let basePath = '';
  let theme: 'light' | 'dark' | undefined;
  let background: string | undefined;
  
  if (script) {
    // Check data attributes first
    const dataInit = script.getAttribute('data-init');
    shouldInit = dataInit === 'true' || dataInit === '';
    
    const dataUsername = script.getAttribute('data-username');
    const dataToken = script.getAttribute('data-token');
    const dataTheme = script.getAttribute('data-theme');
    const dataBackground = script.getAttribute('data-background');
    basePath = getBasePath(script);
    
    console.log('[bundle-entry] Found script tag with attributes:', {
      dataInit,
      dataUsername,
      dataToken: dataToken ? '***' : undefined,
      dataTheme,
      dataBackground,
    });
    
    // Parse query parameters from script src URL
    const scriptSrc = script.src;
    if (scriptSrc) {
      try {
        const url = new URL(scriptSrc);
        const params = url.searchParams;
        
        // Query params override data attributes
        if (params.has('init')) {
          shouldInit = params.get('init') === 'true';
        }
        if (params.has('username')) {
          githubUsername = params.get('username') || undefined;
        } else if (dataUsername) {
          githubUsername = dataUsername;
        }
        if (params.has('token')) {
          githubToken = params.get('token') || undefined;
        } else if (dataToken) {
          githubToken = dataToken;
        }
        if (params.has('theme')) {
          const themeParam = params.get('theme');
          if (themeParam === 'light' || themeParam === 'dark') {
            theme = themeParam;
          }
        } else if (dataTheme === 'light' || dataTheme === 'dark') {
          theme = dataTheme;
        }
        if (params.has('background')) {
          background = params.get('background') || undefined;
        } else if (dataBackground) {
          background = dataBackground;
        }
      } catch (e) {
        console.warn('[bundle-entry] Failed to parse script URL:', e);
      }
    } else {
      // No src URL, use data attributes only
      if (dataUsername) {
        githubUsername = dataUsername;
      }
      if (dataToken) {
        githubToken = dataToken;
      }
      if (dataTheme === 'light' || dataTheme === 'dark') {
        theme = dataTheme;
      }
      if (dataBackground) {
        background = dataBackground;
      }
    }
  }
  
  // Also check URL query parameters (for page-level overrides)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('theme')) {
      const themeParam = urlParams.get('theme');
      if (themeParam === 'light' || themeParam === 'dark') {
        theme = themeParam;
      }
    }
    if (urlParams.has('background')) {
      background = urlParams.get('background') || background;
    }
  } catch (e) {
    // Ignore errors parsing URL
  }
  
  // Check environment variables (lowest priority, only if not set via other methods)
  // Support both EXPO_PUBLIC_ and REACT_APP_ prefixes for compatibility
  // Note: webpack DefinePlugin replaces process.env.VAR_NAME with the actual string value at build time
  if (theme === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envTheme = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FOLIO_THEME) 
      || (typeof process !== 'undefined' && process.env?.REACT_APP_FOLIO_THEME);
    if (envTheme === 'light' || envTheme === 'dark') {
      theme = envTheme;
    }
  }
  if (background === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envBackground = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FOLIO_BACKGROUND)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_FOLIO_BACKGROUND);
    if (envBackground) {
      background = envBackground;
    }
  }
  if (githubUsername === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envUsername = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GITHUB_USERNAME)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_GITHUB_USERNAME);
    if (envUsername) {
      githubUsername = envUsername;
    }
  }
  if (githubToken === undefined) {
    // @ts-ignore - webpack DefinePlugin replaces these at build time
    const envToken = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GITHUB_TOKEN)
      || (typeof process !== 'undefined' && process.env?.REACT_APP_GITHUB_TOKEN);
    if (envToken) {
      githubToken = envToken;
    }
  }
  
  // Process username special keywords
  githubUsername = processUsername(githubUsername);
  
  return {
    shouldInit,
    githubUsername,
    githubToken,
    basePath,
    theme,
    background,
  };
}

/**
 * Wait for DOM to be ready
 */
function waitForDOM(callback: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    // DOM is already ready
    callback();
  }
}

/**
 * Apply background to body element
 */
function applyBodyBackground(background: string | undefined) {
  if (!background || typeof window === 'undefined') {
    console.warn('[bundle-entry] applyBodyBackground: no background or window undefined', { background, hasWindow: typeof window !== 'undefined' });
    return;
  }
  
  const body = document.body;
  if (!body) {
    console.warn('[bundle-entry] applyBodyBackground: body not available yet');
    // Try again after a short delay
    setTimeout(() => applyBodyBackground(background), 100);
    return;
  }
  
  console.log('[bundle-entry] applyBodyBackground: applying to body', background);
  
  // Check if it's a URL (starts with http, https, or /) or a relative path
  // If it looks like a color (starts with # or rgb), use backgroundColor instead
  const isColor = background.startsWith('#') || background.startsWith('rgb');
  
  if (isColor) {
    body.style.backgroundColor = background;
    body.style.backgroundImage = 'none';
    console.log('[bundle-entry] Applied background color:', background);
  } else {
    // It's an image URL/path
    body.style.backgroundImage = `url('${background}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.minHeight = '100vh';
    // Clear backgroundColor if it was set
    body.style.backgroundColor = 'transparent';
    console.log('[bundle-entry] Applied background image:', background);
  }
}

/**
 * Initialize the app
 */
function initializeApp() {
  // Parse configuration
  const config = parseConfig();
  
  console.log('[bundle-entry] Parsed config:', {
    background: config.background,
    theme: config.theme,
    shouldInit: config.shouldInit,
  });
  
  // Apply background to body element if provided (always apply, even if not initializing)
  if (config.background) {
    console.log('[bundle-entry] Applying background to body:', config.background);
    applyBodyBackground(config.background);
  } else {
    console.warn('[bundle-entry] No background found in config');
  }

  // Only initialize if init flag is set
  if (!config.shouldInit) {
    console.log('[bundle-entry] Not initializing (init flag not set). Export Folio for manual initialization.');
    return;
  }

  // Get or create root container
  let container = document.getElementById('root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'root';
    // Ensure body exists before appending
    if (!document.body) {
      // Wait for body to be available
      waitForDOM(() => {
        // Check again if root was created in the meantime
        const existingRoot = document.getElementById('root');
        if (existingRoot) {
          renderApp(existingRoot, config);
        } else {
          document.body.appendChild(container!);
          renderApp(container!, config);
        }
      });
      return;
    }
    document.body.appendChild(container);
  }
  
  renderApp(container, config);
}

/**
 * Render the React app
 */
function renderApp(container: HTMLElement, config: ReturnType<typeof parseConfig>) {
  // Create React root and render
  const root = createRoot(container);
  
  // Build theme object if theme or background is provided
  const themeConfig = config.theme || config.background ? {
    name: config.theme,
    background: config.background,
  } : undefined;
  
  root.render(
    <React.StrictMode>
      <BundleApp
        githubUsername={config.githubUsername}
        githubToken={config.githubToken}
        basePath={config.basePath}
        theme={themeConfig}
      />
    </React.StrictMode>
  );
  
  console.log('[bundle-entry] Initialized with config:', {
    githubUsername: config.githubUsername,
    githubToken: config.githubToken ? '***' : undefined,
    basePath: config.basePath,
    theme: config.theme,
    background: config.background ? '***' : undefined,
  });
}

// Apply background immediately if available (before DOM ready)
// This ensures it's applied as early as possible
(function applyBackgroundEarly() {
  const script = findBundleScript();
  if (script) {
    const dataBackground = script.getAttribute('data-background');
    // Also check URL query params
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlBackground = urlParams.get('background');
      const background = urlBackground || dataBackground;
      if (background) {
        console.log('[bundle-entry] Applying background early:', background);
        // Try to apply immediately
        if (document.body) {
          applyBodyBackground(background);
        } else {
          // Wait for body and apply
          waitForDOM(() => applyBodyBackground(background));
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
})();

// Wait for DOM to be ready before initializing
waitForDOM(initializeApp);

// Export for manual initialization if needed
export { BundleApp };
export default BundleApp;

