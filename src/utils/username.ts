/**
 * Get GitHub username from the current deployment context
 * 
 * Priority:
 * 1. Extract from GitHub Pages subdomain (e.g., https://username.github.io)
 * 2. Fallback to EXPO_PUBLIC_GITHUB_USERNAME environment variable
 * 
 * @returns GitHub username or null if not found
 */
export const getGitHubUsername = (): string | null => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: use environment variable
    return process.env.EXPO_PUBLIC_GITHUB_USERNAME || null;
  }

  // Client-side: check URL first
  const hostname = window.location.hostname;
  
  // Check if we're on GitHub Pages (username.github.io)
  // Pattern: username.github.io or username.github.io:port
  const githubPagesMatch = hostname.match(/^([^\.]+)\.github\.io(?:\:\d+)?$/);
  if (githubPagesMatch && githubPagesMatch[1]) {
    const username = githubPagesMatch[1];
    // Exclude common non-username subdomains
    if (username !== 'www' && username !== 'pages' && username.length > 0) {
      return username;
    }
  }

  // Fallback to environment variable
  return process.env.EXPO_PUBLIC_GITHUB_USERNAME || null;
};



