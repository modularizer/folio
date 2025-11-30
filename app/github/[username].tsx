import React, { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GitHubUserPage } from '@/components';
import { convertCustomProjectsToProjects } from '@/utils/customProjects';
import { Project } from '@/projects/types';

/**
 * Example route for displaying a GitHub user's portfolio.
 * 
 * This is an optional way to use the portfolio system - you can also:
 * - Manually define projects in user/projects.ts
 * - Mix GitHub projects with manual projects
 * - Use GitHubProjectCard for individual repos
 * 
 * Access via: /github/username
 * Example: /github/octocat
 */
export default function GitHubUserRoute() {
  const { username } = useLocalSearchParams<{ username: string }>();

  console.log('[GitHubUserRoute] Received params:', { username });

  // Get custom projects from window config (set by BundleApp)
  const customProjects = useMemo(() => {
    if (typeof window === 'undefined') {
      console.log('[GitHubUserRoute] window is undefined, returning empty array');
      return [];
    }

    const config = (window as any).__FOLIO_CONFIG__;
    console.log('[GitHubUserRoute] Reading from window config:', {
      hasConfig: !!config,
      hasCustomProjects: !!(config && config.customProjects),
      customProjectsCount: config?.customProjects?.length || 0,
      customProjects: config?.customProjects,
    });
    
    if (!config || !config.customProjects) {
      console.log('[GitHubUserRoute] No custom projects in config, returning empty array');
      return [];
    }

    try {
      const projects = convertCustomProjectsToProjects(config.customProjects);
      console.log('[GitHubUserRoute] Converted custom projects:', {
        count: projects.length,
        projects: projects.map(p => ({ id: p.data.id, title: p.data.title })),
      });
      return projects;
    } catch (error) {
      console.error('[GitHubUserRoute] Failed to convert custom projects:', error);
      return [];
    }
  }, []);

  if (!username) {
    console.warn('[GitHubUserRoute] No username found in params, returning null');
    return null;
  }

  return (
    <GitHubUserPage
      username={username}
      additionalProjects={customProjects}
      // Optional: Add GitHub token for higher rate limits
      // githubToken={process.env.EXPO_PUBLIC_GITHUB_TOKEN}
      
      // Optional: Customize profile data
      // customProfileData={{
      //   background: './assets/background.jpg',
      // }}
      
      // Optional: Customize each repository
      // customDataPerRepo={(repo) => ({
      //   featured: repo.stargazers_count > 100,
      //   template: repo.language === 'TypeScript' ? 'Software' : 'Base',
      // })}
      
      // Optional: Filter/sort repositories
      // repoOptions={{
      //   sort: 'updated',
      //   direction: 'desc',
      //   per_page: 50,
      // }}
    />
  );
}



