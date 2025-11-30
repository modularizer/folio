/**
 * Bundle entry app - uses app/ directory with expo-router shims
 * 
 * This renders the same components as the native expo-router app,
 * but provides environment variables and routing shims for webpack bundle mode.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardLayoutProvider } from '@/contexts/CardLayoutContext';
import { storageManager } from '@/storage';
import type { Theme } from '@/types/theme';
import { usePathname, useSegments } from 'expo-router';
import { initBundleNavigation, subscribeToPathChanges } from '@/utils/bundleNavigation';

// Import the app/ pages directly
import HomeScreen from '../../app/index';
import ProjectDetailScreen from '../../app/[project]/index';
import GitHubUserRoute from '../../app/github/[username]';
import { UsernameInput } from '@/components/UsernameInput';
import { useLocalSearchParams } from 'expo-router';

export interface BundleAppProps {
  githubUsername?: string;
  githubToken?: string;
  theme?: Partial<Theme>;
  basePath?: string;
  customProjects?: any[];
  customBioStats?: any[];
}

/**
 * Wrapper for ProjectDetailScreen that ensures the project slug is passed correctly
 * This is needed because useLocalSearchParams might not work correctly in bundle mode
 */
function ProjectDetailScreenWrapper({ projectSlug }: { projectSlug: string }) {
  console.log('[ProjectDetailScreenWrapper] Rendering with projectSlug:', projectSlug);
  return <ProjectDetailScreen projectSlug={projectSlug} />;
}

/**
 * Router component that renders the appropriate app/ screen based on URL
 */
function AppRouter() {
  const pathname = usePathname();
  const segments = useSegments();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Subscribe to bundle navigation changes to force re-render
  useEffect(() => {
    const unsubscribe = subscribeToPathChanges(() => {
      console.log('[AppRouter] Bundle navigation detected, forcing update');
      setForceUpdate(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    console.log('[BundleApp] Route changed:', { pathname, segments, forceUpdate });
  }, [pathname, segments, forceUpdate]);

  console.log('[AppRouter] Evaluating route:', { 
    pathname, 
    segments, 
    segmentsLength: segments.length,
    firstSegment: segments[0],
    startsWithAt: segments[0]?.startsWith('@')
  });

  // Route: / - Home screen
  if (segments.length === 0) {
    console.log('[AppRouter] Matched: Home screen');
    return <HomeScreen />;
  }

  // Route: /github/:username - GitHub user screen
  if (segments.length === 2 && segments[0] === 'github') {
    console.log('[AppRouter] Matched: /github/:username -> GitHubUserRoute');
    return <GitHubUserRoute />;
  }

  // Route: /@username - Shorthand for GitHub user (starts with @)
  if (segments.length === 1 && segments[0].startsWith('@')) {
    console.log('[AppRouter] Matched: /@username -> GitHubUserRoute, username:', segments[0].slice(1));
    return <GitHubUserRoute />;
  }

  // Route: /@username/:project - Specific user's project
  if (segments.length === 2 && segments[0].startsWith('@')) {
    const projectSlug = segments[1];
    console.log('[AppRouter] Matched: /@username/:project -> ProjectDetailScreen, project:', projectSlug);
    return <ProjectDetailScreenWrapper projectSlug={projectSlug} />;
  }

  // Route: /:project - Default user's project (single segment, doesn't start with @)
  // IMPORTANT: This must come AFTER the @username check to avoid matching /@username
  if (segments.length === 1 && !segments[0].startsWith('@')) {
    const projectSlug = segments[0];
    console.log('[AppRouter] Matched: /:project -> ProjectDetailScreen, project:', projectSlug);
    return <ProjectDetailScreenWrapper projectSlug={projectSlug} />;
  }

  // Fallback - render home
  console.log('[AppRouter] No match, falling back to Home screen');
  return <HomeScreen />;
}

export function BundleApp({ githubUsername, githubToken, theme, basePath, customProjects, customBioStats }: BundleAppProps) {
  const pathname = usePathname();
  const segments = useSegments();

  // Store config in window BEFORE rendering (synchronously)
  // This must happen before any child components try to read it
  if (typeof window !== 'undefined') {
    // Detect the initial pathname (the path when bundle loaded)
    // This is used as the base path for routing
    const initialPathname = window.location.pathname;
    
    // Normalize base path: ensure it always has a trailing slash (except for empty string)
    const normalizeBasePath = (path: string): string => {
      if (!path || path === '/') return '/';
      return path.endsWith('/') ? path : path + '/';
    };
    
    const normalizedBasePath = normalizeBasePath(basePath || '');
    const normalizedInitialPathname = normalizeBasePath(initialPathname);
    const effectiveBasePath = normalizedBasePath || normalizedInitialPathname || '/';
    
    (window as any).__FOLIO_CONFIG__ = {
      githubUsername,
      githubToken,
      basePath: effectiveBasePath,
      initialPathname: normalizedInitialPathname, // Store normalized initial pathname for base path detection
      customProjects,
      customBioStats,
    };
    
    console.log('[BundleApp] Detected initial pathname:', {
      initialPathname,
      normalizedInitialPathname,
      basePathFromProps: basePath,
      normalizedBasePath,
      effectiveBasePath,
    });
    console.log('[BundleApp] Config set:', { 
      githubUsername, 
      githubToken: githubToken ? '***' : undefined, 
      basePath,
      customProjectsCount: customProjects?.length || 0,
      customProjects: customProjects,
    });
  }

  // State to force re-render when path changes (for bundle navigation)
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    // Initialize bundle navigation
    initBundleNavigation();
    
    // Subscribe to path changes for bundle navigation
    const unsubscribe = subscribeToPathChanges((path) => {
      console.log('[BundleApp] Path changed via bundle navigation:', path);
      setCurrentPath(path);
    });

    // Initialize storage (same as app/_layout.tsx)
    storageManager.initialize().catch((error) => {
      console.error('Failed to initialize storage:', error);
    });

    return () => {
      unsubscribe();
      storageManager.cleanup().catch((error) => {
        console.error('Failed to cleanup storage:', error);
      });
    };
  }, []);

  // Check if we're on a route that requires a username (/@username or /github/username)
  const hasUsernameInRoute = (
    (segments.length >= 1 && segments[0].startsWith('@')) ||
    (segments.length >= 2 && segments[0] === 'github')
  );

  console.log('[BundleApp] Render decision:', { 
    githubUsername, 
    pathname, 
    segments, 
    hasUsernameInRoute,
    shouldShowInput: !githubUsername && !hasUsernameInRoute
  });

  // If no username provided and not navigating to a specific user, show username input screen
  if (!githubUsername && !hasUsernameInRoute) {
    console.log('[BundleApp] Showing UsernameInput');
    return (
      <ThemeProvider initialTheme={theme}>
        <View style={styles.container}>
          <UsernameInput />
        </View>
      </ThemeProvider>
    );
  }

  console.log('[BundleApp] Showing AppRouter');

  // Use the same providers as app/_layout.tsx
  return (
    <ThemeProvider initialTheme={theme}>
      <CardLayoutProvider>
        <View style={styles.container}>
          <AppRouter />
        </View>
      </CardLayoutProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

