/**
 * Bundle entry app - uses app/ directory with expo-router shims
 * 
 * This renders the same components as the native expo-router app,
 * but provides environment variables and routing shims for webpack bundle mode.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardLayoutProvider } from '@/contexts/CardLayoutContext';
import { storageManager } from '@/storage';
import type { Theme } from '@/types/theme';
import { usePathname, useSegments } from 'expo-router';

// Import the app/ pages directly
import HomeScreen from '../../app/index';
import ProjectDetailScreen from '../../app/[project]/index';
import GitHubUserRoute from '../../app/github/[username]';
import { UsernameInput } from '@/components/UsernameInput';

export interface BundleAppProps {
  githubUsername?: string;
  githubToken?: string;
  theme?: Partial<Theme>;
}

/**
 * Router component that renders the appropriate app/ screen based on URL
 */
function AppRouter() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    console.log('[BundleApp] Route changed:', { pathname, segments });
  }, [pathname, segments]);

  // Route: / - Home screen
  if (segments.length === 0) {
    return <HomeScreen />;
  }

  // Route: /github/:username - GitHub user screen
  if (segments.length === 2 && segments[0] === 'github') {
    return <GitHubUserRoute />;
  }

  // Route: /@username - Shorthand for GitHub user (starts with @)
  if (segments.length === 1 && segments[0].startsWith('@')) {
    return <GitHubUserRoute />;
  }

  // Route: /@username/:project - Specific user's project
  if (segments.length === 2 && segments[0].startsWith('@')) {
    return <ProjectDetailScreen />;
  }

  // Route: /:project - Default user's project (single segment, doesn't start with @)
  if (segments.length === 1) {
    return <ProjectDetailScreen />;
  }

  // Fallback - render home
  return <HomeScreen />;
}

export function BundleApp({ githubUsername, githubToken, theme }: BundleAppProps) {
  const pathname = usePathname();
  const segments = useSegments();

  // Store config in window BEFORE rendering (synchronously)
  // This must happen before any child components try to read it
  if (typeof window !== 'undefined') {
    (window as any).__FOLIO_CONFIG__ = {
      githubUsername,
      githubToken,
    };
    console.log('[BundleApp] Config set:', { githubUsername, githubToken: githubToken ? '***' : undefined });
  }

  useEffect(() => {
    // Initialize storage (same as app/_layout.tsx)
    storageManager.initialize().catch((error) => {
      console.error('Failed to initialize storage:', error);
    });

    return () => {
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
      <ThemeProvider>
        <View style={styles.container}>
          <UsernameInput />
        </View>
      </ThemeProvider>
    );
  }

  console.log('[BundleApp] Showing AppRouter');

  // Use the same providers as app/_layout.tsx
  return (
    <ThemeProvider>
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

