/**
 * Bundle Entry Point
 * 
 * This file is used to create a standalone bundle that can be
 * embedded in any HTML page with a simple script tag.
 * 
 * Usage:
 * <script src="folio.bundle.js"></script>
 * <script>
 *   Folio.init({
 *     container: '#app',
 *     profile: { name: 'John Doe', ... },
 *     projects: [...]
 *   });
 * </script>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { BundleApp } from './bundle/BundleApp';
import type { Theme } from '@/types/theme';

export interface FolioConfig {
  /** Container selector (string) or HTMLElement */
  container: string | HTMLElement;
  /** Optional: GitHub username to display (auto-detected from script tag) */
  githubUsername?: string;
  /** Optional: GitHub token for API requests (increases rate limit, auto-detected from script tag) */
  githubToken?: string;
  /** Optional: Theme override */
  theme?: Partial<Theme>;
  /** Optional: Base path for routing (auto-detected from script src) */
  basePath?: string;
}

let rootInstance: Root | null = null;

/**
 * Parse script tag attributes and query params
 */
interface ScriptConfig {
  username?: string;
  token?: string;
  theme?: string;
  primaryColor?: string;
  backgroundColor?: string;
  init?: string | boolean;
}

function getConfigFromScript(): ScriptConfig {
  const config: ScriptConfig = {};
  const scripts = document.getElementsByTagName('script');

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.src;

    // Check if this is the folio bundle script
    if (src && src.includes('folio.bundle.js')) {
      try {
        // Parse URL query params (handle both absolute and relative URLs)
        const url = new URL(src, window.location.href);
        
        console.log('[Folio] Found script:', src);
        console.log('[Folio] Parsed URL:', url.href);
        console.log('[Folio] Query params:', Object.fromEntries(url.searchParams));
        
        // Username: ?username=x or ?github=x
        config.username = url.searchParams.get('username') || url.searchParams.get('github') || undefined;
        
        // Token: ?token=x
        config.token = url.searchParams.get('token') || undefined;
        
        // Theme: ?theme=dark|light
        config.theme = url.searchParams.get('theme') || undefined;
        
        // Colors: ?primary=hex or ?bg=hex
        config.primaryColor = url.searchParams.get('primary') || undefined;
        config.backgroundColor = url.searchParams.get('bg') || undefined;
        
        // Auto-init: ?init=true or ?init=containerId
        const initParam = url.searchParams.get('init');
        if (initParam !== null && initParam !== 'false') {
          config.init = initParam === '' || initParam === 'true' ? true : initParam;
        }
        
        console.log('[Folio] Parsed config:', config);
      } catch (error) {
        console.error('[Folio] Failed to parse script URL:', error);
      }
    }

    // Check data attributes (higher priority than query params)
    const dataUsername = script.getAttribute('data-github-username') || script.getAttribute('data-username');
    if (dataUsername) config.username = dataUsername;

    const dataToken = script.getAttribute('data-github-token') || script.getAttribute('data-token');
    if (dataToken) config.token = dataToken;

    const dataTheme = script.getAttribute('data-theme');
    if (dataTheme) config.theme = dataTheme;

    const dataPrimary = script.getAttribute('data-primary-color');
    if (dataPrimary) config.primaryColor = dataPrimary;

    const dataBg = script.getAttribute('data-bg-color');
    if (dataBg) config.backgroundColor = dataBg;

    const dataInit = script.getAttribute('data-init');
    if (dataInit !== null) {
      config.init = dataInit === '' || dataInit === 'true' ? true : dataInit;
    }
  }

  return config;
}

/**
 * Extract username from hostname or pathname based on special keywords
 * 
 * @param username - Special keyword: "subdomain", "domain", or "route"
 * @returns Extracted username or null
 * 
 * Examples:
 * - "subdomain" from "modularizer.github.io" => "modularizer"
 * - "domain" from "google.com" => "google"
 * - "route" from "/cat/dog/" => "dog"
 */
function getHostnameBasedUsername(username: string | null | undefined): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // If username is explicitly "subdomain", extract first subdomain
  if (username === 'subdomain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      console.log('[Folio] Using subdomain from hostname:', subdomain);
      return subdomain;
    }
  }

  // If username is explicitly "domain", extract domain name
  if (username === 'domain') {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const domain = parts[parts.length - 2];
      console.log('[Folio] Using domain from hostname:', domain);
      return domain;
    }
  }

  // If username is explicitly "route", extract last path segment
  if (username === 'route') {
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
      const route = parts[parts.length - 1];
      console.log('[Folio] Using route from pathname:', route);
      return route;
    }
  }

  return null;
}

/**
 * Get base path from data-base-path attribute
 * 
 * The base path should be explicitly set via data-base-path attribute if needed.
 * It should NOT be derived from the script source URL, as the script can be loaded
 * from anywhere (CDN, different subdirectory, etc) and has no relationship to the
 * page's routing structure.
 * 
 * Examples:
 * - data-base-path="" (or omitted) => routes at root: /project
 * - data-base-path="/folio" => routes under /folio: /folio/project
 */
function getBasePath(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
}

/**
 * Initialize Folio portfolio in the specified container
 */
export function init(config: FolioConfig): void {
  // Find container element
  const container = typeof config.container === 'string'
    ? document.querySelector(config.container)
    : config.container;

  if (!container) {
    throw new Error(`Folio: Container "${config.container}" not found`);
  }

  // Auto-detect config from script tag
  const scriptConfig = getConfigFromScript();

  // Auto-detect base path from script src
  const detectedBasePath = getBasePath();

  // Merge configs (explicit config takes priority, then script config)
  const preliminaryUsername = config.githubUsername || scriptConfig.username;
  
  // Check if username is a special keyword ("subdomain" or "domain")
  const hostnameBasedUsername = getHostnameBasedUsername(preliminaryUsername);
  
  // Use hostname-based username if detected, otherwise use preliminary username
  const githubUsername = hostnameBasedUsername || preliminaryUsername;
  const githubToken = config.githubToken || scriptConfig.token;
  const basePath = config.basePath !== undefined ? config.basePath : detectedBasePath;

  // Build theme from script params and config
  const theme: Partial<Theme> = {
    ...config.theme,
  };

  // Apply color overrides from script params
  if (scriptConfig.primaryColor || scriptConfig.backgroundColor) {
    theme.colors = {
      ...theme.colors,
    };
    if (scriptConfig.primaryColor) {
      theme.colors.primary = scriptConfig.primaryColor;
    }
    if (scriptConfig.backgroundColor) {
      theme.colors.background = scriptConfig.backgroundColor;
    }
  }

  // GitHub username is optional - if not provided, show username input screen

  // Cleanup previous instance if exists
  if (rootInstance) {
    rootInstance.unmount();
  }

  // Create React root and render
  rootInstance = createRoot(container);
  rootInstance.render(
    <React.StrictMode>
      <BundleApp
        githubUsername={githubUsername}
        githubToken={githubToken}
        theme={theme}
        basePath={basePath}
      />
    </React.StrictMode>
  );
}

/**
 * Destroy the Folio instance
 */
export function destroy(): void {
  if (rootInstance) {
    rootInstance.unmount();
    rootInstance = null;
  }
}

// Export for UMD
export default { init, destroy };

// Auto-initialize if requested via query param
if (typeof window !== 'undefined') {
  (window as any).Folio = { init, destroy };
  
  // Check for auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

/**
 * Auto-initialize based on ?init= query parameter
 */
function autoInit() {
  const scriptConfig = getConfigFromScript();
  
  if (!scriptConfig.init) {
    return; // No auto-init requested
  }

  let container: HTMLElement | null = null;

  // Case 1: init=true - create a new div
  if (scriptConfig.init === true) {
    container = document.createElement('div');
    container.id = 'folio-auto';
    container.style.width = '100vw';
    container.style.height = '100vh';
    document.body.appendChild(container);
  } 
  // Case 2: init=containerId - find or create element
  else if (typeof scriptConfig.init === 'string') {
    const id = scriptConfig.init;
    
    // Try to find existing element
    container = document.getElementById(id);
    
    // If not found, create it
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.style.width = '100vw';
      container.style.height = '100vh';
      document.body.appendChild(container);
    }
  }

  if (container) {
    try {
      // Pass script config explicitly to init
      init({ 
        container,
        githubUsername: scriptConfig.username,
        githubToken: scriptConfig.token,
      });
    } catch (error) {
      console.error('Folio auto-init failed:', error);
    }
  }
}

