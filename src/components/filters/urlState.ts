/**
 * URL state management utilities for filter/sort controllers
 * 
 * Provides functions to sync filter and sort state with URL query parameters.
 * Only non-default values are stored in the URL.
 */

import { getSearchParam, updateSearchParams } from '@/utils/url';

export interface FilterSortURLState {
  /**
   * Active filter IDs (comma-separated in URL)
   */
  filters?: string[];
  
  /**
   * Active sort ID
   */
  sort?: string | null;
  
  /**
   * Sort direction (only stored if non-default)
   */
  sortDirection?: 'asc' | 'desc';
}

export interface FilterSortURLConfig {
  /**
   * Default sort ID (if not provided, won't be stored in URL)
   */
  defaultSortId?: string | null;
  
  /**
   * Default sort direction (if not provided, won't be stored in URL)
   */
  defaultSortDirection?: 'asc' | 'desc';
  
  /**
   * URL parameter names (optional, uses defaults if not provided)
   */
  paramNames?: {
    filters?: string;
    sort?: string;
    sortDirection?: string;
  };
  
  /**
   * Router instance for updating URL (optional, uses browser API on web)
   */
  router?: any;
}

const DEFAULT_PARAM_NAMES = {
  filters: 'filter',
  sort: 'sort',
  sortDirection: 'sortDir',
};

/**
 * Read filter/sort state from URL query parameters
 */
export function readFilterSortStateFromURL(
  config: FilterSortURLConfig = {}
): FilterSortURLState {
  const paramNames = { ...DEFAULT_PARAM_NAMES, ...config.paramNames };
  
  // Read filters (comma-separated)
  const filtersParam = getSearchParam(paramNames.filters);
  const filters = filtersParam
    ? filtersParam.split(',').filter(Boolean)
    : undefined;
  
  // Read sort ID
  const sortParam = getSearchParam(paramNames.sort);
  const sort = sortParam || undefined;
  
  // Read sort direction (only if sort is set)
  const sortDirParam = sort ? getSearchParam(paramNames.sortDirection) : null;
  const sortDirection = sortDirParam as 'asc' | 'desc' | undefined;
  
  return {
    filters,
    sort,
    sortDirection,
  };
}

/**
 * Write filter/sort state to URL query parameters
 * Only writes non-default values; removes params for default values
 */
export function writeFilterSortStateToURL(
  state: FilterSortURLState,
  config: FilterSortURLConfig = {}
): void {
  const paramNames = { ...DEFAULT_PARAM_NAMES, ...config.paramNames };
  const router = config.router;
  
  const {
    defaultSortId = null,
    defaultSortDirection = 'desc',
  } = config;
  
  const params: Record<string, string | undefined> = {};
  
  // Write filters (only if non-empty)
  if (state.filters && state.filters.length > 0) {
    params[paramNames.filters] = state.filters.join(',');
  } else {
    params[paramNames.filters] = undefined; // Remove if empty
  }
  
  // Write sort ID (only if different from default)
  if (state.sort && state.sort !== defaultSortId) {
    params[paramNames.sort] = state.sort;
    
    // Write sort direction (only if different from default)
    if (state.sortDirection && state.sortDirection !== defaultSortDirection) {
      params[paramNames.sortDirection] = state.sortDirection;
    } else {
      params[paramNames.sortDirection] = undefined; // Remove if default
    }
  } else {
    // Remove sort params if using default
    params[paramNames.sort] = undefined;
    params[paramNames.sortDirection] = undefined;
  }
  
  // Update URL
  updateSearchParams(params, router);
}

