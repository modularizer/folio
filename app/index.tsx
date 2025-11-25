import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GitHubUserPage } from '@/components';
import { getGitHubUsername } from '@/utils/username';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Default home page showing GitHub user portfolio.
 * 
 * This uses the GitHubUserPage component to automatically fetch and display
 * the user's profile and public repositories.
 * 
 * Username is automatically detected:
 * 1. From GitHub Pages subdomain (e.g., https://username.github.io)
 * 2. Or from EXPO_PUBLIC_GITHUB_USERNAME environment variable
 * 
 * You can change this to show your own static portfolio by:
 * 1. Replacing this with the original HomeScreen implementation
 * 2. Or setting EXPO_PUBLIC_GITHUB_USERNAME in your .env file
 */
export default function HomeScreen() {
  const { theme } = useTheme();
  const username = getGitHubUsername();
  
  // Get GitHub token from bundle config or env
  const githubToken = typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__
    ? (window as any).__FOLIO_CONFIG__.githubToken
    : process.env.EXPO_PUBLIC_GITHUB_TOKEN;
  
  // If no username found, show error or fallback
  if (!username) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          GitHub Username Not Found
        </Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Please set EXPO_PUBLIC_GITHUB_USERNAME in your .env file, or deploy
          this site to GitHub Pages at https://username.github.io
        </Text>
      </View>
    );
  }

  return (
    <GitHubUserPage
      username={username}
      // Optional: Add GitHub token for higher rate limits (5000/hour vs 60/hour)
      // Get token at: https://github.com/settings/tokens
      githubToken={githubToken}
      // Optimize API usage: only fetch owner repos, limit to 20, sort by updated
      repoOptions={{
        type: 'owner', // Only repos owned by user (not forks)
        per_page: 100,  // Limit to 20 repos to reduce API calls
        sort: 'updated', // Most recently updated first
        direction: 'desc',
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

