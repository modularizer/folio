/**
 * Simple path-based router with dynamic routes
 * 
 * Uses the History API for clean URLs (no hash).
 * 
 * Supports patterns like:
 * - / (home - default user)
 * - /@:username (show user's repos)
 * - /@:username/:project (show user's specific project)
 * - /:project (show default user's project)
 * 
 * Search params are parsed and available in route.searchParams
 */

import { useState, useEffect } from 'react';

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

export function useRouter() {
  const [route, setRoute] = useState<RouteMatch>(parseRoute());

  useEffect(() => {
    const handleNavigation = () => {
      setRoute(parseRoute());
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handleNavigation);
    
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  const navigate = (path: string, searchParams?: Record<string, string>) => {
    // Resolve relative paths
    let resolvedPath = path;
    
    if (!path.startsWith('/') && !path.startsWith('http')) {
      // Relative path - resolve it based on current location
      // Strip base path from current location for resolution
      const currentPath = stripBasePath(window.location.pathname);
      const currentParts = currentPath.split('/').filter(p => p);
      
      if (path.startsWith('./')) {
        // Same directory: ./:project
        // Remove the ./ prefix
        const relativePart = path.slice(2);
        
        // If we're at a "file" (last segment doesn't have children), replace it
        // Otherwise append to the current path
        // For simplicity, we'll check if we're on a detail route (2+ segments)
        if (currentParts.length >= 2) {
          // Replace last segment: /@username/oldproject -> /@username/newproject
          resolvedPath = '/' + currentParts.slice(0, -1).concat(relativePart).join('/');
        } else {
          // Append to current: /@username -> /@username/project
          resolvedPath = '/' + currentParts.concat(relativePart).join('/');
        }
      } else if (path.startsWith('../')) {
        // Parent directory: ../ or ../@:username
        let pathToResolve = path;
        let parts = [...currentParts];
        
        while (pathToResolve.startsWith('../')) {
          parts.pop(); // Go up one level
          pathToResolve = pathToResolve.slice(3);
        }
        
        if (pathToResolve) {
          parts.push(pathToResolve);
        }
        
        resolvedPath = '/' + parts.join('/');
      } else {
        // No prefix - treat as relative to current directory (same as ./)
        if (currentParts.length >= 2) {
          resolvedPath = '/' + currentParts.slice(0, -1).concat(path).join('/');
        } else {
          resolvedPath = '/' + currentParts.concat(path).join('/');
        }
      }
    }
    
    // Add base path back to the resolved path
    const basePath = getBasePath();
    // Normalize paths to avoid double slashes
    // Remove trailing slash from basePath and ensure resolvedPath starts with /
    const normalizedBasePath = basePath ? basePath.replace(/\/+$/, '') : '';
    const fullResolvedPath = normalizedBasePath + resolvedPath;
    
    let url = fullResolvedPath;
    if (searchParams && Object.keys(searchParams).length > 0) {
      const params = new URLSearchParams(searchParams);
      url = `${fullResolvedPath}?${params.toString()}`;
    }
    
    console.log('[customRouter.navigate] Navigating from', window.location.pathname, 'to:', url, '(original:', path, ')');
    
    // Use History API for path-based routing
    window.history.pushState({}, '', url);
    
    // Manually trigger route update
    setRoute(parseRoute());
    
    // Dispatch popstate event so other hooks (usePathname, useSegments) update
    console.log('[customRouter.navigate] Dispatching popstate event');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return { route, navigate };
}

/**
 * Get the base path from config
 */
function getBasePath(): string {
  if (typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__) {
    return (window as any).__FOLIO_CONFIG__.basePath || '';
  }
  return '';
}

/**
 * Strip base path from pathname
 */
function stripBasePath(pathname: string): string {
  const basePath = getBasePath();
  if (!basePath) return pathname;
  
  // Remove base path prefix
  if (pathname.startsWith(basePath)) {
    const stripped = pathname.slice(basePath.length);
    return stripped || '/';
  }
  
  return pathname;
}

function parseRoute(): RouteMatch {
  // Use pathname for path-based routing instead of hash
  const rawPathname = window.location.pathname || '/';
  
  // Strip base path before parsing
  const pathname = stripBasePath(rawPathname);
  
  // Get search params from URL
  const searchParams = new URLSearchParams(window.location.search);
  
  const parts = pathname.split('/').filter(p => p);

  console.log('[parseRoute] Parsing route:', { rawPathname, pathname, parts });

  // / - home
  if (parts.length === 0) {
    console.log('[parseRoute] Matched: / (home)');
    return { path: '/', params: {}, searchParams };
  }

  // /github/:username - GitHub user route
  if (parts.length === 2 && parts[0] === 'github') {
    console.log('[parseRoute] Matched: /github/:username, username:', parts[1]);
    return {
      path: '/github/:username',
      params: { username: parts[1] },
      searchParams
    };
  }

  // /@username - shorthand for GitHub user
  if (parts.length === 1 && parts[0].startsWith('@')) {
    const username = parts[0].slice(1);
    console.log('[parseRoute] Matched: /@:username, username:', username);
    return { 
      path: '/@:username', 
      params: { username }, // Remove @
      searchParams
    };
  }

  // /@username/:project - specific user's project
  if (parts.length === 2 && parts[0].startsWith('@')) {
    console.log('[parseRoute] Matched: /@:username/:project, username:', parts[0].slice(1), 'project:', parts[1]);
    return { 
      path: '/@:username/:project', 
      params: { 
        username: parts[0].slice(1), // Remove @
        project: parts[1] 
      },
      searchParams
    };
  }

  // /:project - default user's project (must be last as it matches any single segment)
  // IMPORTANT: Exclude segments starting with @ to avoid matching /@username
  if (parts.length === 1 && !parts[0].startsWith('@')) {
    console.log('[parseRoute] Matched: /:project, project:', parts[0]);
    return { 
      path: '/:project', 
      params: { project: parts[0] },
      searchParams
    };
  }

  // Fallback for other patterns
  console.log('[parseRoute] No match, fallback to pathname:', pathname);
  return { path: pathname, params: {}, searchParams };
}

export function matchRoute(current: RouteMatch, pattern: string): boolean {
  return current.path === pattern;
}

