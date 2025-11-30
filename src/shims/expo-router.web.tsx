/**
 * Expo Router shims for webpack bundle mode
 * 
 * This provides the expo-router API (Stack, useRouter, useLocalSearchParams, etc.)
 * but uses our custom path-based router under the hood.
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter as useCustomRouter } from '@/utils/router';
import { subscribeToPathChanges } from '@/utils/bundleNavigation';

/**
 * Normalize a path by ensuring it always has a trailing slash (except for empty string)
 */
function normalizePath(path: string): string {
  if (!path) return '/';
  if (path === '/') return '/';
  return path.endsWith('/') ? path : path + '/';
}

/**
 * Get the base path from config
 * Uses initialPathname if available (the path when bundle loaded), otherwise falls back to basePath
 * Always returns with trailing slash (except for root "/" which stays "/")
 */
function getBasePath(): string {
  if (typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__) {
    const config = (window as any).__FOLIO_CONFIG__;
    // Prefer initialPathname (the actual path when bundle loaded) over basePath config
    const path = config.initialPathname || config.basePath || '';
    return normalizePath(path);
  }
  return '/';
}

/**
 * Strip base path from pathname
 * The base path is the path the page was on when the bundle initially loaded
 */
function stripBasePath(pathname: string): string {
  const basePath = getBasePath();
  if (!basePath) {
    console.log('[stripBasePath] No base path, returning original:', pathname);
    return pathname;
  }
  
  // Remove base path prefix
  // basePath always has trailing slash, so we can directly check startsWith
  if (pathname.startsWith(basePath)) {
    const stripped = pathname.slice(basePath.length);
    const result = stripped || '/';
    console.log('[stripBasePath] Stripped:', { pathname, basePath, result });
    return result;
  }
  
  console.log('[stripBasePath] Pathname does not start with base path:', { pathname, basePath });
  return pathname;
}

// Re-export the router hook with expo-router compatible API
export function useRouter() {
  const { navigate, route } = useCustomRouter();
  
  return {
    push: (path: string) => {
      console.log('[expo-router shim] push called with:', path);
      // Pass path directly to navigate() - it handles both absolute and relative paths
      // Relative paths (./page, ../page) are resolved relative to current location
      // Absolute paths (/page) are resolved from root
      navigate(path);
    },
    replace: (path: string) => {
      console.log('[expo-router shim] replace called with:', path);
      // For replace, we need to resolve the path through navigate logic
      // but use replaceState instead of pushState
      // For now, just call navigate which will handle path resolution
      navigate(path);
      // Then immediately replace the last history entry
      const currentUrl = window.location.href;
      window.history.replaceState({}, '', currentUrl);
    },
    back: () => {
      console.log('[expo-router shim] back called');
      window.history.back();
    },
    canGoBack: () => window.history.length > 1,
    setParams: (params: Record<string, any>) => {
      console.log('[expo-router shim] setParams called with:', params);
      const searchParams = new URLSearchParams(window.location.search);
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, String(value));
        }
      });
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
  };
}

// Hook to get route params
export function useLocalSearchParams<T extends Record<string, string>>(): T {
  const { route } = useCustomRouter();
  
  // Combine path params and search params
  const allParams: any = { ...route.params };
  
  // Add search params
  route.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  
  return allParams as T;
}

// Hook to get global search params (same as useLocalSearchParams for our use case)
export function useGlobalSearchParams<T extends Record<string, string>>(): T {
  return useLocalSearchParams<T>();
}

// Hook to get path segments
export function useSegments(): string[] {
  const [segments, setSegments] = useState(() => {
    const pathname = stripBasePath(window.location.pathname);
    const segs = pathname.split('/').filter(Boolean);
    console.log('[useSegments] Initial:', segs, '(stripped from:', window.location.pathname, ')');
    return segs;
  });

  useEffect(() => {
    const updateSegments = () => {
      const pathname = stripBasePath(window.location.pathname);
      const segs = pathname.split('/').filter(Boolean);
      console.log('[useSegments] Updated:', segs, '(stripped from:', window.location.pathname, ')');
      setSegments(segs);
    };

    // Listen to both popstate (browser back/forward) and bundle navigation
    window.addEventListener('popstate', updateSegments);
    const unsubscribe = subscribeToPathChanges((path) => {
      console.log('[useSegments] Bundle navigation path change:', path);
      // Update segments based on the actual window.location (which should already be updated)
      updateSegments();
    });
    
    return () => {
      window.removeEventListener('popstate', updateSegments);
      unsubscribe();
    };
  }, []);

  return segments;
}

// Hook to get pathname
export function usePathname(): string {
  const [pathname, setPathname] = useState(() => {
    const stripped = stripBasePath(window.location.pathname);
    console.log('[usePathname] Initial:', stripped, '(stripped from:', window.location.pathname, ')');
    return stripped;
  });

  useEffect(() => {
    const updatePathname = () => {
      const stripped = stripBasePath(window.location.pathname);
      console.log('[usePathname] Updated:', stripped, '(stripped from:', window.location.pathname, ')');
      setPathname(stripped);
    };

    // Listen to both popstate (browser back/forward) and bundle navigation
    window.addEventListener('popstate', updatePathname);
    const unsubscribe = subscribeToPathChanges((path) => {
      console.log('[usePathname] Bundle navigation path change:', path);
      // Update pathname based on the actual window.location (which should already be updated)
      updatePathname();
    });
    
    return () => {
      window.removeEventListener('popstate', updatePathname);
      unsubscribe();
    };
  }, []);

  return pathname;
}

// Stack component for navigation
interface StackProps {
  screenOptions?: {
    headerShown?: boolean;
    contentStyle?: any;
    [key: string]: any;
  };
  children?: ReactNode;
}

const ScreenContext = createContext<any>(null);

export function Stack({ screenOptions, children }: StackProps) {
  // Stack is just a container in bundle mode - screens are rendered by the router
  return (
    <ScreenContext.Provider value={screenOptions}>
      {children}
    </ScreenContext.Provider>
  );
}

// Link component (for future use)
interface LinkProps {
  href: string;
  children: ReactNode;
  [key: string]: any;
}

export function Link({ href, children, ...props }: LinkProps) {
  const { navigate } = useCustomRouter();
  
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

// Redirect component (for future use)
interface RedirectProps {
  href: string;
}

export function Redirect({ href }: RedirectProps) {
  const { navigate } = useCustomRouter();
  
  React.useEffect(() => {
    navigate(href);
  }, [href, navigate]);
  
  return null;
}

