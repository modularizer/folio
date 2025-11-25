import { FilterCondition } from 'tsfiltor';

/**
 * Abstract interface for a filter option
 */
export interface FilterOption<T = any> {
  /**
   * Unique identifier for this filter option
   */
  id: string;
  
  /**
   * Display label for this filter option
   */
  label: string;
  
  /**
   * Optional icon name (from Ionicons)
   */
  icon?: string;
  
  /**
   * Optional value associated with this filter
   */
  value?: T;
  
  /**
   * Whether this filter option is currently active
   */
  active?: boolean;
  
  /**
   * Optional tsfiltor condition for this filter
   * If provided, this will be used to filter projects
   */
  condition?: FilterCondition;
}

/**
 * Abstract interface for a sort option
 */
export interface SortOption<T = any> {
  /**
   * Unique identifier for this sort option
   */
  id: string;
  
  /**
   * Display label for this sort option
   */
  label: string;
  
  /**
   * Optional icon name (from Ionicons)
   */
  icon?: string;
  
  /**
   * Optional value associated with this sort
   */
  value?: T;
  
  /**
   * Whether this sort option is currently active
   */
  active?: boolean;
  
  /**
   * Sort direction: 'asc' for ascending, 'desc' for descending
   */
  direction?: 'asc' | 'desc';
  
  /**
   * Whether this sort option is disabled (hidden from UI but kept in code)
   */
  disabled?: boolean;
}

/**
 * Interface for custom URL state management hook
 * Allows implementations to override default URL reading/writing behavior
 */
export interface FilterSortURLHook {
  /**
   * Read state from URL
   * Should return the current filter/sort state from URL parameters
   */
  readFromURL(): {
    filters?: string[];
    sort?: string | null;
    sortDirection?: 'asc' | 'desc';
    [key: string]: any; // Allow additional custom fields
  };
  
  /**
   * Write state to URL
   * Should update URL parameters with the current filter/sort state
   */
  writeToURL(state: {
    filters?: string[];
    sort?: string | null;
    sortDirection?: 'asc' | 'desc';
    [key: string]: any; // Allow additional custom fields
  }): void;
}

/**
 * Interface for filter/sort controller
 * Implement this in your page component to provide filters and sorts
 */
export interface FilterSortController {
  /**
   * Get available filter options
   */
  getFilterOptions(): FilterOption[];
  
  /**
   * Get available sort options
   */
  getSortOptions(): SortOption[];
  
  /**
   * Handle filter option selection
   */
  onFilterSelect(filterId: string): void;
  
  /**
   * Handle sort option selection
   */
  onSortSelect(sortId: string): void;
  
  /**
   * Get the currently active filter IDs
   */
  getActiveFilterIds(): string[];
  
  /**
   * Get the currently active sort ID (for backward compatibility)
   * @deprecated Use getActiveSortIds() instead
   */
  getActiveSortId(): string | null;
  
  /**
   * Get the currently active sort IDs (in order of application)
   */
  getActiveSortIds(): string[];
  
  /**
   * Get the maximum number of sorts to retain (most recent)
   */
  getMaxSorts(): number;
  
  /**
   * Apply language filter and sort (for language tag clicks)
   * Filters to non-zero commits and sorts by bucket (4->1)
   */
  applyLanguageFilterAndSort?(langName: string): void;
  
  /**
   * Get the current version number (increments on every filter/sort change)
   * Use this to trigger re-renders in React components
   */
  getVersion(): number;
}

