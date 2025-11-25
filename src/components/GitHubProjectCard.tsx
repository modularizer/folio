import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Project, ProjectData } from '@/projects/types';
import { GitHubProjectBuilder } from '@/projects/builders/GitHubProjectBuilder';
import { fetchGitHubProject } from '@/utils/github';
import ProjectCard from './ProjectCard';
import { TokenWarningIcon } from './TokenWarningIcon';

interface GitHubProjectCardProps {
  /**
   * GitHub repository URL or owner/repo format
   * Examples:
   * - "https://github.com/owner/repo"
   * - "owner/repo"
   * - "https://github.com/facebook/react"
   */
  githubUrl: string;
  
  /**
   * Custom project data to merge with GitHub data
   * Useful for adding additional fields not available from GitHub API
   */
  customData?: Partial<ProjectData>;
  
  /**
   * Whether to show loading state (default: true)
   */
  showLoading?: boolean;
  
  /**
   * Custom error message component
   */
  renderError?: (error: string) => React.ReactElement;
  
  /**
   * Custom loading component
   */
  renderLoading?: () => React.ReactElement;
  
  /**
   * Callback when project data is successfully loaded
   */
  onLoad?: (project: Project) => void;
  
  /**
   * Callback when loading fails
   */
  onError?: (error: Error) => void;
  
  /**
   * GitHub API token (optional, for higher rate limits)
   * If not provided, uses unauthenticated API (60 requests/hour)
   */
  githubToken?: string;
  
  /**
   * Whether to fetch additional details (default: true)
   * Set to false for faster loading with basic info only
   */
  fetchDetails?: boolean;
}

/**
 * Generic component that fetches GitHub project data and renders it as a ProjectCard.
 * 
 * This component is modular and can be used anywhere in your app.
 * It automatically fetches repository data from GitHub API and transforms it
 * into a Project format compatible with your existing ProjectCard component.
 * 
 * Usage:
 * <GitHubProjectCard githubUrl="facebook/react" />
 * <GitHubProjectCard githubUrl="https://github.com/owner/repo" />
 */
export const GitHubProjectCard: React.FC<GitHubProjectCardProps> = ({
  githubUrl,
  customData,
  showLoading = true,
  renderError,
  renderLoading,
  onLoad,
  onError,
  githubToken,
  fetchDetails = true,
}) => {
  const { theme } = useTheme();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [userToken, setUserToken] = useState<string>('');
  const [userTokenInput, setUserTokenInput] = useState<string>('');

  // Load user token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = window.localStorage.getItem('github_user_token');
      if (storedToken) {
        setUserToken(storedToken);
        setUserTokenInput(storedToken);
      }
    }
  }, []);

  // Save user token to localStorage
  const saveUserToken = (token: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem('github_user_token', token);
      } else {
        window.localStorage.removeItem('github_user_token');
      }
    }
    setUserToken(token);
  };

  // Use user token if available, otherwise fall back to provided token
  const effectiveToken = userToken || githubToken;

  // Helper to check if an error is an auth/rate limit error
  const isAuthError = (errorMessage: string | null): boolean => {
    if (!errorMessage) return false;
    const lowerError = errorMessage.toLowerCase();
    return (
      lowerError.includes('rate limit') ||
      lowerError.includes('403') ||
      lowerError.includes('forbidden') ||
      lowerError.includes('authentication') ||
      lowerError.includes('unauthorized')
    );
  };

  useEffect(() => {
    const loadGitHubProject = async () => {
      let projectData: ProjectData | null = null;
      try {
        setLoading(true);
        setError(null);

        // Fetch and transform GitHub project data (automatically checks for GitHub Pages)
        // Enable fetchAdditionalStats if we have a token (to get commits, files, languages, etc.)
        // cachedFetch will use cached data if available, avoiding unnecessary requests
        projectData = await fetchGitHubProject(
          githubUrl,
          customData,
          githubToken,
          fetchDetails,
          true, // checkPages = true (default)
          true // Always fetch additional stats (languages, commits) - public endpoints
        );

        // Create project with GitHub-specific builder
        const newProject: Project = {
          data: projectData,
          builder: new GitHubProjectBuilder(),
        };

        setProject(newProject);
        onLoad?.(newProject);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load GitHub project';
        // Only show error if we didn't successfully get project data
        // If cachedFetch returned data, we shouldn't be here, but if we are and have data, use it
        if (!projectData && !project) {
          setError(errorMessage);
          setHasAuthError(isAuthError(errorMessage));
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        } else {
          // We have project data (either from this call or cached), just log the error but don't show it
          console.warn('[GitHubProjectCard] Error fetching fresh data, but using cached/available project:', errorMessage);
          // If we got data in this call despite error, still set it
          if (projectData) {
            const newProject: Project = {
              data: projectData,
              builder: new GitHubProjectBuilder(),
            };
            setProject(newProject);
            onLoad?.(newProject);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadGitHubProject();
  }, [githubUrl, githubToken, userToken, customData, fetchDetails, onLoad, onError]);

  // Loading state
  if (loading && showLoading) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading project...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    if (renderError) {
      return <>{renderError(error)}</>;
    }
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.errorContent}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          {hasAuthError && !effectiveToken && (
            <TokenWarningIcon
              userTokenInput={userTokenInput}
              onUserTokenInputChange={setUserTokenInput}
              userToken={userToken}
              onSaveUserToken={(token) => {
                saveUserToken(token);
                // Reload data with new token
                setError(null);
                setHasAuthError(false);
                setLoading(true);
              }}
              style={styles.warningIcon}
            />
          )}
        </View>
      </View>
    );
  }

  // Render project card
  if (project) {
    return <ProjectCard project={project} />;
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  warningIcon: {
    marginLeft: 8,
  },
});

export default GitHubProjectCard;

