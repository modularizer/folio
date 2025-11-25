/**
 * GitHub-specific filter and sort controller implementation
 * Uses BaseFilterSortController for actual filtering/sorting
 * Only provides GitHub-specific filter/sort options with tsfiltor conditions
 */

import React, { useMemo, useEffect } from 'react';
import { Project } from '@/projects/types';
import { FilterSortController, FilterOption, SortOption, FilterSortURLHook } from './types';
import { truthy, isNotNull, minLength, and } from 'tsfiltor';
import { BaseFilterSortController, BaseFilterSortControllerConfig } from './BaseFilterSortController';
import { calculateCommitPercentage } from '@/utils/githubBorderColor';
import { getSearchParam, updateSearchParams } from '@/utils/url';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { FilterSortURLConfig } from './urlState';
import { getLanguageDisplayName, isLanguageExcluded } from '@/utils/languageDisplay';
import { getProjectSlug } from '@/utils/slug';
import { getUserCommitCount, HasCommitStats } from '@/utils/githubStats';

/**
 * GitHub-specific filter and sort controller implementation
 * Uses BaseFilterSortController for actual filtering/sorting
 * Only provides GitHub-specific filter/sort options with tsfiltor conditions
 */
export class GitHubFilterSortController implements FilterSortController {
  private baseController: BaseFilterSortController<Project>;
  private languagePercentages?: Array<{ lang: string; percent?: number }> | Record<string, number>;
  
  // Helper to create a language filter condition
  // All language keys are stored in lowercase, so we can do direct lookups
  // Note: The data passed here is the raw ProjectData object (from project.data)
  private createLanguageFilterCondition(langName: string): (data: any) => boolean {
    const langLower = langName.toLowerCase();
    let debugCount = 0; // Track how many times we've logged
    const maxDebug = 10; // Debug first 10 items
    
    console.log('[LanguageFilter] Creating filter condition for:', { langName, langLower });
    
    return (data: any) => {
      const shouldDebug = debugCount < maxDebug;
      debugCount++;
      const projectSlug = getProjectSlug(data);
      
      // Log the ACTUAL raw data being filtered (first item only) - NO TRANSFORMATIONS
      if (debugCount === 1) {
        console.log('[LanguageFilter] Raw data being filtered:', data);
        console.log('[LanguageFilter] Looking for language:', { langName, langLower });
      }
      
      // First check githubLanguageLevels (preferred - based on user commits * language percent)
      if (data.githubLanguageLevels && typeof data.githubLanguageLevels === 'object') {
        const level = data.githubLanguageLevels[langLower];
        // Level > 0 means the user has commits in this language with meaningful contribution
        if (level !== undefined && level > 0) {
          console.log('[LanguageFilter] ✓ Match in githubLanguageLevels:', {
            langName,
            langLower,
            level,
            projectSlug,
            githubLanguageLevels: data.githubLanguageLevels,
          });
          return true;
        }
        if (shouldDebug) {
          console.log('[LanguageFilter] githubLanguageLevels exists but no match:', {
            langLower,
            level,
            allKeys: Object.keys(data.githubLanguageLevels),
            projectSlug,
          });
        }
      }
      
      // Fallback: Check if project has this language in githubLanguagesByCommits with non-zero commits
      if (data.githubLanguagesByCommits && typeof data.githubLanguagesByCommits === 'object') {
        const commits = data.githubLanguagesByCommits[langLower];
        if (commits !== undefined && commits > 0) {
          console.log('[LanguageFilter] ✓ Match in githubLanguagesByCommits:', {
            langName,
            langLower,
            commits,
            projectSlug,
            githubLanguagesByCommits: data.githubLanguagesByCommits,
          });
          return true;
        }
        if (shouldDebug) {
          console.log('[LanguageFilter] githubLanguagesByCommits exists but no match:', {
            langLower,
            commits,
            allKeys: Object.keys(data.githubLanguagesByCommits),
            projectSlug,
          });
        }
      }
      
      // Final fallback: Check githubLanguages (repo-wide language breakdown)
      if (data.githubLanguages && typeof data.githubLanguages === 'object') {
        const langBytes = data.githubLanguages[langLower];
        if (langBytes !== undefined && langBytes > 0) {
          console.log('[LanguageFilter] ✓ Match in githubLanguages:', {
            langName,
            langLower,
            langBytes,
            projectSlug,
            githubLanguages: data.githubLanguages,
          });
          return true;
        }
        if (shouldDebug) {
          console.log('[LanguageFilter] githubLanguages exists but no match:', {
            langLower,
            langBytes,
            allKeys: Object.keys(data.githubLanguages),
            projectSlug,
          });
        }
      }
      
      // Debug when no match found (for first few items)
      if (shouldDebug) {
        console.log('[LanguageFilter] ✗ No match:', {
          langName,
          langLower,
          projectSlug,
          hasGithubLanguageLevels: !!data.githubLanguageLevels,
          hasGithubLanguagesByCommits: !!data.githubLanguagesByCommits,
          hasGithubLanguages: !!data.githubLanguages,
        });
      }
      
      return false;
    };
  }
  
  constructor(
    allProjects: Project[],
    onProjectsChange: (filteredProjects: Project[]) => void,
    initialFilterIds: string[] = [],
    initialSortId: string | null = 'pinnedFirst',
    router?: any,
    urlConfig: FilterSortURLConfig = {},
    languagePercentages?: Array<{ lang: string; percent?: number }> | Record<string, number>,
    maxSorts: number = 2,
    urlHook?: FilterSortURLHook
  ) {
    this.languagePercentages = languagePercentages;
    
    // Read URL state early to get language filters that might not be in languagePercentages
    let urlStateForFilters: { filters?: string[] } = {};
    if (urlHook) {
      urlStateForFilters = urlHook.readFromURL();
    }
    
    // Build filter options (only tsfiltor conditions)
    const getFilterOptions = (): FilterOption[] => {
      const baseFilterOptions: FilterOption[] = [
        {
          id: 'pinned',
          label: 'Pinned',
          icon: 'pin',
          condition: truthy('githubIsPinned'),
        },
        {
          id: 'featured',
          label: 'Featured',
          icon: 'star',
          condition: truthy('featured'),
        },
        {
          id: 'hasLiveUrl',
          label: 'Has Live URL',
          icon: 'globe',
          condition: isNotNull('liveUrl'),
        },
        {
          id: 'hasDescription',
          label: 'Has Description',
          icon: 'document-text',
          condition: and(
            isNotNull('description'),
            minLength('description', 1)
          ),
        },
      ];
      
      // Add dynamic language filters
      const languageFilters: FilterOption[] = [];
      const languageFilterIds = new Set<string>();
      
      // First, add filters from languagePercentages
      if (this.languagePercentages) {
        const languages = Array.isArray(this.languagePercentages)
          ? this.languagePercentages.filter(item => item.percent !== undefined)
          : Object.entries(this.languagePercentages)
              .map(([lang, percent]) => ({ lang, percent: typeof percent === 'number' ? percent : undefined }))
              .filter(item => item.percent !== undefined);
        
        languages.forEach(({ lang, percent }) => {
          const langLower = lang.toLowerCase();
          // Skip excluded languages (markdown, toml, yaml, json, xml, etc.)
          if (isLanguageExcluded(langLower)) return;
          const filterId = `lang_${langLower.replace(/\s+/g, '_')}`;
          languageFilterIds.add(filterId);
          languageFilters.push({
            id: filterId,
            label: `${getLanguageDisplayName(lang)} ${percent}%`,
            icon: 'code',
            condition: this.createLanguageFilterCondition(langLower), // Use langLower to ensure lowercase matching
          });
        });
      }
      
      // Also add any language filters from URL that aren't in languagePercentages
      const urlLanguageFilters = urlStateForFilters.filters?.filter(id => id.startsWith('lang_')) || [];
      urlLanguageFilters.forEach(filterId => {
        if (!languageFilterIds.has(filterId)) {
          // Extract language name from filter ID (e.g., lang_python -> Python)
          const langName = filterId
            .replace('lang_', '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          console.log('[GitHubFilterSortController] Creating language filter from URL:', {
            filterId,
            langName,
          });
          
          languageFilters.push({
            id: filterId,
            label: getLanguageDisplayName(langName),
            icon: 'code',
            condition: this.createLanguageFilterCondition(langName.toLowerCase()), // Ensure lowercase for matching
          });
        }
      });
      
      return [...baseFilterOptions, ...languageFilters];
    };
    
    // Build sort options
    const getSortOptions = (): SortOption[] => {
      const baseSortOptions: SortOption[] = [
        {
          id: 'pinnedFirst',
          label: 'Pinned',
          icon: 'pin',
          direction: 'desc',
        },
        {
          id: 'recentlyUpdated',
          label: 'Recent',
          icon: 'time',
          direction: 'desc',
        },
        {
          id: 'mostStars',
          label: 'Stars',
          icon: 'star',
          direction: 'desc',
        },
        {
          id: 'mostForks',
          label: 'Forks',
          icon: 'git-branch',
          direction: 'desc',
        },
        {
          id: 'percentContribution',
          label: 'Contribution %',
          icon: 'person',
          direction: 'desc',
          disabled: true,
        },
        {
          id: 'totalCommits',
          label: 'Commits',
          icon: 'git-commit',
          direction: 'desc',
        },
        {
          id: 'projectDuration',
          label: 'Duration',
          icon: 'calendar',
          direction: 'desc',
        },
        {
          id: 'alphabetical',
          label: 'A-Z',
          icon: 'text',
          direction: 'asc',
          disabled: true,
        },
      ];
      
      // Language sorts are not shown in UI, they're only used programmatically
      return baseSortOptions;
    };
    
    // Build sort functions (only comparison logic)
    const getSortFunction = (sortOption: SortOption): ((a: Project, b: Project) => number) | null => {
      const direction = sortOption.direction || 'desc';
      const multiplier = direction === 'desc' ? 1 : -1;
      
      switch (sortOption.id) {
        case 'recentlyUpdated':
          return (a, b) => {
            const aDate = a.data.endDate ? new Date(a.data.endDate).getTime() : 0;
            const bDate = b.data.endDate ? new Date(b.data.endDate).getTime() : 0;
            return (bDate - aDate) * multiplier;
          };
          
        case 'mostStars':
          return (a, b) => {
            const aStars = (a.data as any).githubStars || 0;
            const bStars = (b.data as any).githubStars || 0;
            return (bStars - aStars) * multiplier;
          };
          
        case 'mostForks':
          return (a, b) => {
            const aForks = (a.data as any).githubForks || 0;
            const bForks = (b.data as any).githubForks || 0;
            return (bForks - aForks) * multiplier;
          };
          
        case 'percentContribution':
          return (a, b) => {
            const aPercent = calculateCommitPercentage(a.data);
            const bPercent = calculateCommitPercentage(b.data);
            return (bPercent - aPercent) * multiplier;
          };
          
        case 'totalCommits':
          return (a, b) => {
            const aCommits = getUserCommitCount(a.data as HasCommitStats) || 0;
            const bCommits = getUserCommitCount(b.data as HasCommitStats) || 0;
            return (bCommits - aCommits) * multiplier;
          };
          
        case 'projectDuration':
          return (a, b) => {
            const getDuration = (project: Project): number => {
              const start = project.data.startDate ? new Date(project.data.startDate).getTime() : 0;
              const end = project.data.endDate 
                ? new Date(project.data.endDate).getTime() 
                : Date.now();
              if (start === 0) return 0;
              return Math.floor((end - start) / (1000 * 60 * 60 * 24));
            };
            
            const aDuration = getDuration(a);
            const bDuration = getDuration(b);
            return (bDuration - aDuration) * multiplier;
          };
          
        case 'alphabetical':
          return (a, b) => {
            const aName = a.data.title?.toLowerCase() || '';
            const bName = b.data.title?.toLowerCase() || '';
            return aName.localeCompare(bName) * multiplier;
          };
          
        case 'pinnedFirst':
          return (a, b) => {
            const aPinned = (a.data as any).githubIsPinned ? 1 : 0;
            const bPinned = (b.data as any).githubIsPinned ? 1 : 0;
            return (bPinned - aPinned) * multiplier;
          };
          
        default:
          // Handle language-based sorts (langSort_*)
          if (sortOption.id.startsWith('langSort_')) {
            const langKey = sortOption.id.replace('langSort_', '');
            
            // Try to find the actual language name from languagePercentages
            let langName: string | null = null;
            if (this.languagePercentages) {
              if (Array.isArray(this.languagePercentages)) {
                const langEntry = this.languagePercentages.find(
                  item => item.lang.toLowerCase().replace(/\s+/g, '_') === langKey
                );
                if (langEntry) {
                  langName = langEntry.lang;
                }
              } else {
                const langEntry = Object.keys(this.languagePercentages).find(
                  key => key.toLowerCase().replace(/\s+/g, '_') === langKey
                );
                if (langEntry) {
                  langName = langEntry;
                }
              }
            }
            
            // Fallback: reconstruct from key if not found
            if (!langName) {
              langName = langKey
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
            
            const langLower = langName.toLowerCase();
            
            // Use pre-computed levels from project.data.githubLanguageLevels
            return (a, b) => {
              const aData = a.data as any;
              const bData = b.data as any;
              
              // Get level from pre-computed data (O(1) lookup)
              const aLevel = aData.githubLanguageLevels?.[langLower] || 0;
              const bLevel = bData.githubLanguageLevels?.[langLower] || 0;
              
              return (bLevel - aLevel) * multiplier;
            };
          }
          return null;
      }
    };
    
    // Create base controller with GitHub-specific options
    this.baseController = new BaseFilterSortController<Project>({
      allItems: allProjects,
      onItemsChange: onProjectsChange,
      getFilterOptions,
      getSortOptions,
      getSortFunction,
      initialFilterIds,
      initialSortId,
      router,
      urlConfig,
      urlHook,
      maxSorts,
    });
  }
  
  updateProjects(allProjects: Project[]) {
    this.baseController.updateItems(allProjects);
  }
  
  getFilterOptions(): FilterOption[] {
    return this.baseController.getFilterOptions();
  }
  
  getSortOptions(): SortOption[] {
    return this.baseController.getSortOptions();
  }
  
  onFilterSelect = (filterId: string): void => {
    // Handle exclusive language filter selection
    if (filterId.startsWith('lang_')) {
      // Get current active filters from base controller
      const activeFilterIds = this.baseController.getActiveFilterIds();
      
      // Remove all other language filters
      activeFilterIds
        .filter(id => id.startsWith('lang_') && id !== filterId)
        .forEach(id => this.baseController.onFilterSelect(id));
    }
    
    this.baseController.onFilterSelect(filterId);
  };
  
  onSortSelect = (sortId: string): void => {
    this.baseController.onSortSelect(sortId);
  };
  
  getActiveFilterIds(): string[] {
    return this.baseController.getActiveFilterIds();
  }
  
  getActiveSortId(): string | null {
    return this.baseController.getActiveSortId();
  }
  
  getActiveSortIds(): string[] {
    return this.baseController.getActiveSortIds();
  }
  
  getVersion(): number {
    return this.baseController.getVersion();
  }
  
  getMaxSorts(): number {
    return this.baseController.getMaxSorts();
  }
  
  // Apply language filter and sort (called when clicking language tags)
  applyLanguageFilterAndSort(langName: string): void {
    const filterId = `lang_${langName.toLowerCase().replace(/\s+/g, '_')}`;
    const sortId = `langSort_${langName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check if already selected
    const activeFilterIds = this.baseController.getActiveFilterIds();
    const activeSortIds = this.baseController.getActiveSortIds();
    const isAlreadySelected = activeFilterIds.includes(filterId);
    
    if (isAlreadySelected) {
      // Deselect: remove filter and sort
      this.baseController.onFilterSelect(filterId);
      if (activeSortIds.includes(sortId)) {
        this.baseController.onSortSelect(sortId);
      }
    } else {
      // Select: remove other language filters/sorts first
      activeFilterIds
        .filter(id => id.startsWith('lang_') && id !== filterId)
        .forEach(id => this.baseController.onFilterSelect(id));
      
      activeSortIds
        .filter(id => id.startsWith('langSort_') && id !== sortId)
        .forEach(id => {
          // Toggle to remove
          if (this.baseController.getActiveSortIds().includes(id)) {
            this.baseController.onSortSelect(id);
          }
        });
      
      // Add filter
      this.baseController.onFilterSelect(filterId);
      
      // Add sort (if not already active)
      if (!activeSortIds.includes(sortId)) {
        this.baseController.onSortSelect(sortId);
      }
    }
  }
}

/**
 * Custom URL hook for GitHub filter/sort controller
 * Uses `lang=python` format instead of `filter=lang_python&sort=langSort_python`
 */
function useGitHubURLHook(): FilterSortURLHook {
  const router = useRouter();
  const globalSearchParams = useGlobalSearchParams();
  
  return useMemo(() => ({
    readFromURL: () => {
      // Get lang parameter from URL (works on both web and mobile)
      const langParam = (globalSearchParams.lang as string) || getSearchParam('lang');
      
      if (langParam) {
        // Convert lang=python to internal format
        const langKey = langParam.toLowerCase().replace(/\s+/g, '_');
        const filterId = `lang_${langKey}`;
        const sortId = `langSort_${langKey}`;
        
        return {
          filters: [filterId],
          sort: sortId,
          sortDirection: 'desc' as const,
        };
      }
      
      // Fall back to standard format for non-language filters/sorts
      const filtersParam = (globalSearchParams.filter as string) || getSearchParam('filter');
      const filters = filtersParam
        ? filtersParam.split(',').filter(Boolean)
        : undefined;
      
      const sortParam = (globalSearchParams.sort as string) || getSearchParam('sort') || undefined;
      const sort = sortParam || undefined;
      
      const sortDirParam = sort ? ((globalSearchParams.sortDir as string) || getSearchParam('sortDir')) : null;
      const sortDirection = sortDirParam as 'asc' | 'desc' | undefined;
      
      return {
        filters,
        sort,
        sortDirection,
      };
    },
    
    writeToURL: (state) => {
      // Defer URL update to avoid blocking and prevent rerenders
      // Use requestIdleCallback if available, otherwise setTimeout
      const scheduleUpdate = (callback: () => void) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback, { timeout: 100 });
        } else {
          setTimeout(callback, 0);
        }
      };
      
      scheduleUpdate(() => {
        const params: Record<string, string | undefined> = {};
        
        // Check if we have a language filter
        const languageFilter = state.filters?.find(f => f.startsWith('lang_'));
        
        if (languageFilter) {
          // Extract language name from filter ID (e.g., lang_python -> python)
          const langName = languageFilter.replace('lang_', '').replace(/_/g, ' ');
          params['lang'] = langName;
          
          // Remove standard filter/sort params when using language
          params['filter'] = undefined;
          params['sort'] = undefined;
          params['sortDir'] = undefined;
        } else {
          // Use standard format for non-language filters/sorts
          if (state.filters && state.filters.length > 0) {
            params['filter'] = state.filters.join(',');
          } else {
            params['filter'] = undefined;
          }
          
          if (state.sort && state.sort !== 'pinnedFirst') {
            params['sort'] = state.sort;
            
            if (state.sortDirection && state.sortDirection !== 'desc') {
              params['sortDir'] = state.sortDirection;
            } else {
              params['sortDir'] = undefined;
            }
          } else {
            params['sort'] = undefined;
            params['sortDir'] = undefined;
          }
          
          // Remove lang param if not using language filter
          params['lang'] = undefined;
        }
        
        updateSearchParams(params, router);
      });
    },
  }), [router]);
}

export function useGitHubFilterSortController(
  allProjects: Project[],
  onProjectsChange: (filteredProjects: Project[]) => void,
  initialFilterIds: string[] = [],
  initialSortId: string | null = 'pinnedFirst',
  languagePercentages?: Array<{ lang: string; percent?: number }> | Record<string, number>,
  maxSorts: number = 2
): GitHubFilterSortController {
  const urlHook = useGitHubURLHook();
  
  const controller = useMemo(
    () => new GitHubFilterSortController(
      allProjects,
      onProjectsChange,
      initialFilterIds,
      initialSortId,
      undefined,
      {},
      languagePercentages,
      maxSorts,
      urlHook
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [languagePercentages, maxSorts, urlHook]
  );
  
  // Update controller when allProjects or onProjectsChange changes
  React.useEffect(() => {
    controller.updateProjects(allProjects);
  }, [controller, allProjects]);
  
  return controller;
}
