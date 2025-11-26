/**
 * Expo Router shims for webpack bundle mode
 * 
 * This provides the expo-router API (Stack, useRouter, useLocalSearchParams, etc.)
 * but uses our custom path-based router under the hood.
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter as useCustomRouter } from '@/utils/router';

/**
 * Get the base path from config
 */
function getBasePath(): string {
  if (typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__) {
    return (window as any).__FOLIO_CONFIG__.basePath || '';
  }
  return '';
}

/**
 * Strip base path from pathname
 */
function stripBasePath(pathname: string): string {
  const basePath = getBasePath();
  if (!basePath) return pathname;
  
  // Remove base path prefix
  if (pathname.startsWith(basePath)) {
    const stripped = pathname.slice(basePath.length);
    return stripped || '/';
  }
  
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

    window.addEventListener('popstate', updateSegments);
    return () => window.removeEventListener('popstate', updateSegments);
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

    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
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

