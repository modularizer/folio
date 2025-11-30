import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GitHubUserPage } from '@/components';

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

  if (!username) {
    console.warn('[GitHubUserRoute] No username found in params, returning null');
    return null;
  }

  return (
    <GitHubUserPage
      username={username}
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



