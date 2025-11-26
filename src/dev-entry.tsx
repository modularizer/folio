/**
 * Development Entry Point
 * 
 * Automatically initializes the app for local development with hot reloading.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BundleApp } from './bundle/BundleApp';

// Get container
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
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

// Development configuration from .env file
const DEV_CONFIG = {
  githubUsername: processUsername(process.env.EXPO_PUBLIC_GITHUB_USERNAME || 'modularizer'),
  githubToken: process.env.EXPO_PUBLIC_GITHUB_TOKEN || undefined,
  theme: {
    // Optional theme overrides from .env
    ...(process.env.EXPO_PUBLIC_THEME_PRIMARY_COLOR && {
      colors: {
        primary: process.env.EXPO_PUBLIC_THEME_PRIMARY_COLOR,
        ...(process.env.EXPO_PUBLIC_THEME_BACKGROUND_COLOR && {
          background: process.env.EXPO_PUBLIC_THEME_BACKGROUND_COLOR,
        }),
      },
    }),
  },
};

// Create React root and render
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BundleApp
      githubUsername={DEV_CONFIG.githubUsername}
      githubToken={DEV_CONFIG.githubToken}
      theme={DEV_CONFIG.theme}
    />
  </React.StrictMode>
);

// Hot module replacement for development
if (module.hot) {
  module.hot.accept('./bundle/BundleApp', () => {
    root.render(
      <React.StrictMode>
        <BundleApp
          githubUsername={DEV_CONFIG.githubUsername}
          githubToken={DEV_CONFIG.githubToken}
          theme={DEV_CONFIG.theme}
        />
      </React.StrictMode>
    );
  });
}

