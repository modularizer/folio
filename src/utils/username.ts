/**
 * Get GitHub username from the current deployment context
 * 
 * Priority:
 * 1. Bundle config (for webpack bundle mode)
 * 2. Extract from GitHub Pages subdomain (e.g., https://username.github.io)
 * 3. Fallback to EXPO_PUBLIC_GITHUB_USERNAME environment variable
 * 
 * @returns GitHub username or null if not found
 */
export const getGitHubUsername = (): string | null => {
  // Check bundle config first (webpack bundle mode)
  if (typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__) {
    const username = (window as any).__FOLIO_CONFIG__.githubUsername;
    if (username) {
      console.log('[getGitHubUsername] Found in bundle config:', username);
      return username;
    }
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: use environment variable
    const username = process.env.EXPO_PUBLIC_GITHUB_USERNAME || null;
    console.log('[getGitHubUsername] Server-side, using env:', username);
    return username;
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
      console.log('[getGitHubUsername] Found from GitHub Pages URL:', username);
      return username;
    }
  }

  // Fallback to environment variable
  const username = process.env.EXPO_PUBLIC_GITHUB_USERNAME || null;
  console.log('[getGitHubUsername] Using env fallback:', username);
  return username;
};



