/**
 * Base filter/sort controller that handles actual filtering and sorting logic.
 * Implementations should only provide filter/sort options with tsfiltor conditions.
 */

import { FilterSortController, FilterOption, SortOption, FilterSortURLHook } from './types';
import { and, evaluateCondition, FilterCondition } from 'tsfiltor';
import { readFilterSortStateFromURL, writeFilterSortStateToURL, FilterSortURLConfig } from './urlState';
import { getProjectSlug } from '@/utils/slug';

export interface BaseFilterSortControllerConfig<T = any> {
  /**
   * All items to filter/sort (list of dictionaries)
   */
  allItems: T[];
  
  /**
   * Callback when filtered/sorted items change
   */
  onItemsChange: (filteredItems: T[]) => void;
  
  /**
   * Get all filter options (including dynamic ones)
   */
  getFilterOptions: () => FilterOption[];
  
  /**
   * Get all sort options (including dynamic ones)
   */
  getSortOptions: () => SortOption[];
  
  /**
   * Get sort function for a given sort option
   * Should return a comparison function: (a: T, b: T) => number
   */
  getSortFunction: (sortOption: SortOption) => ((a: T, b: T) => number) | null;
  
  /**
   * Initial active filter IDs
   */
  initialFilterIds?: string[];
  
  /**
   * Initial active sort ID
   */
  initialSortId?: string | null;
  
  /**
   * Router instance for URL state
   */
  router?: any;
  
  /**
   * URL config
   */
  urlConfig?: FilterSortURLConfig;
  
  /**
   * Custom URL hook
   */
  urlHook?: FilterSortURLHook;
  
  /**
   * Maximum number of sorts to retain
   */
  maxSorts?: number;
}

/**
 * Base filter/sort controller implementation
 * Handles all filtering and sorting logic generically
 */
export class BaseFilterSortController<T = any> implements FilterSortController {
  private allItems: T[];
  private activeFilterIds: Set<string> = new Set();
  private activeSortIds: string[] = [];
  private maxSorts: number;
  private onItemsChange: (filteredItems: T[]) => void;
  private router?: any;
  private urlConfig: FilterSortURLConfig;
  private urlHook?: FilterSortURLHook;
  private _getFilterOptions: () => FilterOption[];
  private _getSortOptions: () => SortOption[];
  private _getSortFunction: (sortOption: SortOption) => ((a: T, b: T) => number) | null;
  private version: number = 0; // Increment on every filter/sort change to trigger re-renders
  private lastFilteredIds: (string | number)[] | null = null; // Cache last filtered IDs to avoid unnecessary updates
  private sortDirections: Map<string, 'asc' | 'desc'> = new Map(); // Store sort directions separately
  
  constructor(config: BaseFilterSortControllerConfig<T>) {
    this.allItems = config.allItems;
    this.onItemsChange = config.onItemsChange;
    this._getFilterOptions = config.getFilterOptions;
    this._getSortOptions = config.getSortOptions;
    this._getSortFunction = config.getSortFunction;
    this.router = config.router;
    this.urlConfig = { ...config.urlConfig, router: config.router };
    this.urlHook = config.urlHook;
    this.maxSorts = config.maxSorts || 2;
    
    // Read initial state from URL if available
    let urlState;
    if (this.urlHook) {
      urlState = this.urlHook.readFromURL();
    } else {
      urlState = readFilterSortStateFromURL(this.urlConfig);
    }
    
    // Use URL state if available, otherwise use provided initial values
    this.activeFilterIds = new Set(urlState.filters || config.initialFilterIds || []);
    
    // Initialize activeSortIds from URL or initial value
    if (urlState.sort) {
      const sortOption = this._getSortOptions().find(opt => opt.id === urlState.sort);
      if (sortOption && !sortOption.disabled) {
        this.activeSortIds = [urlState.sort];
        // Apply sort direction from URL if available
        if (urlState.sortDirection) {
          this.sortDirections.set(urlState.sort, urlState.sortDirection);
        }
      } else {
        // If the sort from URL is disabled, reset to default
        this.activeSortIds = [config.initialSortId || 'pinnedFirst'];
      }
    } else {
      this.activeSortIds = config.initialSortId ? [config.initialSortId] : ['pinnedFirst'];
    }
    
    // Apply initial filters/sorts
    this.applyFiltersAndSorts();
  }
  
  // Ensure activeSortIds is always initialized
  private ensureInitialized(): void {
    if (this.activeSortIds.length === 0) {
      this.activeSortIds = ['pinnedFirst'];
    }
  }
  
  // Limit activeSortIds to maxSorts (keep most recent)
  private limitActiveSorts(): void {
    if (this.activeSortIds.length > this.maxSorts) {
      this.activeSortIds = this.activeSortIds.slice(0, this.maxSorts);
    }
  }
  
  // Sync state to URL
  private syncStateToURL(): void {
    const firstSortId = this.activeSortIds.length > 0 ? this.activeSortIds[0] : null;
    const sortDirection = firstSortId ? (this.sortDirections.get(firstSortId) || 'desc') : 'desc';
    
    if (this.urlHook) {
      // Defer URL update to next tick to avoid blocking the main thread
      // This prevents URL updates from causing synchronous rerenders
      setTimeout(() => {
        this.urlHook!.writeToURL({
          filters: Array.from(this.activeFilterIds),
          sort: firstSortId,
          sortDirection,
        });
      }, 0);
    } else {
      writeFilterSortStateToURL(
        {
          filters: Array.from(this.activeFilterIds),
          sort: firstSortId,
          sortDirection,
        },
        {
          ...this.urlConfig,
          defaultSortId: 'pinnedFirst',
          defaultSortDirection: 'desc',
        }
      );
    }
  }
  
  updateItems(allItems: T[]) {
    this.allItems = allItems;
    this.ensureInitialized();
    this.applyFiltersAndSorts();
  }
  
  getFilterOptions(): FilterOption[] {
    return this._getFilterOptions().map(opt => ({
      ...opt,
      active: this.activeFilterIds.has(opt.id),
    }));
  }
  
  getSortOptions(): SortOption[] {
    this.ensureInitialized();
    return this._getSortOptions()
      .filter(opt => !opt.disabled)
      .map(opt => {
        const isActive = this.activeSortIds.includes(opt.id);
        // Get direction from our stored map, or use the default from the option
        const direction = this.sortDirections.get(opt.id) || opt.direction || 'desc';
        return {
          ...opt,
          active: isActive,
          direction,
        };
      });
  }
  
  onFilterSelect = (filterId: string): void => {
    const startTime = performance.now();
    console.log('[Filter/Sort] Filter pressed:', filterId);
    if (this.activeFilterIds.has(filterId)) {
      this.activeFilterIds.delete(filterId);
    } else {
      this.activeFilterIds.add(filterId);
    }
    this.version++; // Increment version to trigger immediate re-renders
    this.syncStateToURL();
    this.applyFiltersAndSorts();
    const endTime = performance.now();
    console.log('[Filter/Sort] Filter completed:', filterId, `(${(endTime - startTime).toFixed(2)}ms)`);
  };
  
  onSortSelect = (sortId: string): void => {
    const startTime = performance.now();
    console.log('[Filter/Sort] Sort pressed:', sortId);
    this.ensureInitialized();
    
    const selectedOption = this._getSortOptions().find(opt => opt.id === sortId);
    if (selectedOption?.disabled) {
      return;
    }
    
    const currentIndex = this.activeSortIds.indexOf(sortId);
    
    if (currentIndex >= 0) {
      // Sort is already active - implement tristate: desc -> asc -> deactivate
      const currentDirection = this.sortDirections.get(sortId) || selectedOption?.direction || 'desc';
      
      if (currentDirection === 'desc') {
        // First state: desc -> change to asc
        this.sortDirections.set(sortId, 'asc');
        this.activeSortIds.splice(currentIndex, 1);
        this.activeSortIds.unshift(sortId);
      } else {
        // Second state: asc -> deactivate (remove from activeSortIds)
        this.activeSortIds.splice(currentIndex, 1);
        // Reset direction to default for next time
        this.sortDirections.delete(sortId);
      }
    } else {
      // Sort is not active - activate with default direction (desc)
      const defaultDirection = selectedOption?.direction || 'desc';
      this.sortDirections.set(sortId, defaultDirection);
      this.activeSortIds.unshift(sortId);
      this.limitActiveSorts();
    }
    
    this.version++; // Increment version to trigger immediate re-renders
    this.syncStateToURL();
    this.applyFiltersAndSorts();
    const endTime = performance.now();
    console.log('[Filter/Sort] Sort completed:', sortId, `(${(endTime - startTime).toFixed(2)}ms)`);
  };
  
  getActiveFilterIds(): string[] {
    return Array.from(this.activeFilterIds);
  }
  
  getVersion(): number {
    return this.version;
  }
  
  getActiveSortId(): string | null {
    this.ensureInitialized();
    return this.activeSortIds.length > 0 ? this.activeSortIds[0] : null;
  }
  
  getActiveSortIds(): string[] {
    this.ensureInitialized();
    return [...this.activeSortIds];
  }
  
  getMaxSorts(): number {
    return this.maxSorts;
  }
  
  private applyFiltersAndSorts(): void {
    this.ensureInitialized();
    const startTime = performance.now();
    
    // Don't filter if no items available
    if (!this.allItems || this.allItems.length === 0) {
      console.log('[BaseFilterSortController] No items to filter, skipping');
      this.onItemsChange([]);
      return;
    }
    
    // Create a map of ID -> item for O(1) lookup
    const itemMap = new Map<string | number, T>();
    const itemIds: (string | number)[] = [];
    
    for (const item of this.allItems) {
      const data = (item as any).data || item;
      const id = getProjectSlug(data);
      if (id !== undefined && id !== null) {
        itemMap.set(id, item);
        itemIds.push(id);
      }
    }
    
    console.log('[BaseFilterSortController] applyFiltersAndSorts:', {
      totalItems: this.allItems.length,
      itemIdsCount: itemIds.length,
      activeFilters: Array.from(this.activeFilterIds),
      activeSorts: this.activeSortIds,
    });
    
    // Apply filters - just get IDs that pass
    let filteredIds: (string | number)[] = itemIds;
    
    if (this.activeFilterIds.size > 0) {
      const filterOptions = this._getFilterOptions();
      const activeFilterOptions = filterOptions.filter(opt => this.activeFilterIds.has(opt.id));
      
      console.log('[BaseFilterSortController] Active filter options:', {
        totalFilterOptions: filterOptions.length,
        activeFilterOptions: activeFilterOptions.map(opt => ({ id: opt.id, label: opt.label })),
      });
      
      const filterConditions = activeFilterOptions
        .map(opt => opt.condition)
        .filter((condition): condition is NonNullable<typeof condition> => condition !== undefined);
      
      if (filterConditions.length > 0) {
        const combinedCondition = filterConditions.length === 1
          ? filterConditions[0]
          : and(...filterConditions);
        
        let matchCount = 0;
        let debugChecked = 0;
        const maxDebugSamples = 5;
        
        console.log('[BaseFilterSortController] About to evaluate conditions:', {
          conditionType: typeof combinedCondition,
          isFunction: typeof combinedCondition === 'function',
          conditionKeys: combinedCondition && typeof combinedCondition === 'object' ? Object.keys(combinedCondition) : 'N/A',
        });
        
        filteredIds = itemIds.filter(id => {
          const item = itemMap.get(id);
          if (!item) return false;
          const data = (item as any).data || item;
          
          // Debug first few items - log the ACTUAL raw data being filtered (NO TRANSFORMATIONS)
          if (debugChecked < maxDebugSamples) {
            console.log(`[BaseFilterSortController] Checking item ${debugChecked + 1}/${maxDebugSamples}:`, data);
            debugChecked++;
          }
          
          // If condition is a plain function, call it directly instead of using evaluateCondition
          let matches: boolean;
          if (typeof combinedCondition === 'function') {
            matches = combinedCondition(data);
          } else {
            matches = evaluateCondition(data, combinedCondition);
          }
          
          if (matches) matchCount++;
          return matches;
        });
        
        console.log('[BaseFilterSortController] Filter results:', {
          inputCount: itemIds.length,
          filteredCount: filteredIds.length,
          matchCount,
          activeFilters: Array.from(this.activeFilterIds),
        });
      }
    }
    
    // Apply sorting - sort the IDs array
    if (this.activeSortIds.length > 0 && filteredIds.length > 0) {
      // Get items for sorting
      const itemsToSort = filteredIds.map(id => itemMap.get(id)!).filter(Boolean);
      
      // Apply sorts in reverse order (most recent first)
      for (let i = this.activeSortIds.length - 1; i >= 0; i--) {
        const sortId = this.activeSortIds[i];
        const baseSortOption = this._getSortOptions().find(opt => opt.id === sortId);
        
        if (baseSortOption) {
          // Get the stored direction, or use the default from the option
          const direction = this.sortDirections.get(sortId) || baseSortOption.direction || 'desc';
          // Create a sort option with the current direction
          const sortOption = { ...baseSortOption, direction };
          const sortFn = this._getSortFunction(sortOption);
          if (sortFn) {
            itemsToSort.sort(sortFn);
          }
        }
      }
      
      // Extract IDs from sorted items
      filteredIds = itemsToSort.map(item => {
        const data = (item as any).data || item;
        return getProjectSlug(data);
      }).filter(id => id !== undefined && id !== null);
    }
    
    // Check if results actually changed (compare IDs)
    const idsChanged = !this.lastFilteredIds || 
      this.lastFilteredIds.length !== filteredIds.length ||
      this.lastFilteredIds.some((id, i) => id !== filteredIds[i]);
    
    if (!idsChanged) {
      // Results are identical, skip update
      return;
    }
    
    // Convert IDs back to items
    const filtered = filteredIds.map(id => itemMap.get(id)!).filter(Boolean);
    
    // Cache the filtered IDs for next comparison
    this.lastFilteredIds = [...filteredIds];
    
    const endTime = performance.now();
    console.log('[Filter/Sort] applyFiltersAndSorts completed:', {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      inputCount: this.allItems.length,
      filteredCount: filtered.length,
      activeFilters: Array.from(this.activeFilterIds),
      activeSorts: this.activeSortIds,
    });
    
    this.onItemsChange(filtered);
  }
}

