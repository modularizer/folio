/**
 * Expo Router shims for webpack bundle mode
 * 
 * This provides the expo-router API (Stack, useRouter, useLocalSearchParams, etc.)
 * but uses our custom path-based router under the hood.
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter as useCustomRouter } from '@/utils/router';

// Re-export the router hook with expo-router compatible API
export function useRouter() {
  const { navigate, route } = useCustomRouter();
  
  return {
    push: (path: string) => {
      console.log('[expo-router shim] push called with:', path);
      navigate(path);
    },
    replace: (path: string) => {
      console.log('[expo-router shim] replace called with:', path);
      window.history.replaceState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
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
    const pathname = window.location.pathname;
    const segs = pathname.split('/').filter(Boolean);
    console.log('[useSegments] Initial:', segs);
    return segs;
  });

  useEffect(() => {
    const updateSegments = () => {
      const pathname = window.location.pathname;
      const segs = pathname.split('/').filter(Boolean);
      console.log('[useSegments] Updated:', segs);
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
    console.log('[usePathname] Initial:', window.location.pathname);
    return window.location.pathname;
  });

  useEffect(() => {
    const updatePathname = () => {
      const path = window.location.pathname;
      console.log('[usePathname] Updated:', path);
      setPathname(path);
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

