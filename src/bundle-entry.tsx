/**
 * Bundle Entry Point
 * 
 * Auto-initializes the app when loaded via script tag with init=true parameter or data-init="true" attribute.
 * 
 * Supports configuration via:
 * - Query parameters: ?username=modularizer&init=true&token=...
 * - Data attributes: data-username="modularizer" data-init="true" data-token="..."
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
} {
  const script = findBundleScript();
  
  // Check for init flag
  let shouldInit = false;
  let githubUsername: string | undefined;
  let githubToken: string | undefined;
  let basePath = '';
  
  if (script) {
    // Check data attributes first
    const dataInit = script.getAttribute('data-init');
    shouldInit = dataInit === 'true' || dataInit === '';
    
    const dataUsername = script.getAttribute('data-username');
    const dataToken = script.getAttribute('data-token');
    basePath = getBasePath(script);
    
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
    }
  }
  
  // Process username special keywords
  githubUsername = processUsername(githubUsername);
  
  return {
    shouldInit,
    githubUsername,
    githubToken,
    basePath,
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
 * Initialize the app
 */
function initializeApp() {
  // Parse configuration
  const config = parseConfig();

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
  root.render(
    <React.StrictMode>
      <BundleApp
        githubUsername={config.githubUsername}
        githubToken={config.githubToken}
        basePath={config.basePath}
      />
    </React.StrictMode>
  );
  
  console.log('[bundle-entry] Initialized with config:', {
    githubUsername: config.githubUsername,
    githubToken: config.githubToken ? '***' : undefined,
    basePath: config.basePath,
  });
}

// Wait for DOM to be ready before initializing
waitForDOM(initializeApp);

// Export for manual initialization if needed
export { BundleApp };
export default BundleApp;
