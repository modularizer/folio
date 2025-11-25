import { Platform } from 'react-native';

/**
 * Platform-safe URL search parameter utilities
 * 
 * Works on both web (browser) and mobile (React Native) platforms.
 * For web, uses browser History API. For mobile, uses expo-router.
 */

/**
 * Get a search parameter from the current URL
 * 
 * @param param - Parameter name to get
 * @returns Parameter value or null if not found
 * 
 * @example
 * const layout = getSearchParam('layout'); // Returns 'list' or null
 */
export const getSearchParam = (param: string): string | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  // For mobile, we'll need to use expo-router hooks in components
  // This function is primarily for web
  return null;
};

/**
 * Get all search parameters from the current URL
 * 
 * @returns Object with all search parameters
 * 
 * @example
 * const params = getAllSearchParams(); // { layout: 'list', filter: 'active' }
 */
export const getAllSearchParams = (): Record<string, string> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }
  return {};
};

/**
 * Update URL search parameters without reloading the page
 * 
 * This function updates the browser URL using replaceState (web) or
 * expo-router's setParams (mobile), without causing a page reload.
 * 
 * @param params - Object with parameters to set (undefined values are removed)
 * @param router - Optional expo-router router instance (required for mobile)
 * 
 * @example
 * // Set a parameter
 * updateSearchParams({ layout: 'list' }, router);
 * 
 * @example
 * // Remove a parameter
 * updateSearchParams({ layout: undefined }, router);
 * 
 * @example
 * // Update multiple parameters
 * updateSearchParams({ layout: 'list', filter: 'active' }, router);
 */
export const updateSearchParams = (
  params: Record<string, string | undefined>,
  router?: any
): void => {
  // Always use window.history.replaceState for silent URL updates that don't trigger rerenders
  // This works on web and in React Native Web environments
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const url = new URL(window.location.href);
    
    // Update or remove parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    
    // Use replaceState to update URL silently - no rerenders triggered
    // This is the fastest way to update the URL without any side effects
    window.history.replaceState({}, '', url.toString());
  } else {
    // Fallback: Only use router.setParams if window.history is not available
    // This should rarely happen, but provides a fallback for edge cases
    if (router && typeof router.setParams === 'function') {
      router.setParams(params);
    }
  }
};

/**
 * Remove a search parameter from the URL
 * 
 * @param param - Parameter name to remove
 * @param router - Optional expo-router router instance (required for mobile)
 * 
 * @example
 * removeSearchParam('layout', router);
 */
export const removeSearchParam = (param: string, router?: any): void => {
  updateSearchParams({ [param]: undefined }, router);
};

/**
 * Set a search parameter in the URL
 * 
 * @param param - Parameter name
 * @param value - Parameter value
 * @param router - Optional expo-router router instance (required for mobile)
 * 
 * @example
 * setSearchParam('layout', 'list', router);
 */
export const setSearchParam = (param: string, value: string, router?: any): void => {
  updateSearchParams({ [param]: value }, router);
};

