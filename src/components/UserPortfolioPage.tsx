import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { PortfolioHeader } from './PortfolioHeader';
import { ProjectsGrid, ProjectSource } from './ProjectsGrid';
import { IconLabel } from './IconLabel';
import { TimeRangeIconLabel } from './TimeRangeIconLabel';
import { LayoutToggle } from './LayoutToggle';
import { UserProfile } from '@/user/profile';
import { FilterBar } from './filters/FilterBar';
import { FilterSortController } from './filters/types';
import { getLanguageDisplayName, getLanguageShortName } from '@/utils/languageDisplay';
import { setDocumentTitle, setFaviconFromImage, resetFavicon } from '@/utils/pageMetadata';
import { Project } from '@/projects/types';

declare global {
  interface Window {
    projects?: Project['data'][];
  }
}

const isFullProject = (source: ProjectSource): source is Project => {
  return typeof source === 'object' &&
    source !== null &&
    'data' in source &&
    'builder' in source;
};

interface BioStats {
  followers?: number;
  following?: number;
  totalRepos?: number;
  totalStars?: number;
  totalForks?: number;
  totalCommits?: number;
  totalLinesOfCode?: number;
  earliestCommit?: string;
  latestUpdate?: string;
  languagePercentages?: Array<{ lang: string; percent?: number }> | Record<string, number>;
}

interface UserPortfolioPageProps {
  /**
   * User profile data
   */
  profile: UserProfile | null;
  
  /**
   * Optional avatar URL
   */
  avatarUrl?: string;
  
  /**
   * Bio text to display
   */
  bio?: string;
  
  /**
   * Stats container to display in bio section and header
   * This should be a React node containing the stats elements
   */
  bioStats?: React.ReactNode;
  
  /**
   * Aggregate language percentages across all projects
   */
  languagePercentages?: Array<{ lang: string; percent?: number }> | Record<string, number>;
  
  /**
   * Projects to display
   */
  projects: ProjectSource[];
  
  /**
   * Loading state for projects
   */
  projectsLoading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string | null;
  
  /**
   * Whether to show error (default: true)
   */
  showError?: boolean;
  
  /**
   * Custom error component
   */
  renderError?: (error: string) => React.ReactElement;
  
  /**
   * Empty message when no projects
   */
  emptyMessage?: string;
  
  /**
   * Background image/color/element
   */
  background?: string | React.ReactElement;
  
  /**
   * Custom container style
   */
  style?: any;
  
  /**
   * Additional header content (e.g., warning icons)
   */
  headerExtra?: React.ReactNode;
  
  /**
   * Search query state
   */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  
  /**
   * GitHub token for ProjectsGrid (if needed)
   */
  githubToken?: string;
  
  /**
   * Optional filter/sort controller
   * Provides filter and sort options for the projects
   */
  filterSortController?: FilterSortController | null;
}

/**
 * Generic User Portfolio Page Component
 * 
 * Handles all layout logic (sticky headers, bio section, projects grid)
 * that applies to any type of portfolio, not just GitHub.
 */
export const UserPortfolioPage: React.FC<UserPortfolioPageProps> = ({
  profile,
  avatarUrl,
  bio,
  bioStats,
  languagePercentages,
  projects,
  projectsLoading = false,
  error = null,
  showError = true,
  renderError,
  emptyMessage = "No projects found.",
  background,
  style,
  headerExtra,
  searchQuery = '',
  onSearchChange,
  githubToken,
  filterSortController = null,
}) => {
  const { theme } = useTheme();
  const { layoutMode } = useCardLayout();
  const screenWidth = Dimensions.get('window').width;
  const isWideHeaderLayout = screenWidth > 768;
  const [headerRowHeight, setHeaderRowHeight] = useState<number | null>(null);
  const [forcedCompactStage, setForcedCompactStage] = useState(0);
  const lastOverflowWidthRef = useRef<number | null>(null);
  const ROW_HEIGHT_THRESHOLD = 64;

  // Determine baseline stage purely from width to provide a safety net
  // Stage 1: Short language names, Stage 2: Compact filters
  const baseCompactStage = useMemo(() => {
    if (!isWideHeaderLayout) return 0;
    if (screenWidth <= 900) return 2;
    if (screenWidth <= 1100) return 1;
    return 0;
  }, [screenWidth, isWideHeaderLayout]);

  // Track header row height to detect when elements wrap/overlap
  const handleHeaderRowLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setHeaderRowHeight(height);
  }, []);

  useEffect(() => {
    if (!isWideHeaderLayout) {
      setForcedCompactStage(0);
      lastOverflowWidthRef.current = null;
      return;
    }

    if (headerRowHeight === null) {
      return;
    }

    if (headerRowHeight > ROW_HEIGHT_THRESHOLD) {
      // Record the width where overlap started so we know when it's safe to relax
      if (lastOverflowWidthRef.current === null || screenWidth < lastOverflowWidthRef.current) {
        lastOverflowWidthRef.current = screenWidth;
      }
      setForcedCompactStage(prev => {
        if (prev >= 2) return prev;
        return prev + 1;
      });
    } else if (
      lastOverflowWidthRef.current !== null &&
      screenWidth > lastOverflowWidthRef.current + 120
    ) {
      // Only relax once we've grown past the width that previously overflowed
      lastOverflowWidthRef.current = null;
      setForcedCompactStage(0);
    }
  }, [headerRowHeight, isWideHeaderLayout, screenWidth]);

  const effectiveCompactStage = Math.max(baseCompactStage, forcedCompactStage);
  // Stage 1: Short language names, Stage 2: Compact filters
  const useShortLanguageNames = isWideHeaderLayout && effectiveCompactStage >= 1;
  const compactFilterButtons = isWideHeaderLayout && effectiveCompactStage >= 2;

  const formatLanguageName = (lang: string) => {
    const displayName = getLanguageDisplayName(lang);
    if (useShortLanguageNames) {
      return getLanguageShortName(lang) || displayName;
    }
    return displayName;
  };

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery?.trim()) {
      return projects;
    }

    const query = searchQuery.toLowerCase();
    return projects.filter((source) => {
      // For regular projects, check name and description
      if ('data' in source && 'builder' in source) {
        const project = source as any;
        const name = project.data.name?.toLowerCase() || '';
        const description = project.data.description?.toLowerCase() || '';
        return name.includes(query) || description.includes(query);
      }
      
      // For GitHub sources, we can't filter until loaded, so include all
      return true;
    });
  }, [projects, searchQuery]);

  const debugProjectData = useMemo(() => {
    return projects.filter(isFullProject).map(project => project.data);
  }, [projects]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.projects = debugProjectData;
    console.log('[UserPortfolioPage] window.projects updated', {
      count: debugProjectData.length,
      timestamp: new Date().toISOString(),
    });
  }, [debugProjectData]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    stickyHeader: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'transparent',
      paddingHorizontal: screenWidth > 768 ? 8 : 4, // Minimal horizontal padding
      paddingBottom: 0,
      paddingTop: 8,
      // Use negative margin to extend closer to edges
      marginHorizontal: 0, // Negative margin to reduce side spacing
      // Add shadow to indicate it's fixed
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerSpacer: {
      height: screenWidth > 1000 && bio
        ? (screenWidth > 768 ? 95 : 80) - 25 // Less space when bio is in header (bio takes up header space)
        : (screenWidth > 768 ? 95 : 80), // Space for fixed header
      flexShrink: 0, // Prevent shrinking
    },
    content: {
      flex: 1,
      paddingHorizontal: 0, // Padding handled by individual sections
      paddingTop: 0, // No padding - headers are sticky
      paddingBottom: 40,
    },
    scrollContent: {
      paddingTop: 0,
    },
    bioSection: {
      marginBottom: 10, // Reduced from 20, so -10px total (30px less)
      marginTop: screenWidth > 1000 && bio ? -25 : 0, // Adjust when bio is in header
      paddingHorizontal: screenWidth > 768 ? 40 : 20,
      position: 'relative', // Normal flow, not sticky
    },
    bio: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      marginTop: 0,
      marginBottom: 20,
    },
    languagesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 0, // No top margin in header
      marginLeft: 12, // Space from project count
    },
    languageTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Glass effect with dark background
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    languageTagActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    languageTagText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    languageTagTextActive: {
      color: theme.colors.background,
    },
    stickyProjectsHeaderContainer: {
      // Container to ensure sticky positioning works correctly
      position: 'relative',
      width: '100%',
    },
    stickyProjectsHeader: {
      position: 'sticky',
      top: screenWidth > 768 ? 85 : 65, // Lock in place at this position
      left: 0,
      right: 0,
      zIndex: 999,
      backgroundColor: 'transparent',
      paddingHorizontal: screenWidth > 768 ? 40 : 20,
      paddingRight: 5,
      paddingTop: 20, // Reduced from 20
      paddingBottom: 10, // Reduced from 15
      marginTop: -10, // Reduced from 20, so -10px total (30px less)
    //   borderBottomWidth: 1,
    //   borderBottomColor: theme.colors.border,
      // Add shadow when sticky
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: '100%',
      alignSelf: 'stretch',
    },
    projectsSection: {
      paddingHorizontal: screenWidth > 768 ? 40 : 20,
      paddingTop: 40, // Add space above projects grid to prevent cards from being cut off
      paddingBottom: 300, // Extra space at end to see background image
      overflow: 'visible', // Ensure cards aren't clipped
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 20,
    },
    errorText: {
      fontSize: 18,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
  });

  if (!profile) {
    return null;
  }

  const displayProfile = profile;

  // Set document title and favicon
  useEffect(() => {
    // Set document title to user's name
    if (profile?.name) {
      setDocumentTitle(profile.name);
    }

    // Set favicon to profile picture if available
    if (avatarUrl) {
      setFaviconFromImage(avatarUrl).catch((error) => {
        console.warn('Failed to set favicon:', error);
      });
    } else {
      // Reset to default if no avatar
      resetFavicon();
    }

    // Cleanup: reset title and favicon when component unmounts
    return () => {
      setDocumentTitle('Portfolio');
      resetFavicon();
    };
  }, [profile?.name, avatarUrl]);

  return (
    <View style={[styles.container, style]}>
      {/* Fixed Main Header - Outside ScrollView */}
      <View style={styles.stickyHeader}>
        <PortfolioHeader
          profile={displayProfile}
          avatarUrl={avatarUrl}
          bio={screenWidth > 1000 ? bio : undefined}
          bioStats={screenWidth > 1000 ? bioStats : undefined}
        />
        {headerExtra}
      </View>
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer for fixed headers */}
        <View style={styles.headerSpacer} />

        {/* Bio Stats - At the very top, immediately under header (only on screens <= 1000px) */}
        {bioStats && screenWidth <= 1000 && (
          <View style={[
            styles.bioSection, 
            { 
              marginBottom: 0, 
              paddingBottom: 0,
            }
          ]}>
            <View style={styles.statsContainer}>
              {bioStats}
            </View>
          </View>
        )}

        {/* Bio Section - Only show on screens <= 1000px wide */}
        {bio && screenWidth <= 1000 && (
          <View style={styles.bioSection}>
            <Text style={styles.bio}>{bio}</Text>
          </View>
        )}

        {/* Error message */}
        {error && showError && (
          <View style={styles.errorContainer}>
            {renderError ? renderError(error) : (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        )}

        {/* Sticky Projects Header Container - Wraps header and projects to keep sticky working */}
        {!error && (
          <View style={styles.stickyProjectsHeaderContainer}>
            {/* Sticky Projects Header - Locks in place when scrolling */}
            <View style={styles.stickyProjectsHeader}>
              {/* Main Row: Search, Filters/Sorts, Layout Toggle */}
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: screenWidth > 768 ? 'nowrap' : 'wrap' }}
                onLayout={handleHeaderRowLayout}
              >
                {/* Search - on the left */}
                {onSearchChange && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, height: 36, width: screenWidth > 768 ? 300 : undefined, minWidth: 200, flex: screenWidth > 768 ? 0 : 1, maxWidth: 300 }}>
                    <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, height: '100%', paddingVertical: 8, fontSize: 14, color: theme.colors.text }}
                      placeholder={`Search projects (${filteredProjects.length})...`}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={searchQuery}
                      onChangeText={onSearchChange}
                    />
                  </View>
                )}
                
                {/* Filters and Sorts - in same row on wide screens */}
                {screenWidth > 768 && filterSortController && (
                  <FilterBar
                    controller={filterSortController}
                    style={{ flex: 1, minWidth: 0 }}
                    compactButtons={compactFilterButtons}
                  />
                )}
                
                {/* Language breakdown - right of filters on wide screens */}
                {screenWidth > 768 && languagePercentages && filterSortController && (
                  <>
                    {Array.isArray(languagePercentages) && languagePercentages.length > 0 && (
                      <View style={styles.languagesList}>
                        {languagePercentages
                          .filter(item => item.percent !== undefined)
                          .sort((a, b) => (b.percent || 0) - (a.percent || 0))
                          .slice(0, 5)
                          .map(({ lang, percent }) => {
                            const filterId = `lang_${lang.toLowerCase().replace(/\s+/g, '_')}`;
                            const isActive = filterSortController.getActiveFilterIds().includes(filterId);
                            return (
                              <TouchableOpacity
                                key={lang}
                                style={[styles.languageTag, isActive && styles.languageTagActive]}
                                onPress={() => {
                                  // Apply filter (non-zero commits) and sort (bucket 4->1)
                                  if (filterSortController.applyLanguageFilterAndSort) {
                                    filterSortController.applyLanguageFilterAndSort(lang);
                                  } else {
                                    // Fallback to just filter if method not available
                                    filterSortController.onFilterSelect(filterId);
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                              <Text style={[styles.languageTagText, isActive && styles.languageTagTextActive]}>
                                {formatLanguageName(lang)} {percent}%
                              </Text>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    )}
                    {!Array.isArray(languagePercentages) && typeof languagePercentages === 'object' && Object.keys(languagePercentages).length > 0 && (
                      <View style={styles.languagesList}>
                        {Object.entries(languagePercentages)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 5)
                          .map(([lang, percent]) => {
                            const filterId = `lang_${lang.toLowerCase().replace(/\s+/g, '_')}`;
                            const isActive = filterSortController.getActiveFilterIds().includes(filterId);
                            return (
                              <TouchableOpacity
                                key={lang}
                                style={[styles.languageTag, isActive && styles.languageTagActive]}
                                onPress={() => {
                                  // Apply filter (non-zero commits) and sort (bucket 4->1)
                                  if (filterSortController.applyLanguageFilterAndSort) {
                                    filterSortController.applyLanguageFilterAndSort(lang);
                                  } else {
                                    // Fallback to just filter if method not available
                                    filterSortController.onFilterSelect(filterId);
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                              <Text style={[styles.languageTagText, isActive && styles.languageTagTextActive]}>
                                {formatLanguageName(lang)} {percent}%
                              </Text>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    )}
                  </>
                )}
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
                  <LayoutToggle singleIcon={screenWidth < 768} />
                </View>
              </View>
              
              {/* Language breakdown on small screens - separate row */}
              {screenWidth <= 768 && languagePercentages && filterSortController && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  {Array.isArray(languagePercentages) && languagePercentages.length > 0 && (
                    <View style={styles.languagesList}>
                      {languagePercentages
                        .filter(item => item.percent !== undefined)
                        .sort((a, b) => (b.percent || 0) - (a.percent || 0))
                        .slice(0, 5)
                        .map(({ lang, percent }) => {
                          const filterId = `lang_${lang.toLowerCase().replace(/\s+/g, '_')}`;
                          const isActive = filterSortController.getActiveFilterIds().includes(filterId);
                          return (
                            <TouchableOpacity
                              key={lang}
                              style={[styles.languageTag, isActive && styles.languageTagActive]}
                              onPress={() => {
                                filterSortController.onFilterSelect(filterId);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.languageTagText, isActive && styles.languageTagTextActive]}>
                                {lang} {percent}%
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  )}
                  {!Array.isArray(languagePercentages) && typeof languagePercentages === 'object' && Object.keys(languagePercentages).length > 0 && (
                    <View style={styles.languagesList}>
                      {Object.entries(languagePercentages)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([lang, percent]) => {
                          const filterId = `lang_${lang.toLowerCase().replace(/\s+/g, '_')}`;
                          const isActive = filterSortController.getActiveFilterIds().includes(filterId);
                          return (
                            <TouchableOpacity
                              key={lang}
                              style={[styles.languageTag, isActive && styles.languageTagActive]}
                              onPress={() => {
                                filterSortController.onFilterSelect(filterId);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.languageTagText, isActive && styles.languageTagTextActive]}>
                                {lang} {percent}%
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  )}
                </View>
              )}
              
              {/* Filter and Sort Bar - separate row on small screens */}
              {screenWidth <= 768 && filterSortController && (
                <View style={{ marginTop: 8 }}>
                  <FilterBar controller={filterSortController} />
                </View>
              )}
            </View>

            {/* Projects Section - Inside container so sticky header stays visible */}
            <View style={styles.projectsSection}>
              <ProjectsGrid
                projects={filteredProjects}
                title={undefined}
                showCount={false}
                loading={projectsLoading}
                emptyMessage={emptyMessage}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                showLayoutToggle={false} // Already shown in sticky header
                githubToken={githubToken}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

