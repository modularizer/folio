/**
 * Extract first subdomain from hostname
 * e.g. "modularizer.github.io" => "modularizer"
 * e.g. "taco.cat.com" => "taco"
 */
const getSubdomainFromHostname = (hostname: string): string | null => {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
};

/**
 * Extract domain name from hostname
 * e.g. "google.com" => "google"
 * e.g. "subdomain.google.com" => "google"
 * e.g. "modularizer.github.io" => "github"
 */
const getDomainFromHostname = (hostname: string): string | null => {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Get second-to-last part (domain name before TLD)
    return parts[parts.length - 2];
  }
  return null;
};

/**
 * Extract last path segment from pathname
 * e.g. "/cat/" => "cat"
 * e.g. "/cat/dog" => "dog"
 * e.g. "/cat/dog/" => "dog"
 */
const getRouteFromPathname = (pathname: string): string | null => {
  const parts = pathname.split('/').filter(p => p.length > 0);
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  return null;
};

/**
 * Get GitHub username from the current deployment context
 * 
 * Priority:
 * 1. Bundle config (for webpack bundle mode)
 * 2. EXPO_PUBLIC_GITHUB_USERNAME environment variable
 * 
 * Special values:
 * - "subdomain": Extract first subdomain from current hostname
 * - "domain": Extract domain name from current hostname
 * - "route": Extract last path segment from current pathname
 * 
 * @returns GitHub username or null if not found
 */
export const getGitHubUsername = (): string | null => {
  // Check bundle config first (webpack bundle mode)
  if (typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__) {
    const username = (window as any).__FOLIO_CONFIG__.githubUsername;
    if (username) {
      // Check for special keywords
      if (username === 'subdomain') {
        const subdomain = getSubdomainFromHostname(window.location.hostname);
        console.log('[getGitHubUsername] Using subdomain from hostname:', subdomain);
        return subdomain;
      }
      if (username === 'domain') {
        const domain = getDomainFromHostname(window.location.hostname);
        console.log('[getGitHubUsername] Using domain from hostname:', domain);
        return domain;
      }
      if (username === 'route') {
        const route = getRouteFromPathname(window.location.pathname);
        console.log('[getGitHubUsername] Using route from pathname:', route);
        return route;
      }
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

  // Client-side: check environment variable
  const username = process.env.EXPO_PUBLIC_GITHUB_USERNAME || null;
  
  // Check for special keywords in environment variable
  if (username === 'subdomain') {
    const subdomain = getSubdomainFromHostname(window.location.hostname);
    console.log('[getGitHubUsername] Using subdomain from hostname:', subdomain);
    return subdomain;
  }
  if (username === 'domain') {
    const domain = getDomainFromHostname(window.location.hostname);
    console.log('[getGitHubUsername] Using domain from hostname:', domain);
    return domain;
  }
  if (username === 'route') {
    const route = getRouteFromPathname(window.location.pathname);
    console.log('[getGitHubUsername] Using route from pathname:', route);
    return route;
  }
  
  console.log('[getGitHubUsername] Using env fallback:', username);
  return username;
};



