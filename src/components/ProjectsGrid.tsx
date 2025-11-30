import React, { useMemo, createContext, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TextInput, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { Project } from '@/projects/types';
import ProjectCard from './ProjectCard';
import { GitHubProjectCard } from './GitHubProjectCard';
import { LayoutToggle } from './LayoutToggle';
import { calculateOptimalCardLayout } from '@/utils/cardLayout';
import { defaultCardConfigs } from '@/projects/types/CardConfig';
import { getProjectSlug } from '@/utils/slug';
import { shouldHideProject } from '@/projects/utils/visibility';

// Context to pass calculated card width from grid to cards
interface GridLayoutContextType {
  cardWidth?: number;
  columns?: number;
}

const GridLayoutContext = createContext<GridLayoutContextType>({});

// Memoized card components to prevent unnecessary re-renders
const MemoizedProjectCard = React.memo(ProjectCard, (prevProps, nextProps) => {
  return getProjectSlug(prevProps.project.data) === getProjectSlug(nextProps.project.data) &&
         prevProps.project.data === nextProps.project.data &&
         prevProps.project.builder === nextProps.project.builder;
});

// Lazy initialization to avoid circular dependency
// GitHubProjectCard depends on ProjectCard which can lead back to ProjectsGrid
let MemoizedGitHubProjectCard: typeof GitHubProjectCard | null = null;
const getMemoizedGitHubProjectCard = () => {
  if (!MemoizedGitHubProjectCard) {
    MemoizedGitHubProjectCard = React.memo(GitHubProjectCard, (prevProps, nextProps) => {
      return prevProps.githubUrl === nextProps.githubUrl &&
             prevProps.customData === nextProps.customData &&
             prevProps.githubToken === nextProps.githubToken &&
             prevProps.showLoading === nextProps.showLoading;
    });
  }
  return MemoizedGitHubProjectCard;
};

/**
 * Represents a project source that can be either:
 * - A fully loaded Project object
 * - A GitHub repository URL (will be fetched and displayed)
 */
export type ProjectSource = 
  | Project // Fully loaded project
  | { type: 'github'; url: string; customData?: any; githubToken?: string }; // GitHub URL to fetch

interface ProjectsGridProps {
  /**
   * Array of project sources (mix of Project objects and GitHub URLs)
   */
  projects: ProjectSource[];
  
  /**
   * Optional title for the projects section
   */
  title?: string;
  
  /**
   * Whether to show the project count in the title
   */
  showCount?: boolean;
  
  /**
   * Loading state (for when projects are being fetched)
   */
  loading?: boolean;
  
  /**
   * Custom loading component
   */
  renderLoading?: () => React.ReactElement;
  
  /**
   * Empty state message (when no projects)
   */
  emptyMessage?: string;
  
  /**
   * Custom empty state component
   */
  renderEmpty?: () => React.ReactElement;
  
  /**
   * Search query to filter projects (optional)
   * Projects will be filtered by name, description, etc.
   */
  searchQuery?: string;
  
  /**
   * Callback when search query changes
   */
  onSearchChange?: (query: string) => void;
  
  /**
   * Whether to show the layout toggle (default: false)
   */
  showLayoutToggle?: boolean;
  
  /**
   * GitHub token for fetching GitHub projects (optional)
   * If not provided, GitHub projects will use unauthenticated API
   */
  githubToken?: string;
  
  /**
   * Custom container style
   */
  style?: any;
  
  /**
   * Custom grid container style
   */
  gridStyle?: any;
}

/**
 * Generic ProjectsGrid component that can display a mix of:
 * - Regular Project objects (already loaded)
 * - GitHub repository URLs (fetched on demand)
 * 
 * This component makes it easy to mix GitHub projects with regular projects
 * in a single grid.
 * 
 * @example
 * // Mix of regular and GitHub projects
 * <ProjectsGrid
 *   projects={[
 *     myRegularProject,
 *     { type: 'github', url: 'facebook/react' },
 *     { type: 'github', url: 'vercel/next.js' },
 *     anotherRegularProject,
 *   ]}
 *   title="My Projects"
 * />
 * 
 * @example
 * // Only GitHub projects
 * <ProjectsGrid
 *   projects={githubUrls.map(url => ({ type: 'github', url }))}
 *   githubToken={token}
 * />
 * 
 * @example
 * // Only regular projects
 * <ProjectsGrid
 *   projects={myProjects}
 *   searchQuery={searchTerm}
 * />
 */
export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  title,
  showCount = true,
  loading = false,
  renderLoading,
  emptyMessage = 'No projects found.',
  renderEmpty,
  searchQuery = '',
  onSearchChange,
  showLayoutToggle = false,
  githubToken,
  style,
  gridStyle,
}) => {
  const { theme } = useTheme();
  const { layoutMode } = useCardLayout();
  const screenWidth = Dimensions.get('window').width;
  const renderStartTimeRef = useRef<number | null>(null);
  
  // Glass morphism styles for web
  const glassStyle = Platform.OS === 'web' ? {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } : {};

  const visibleProjects = useMemo(() => {
    return projects.filter((source) => {
      if ('data' in source && 'builder' in source) {
        const project = source as Project;
        return !shouldHideProject(project.data);
      }
      return true;
    });
  }, [projects]);

  const prevProjectsLengthRef = useRef<number>(visibleProjects.length);

  // Track when projects prop changes
  useEffect(() => {
    if (visibleProjects.length !== prevProjectsLengthRef.current) {
      const now = performance.now();
      console.log('[ProjectsGrid] Projects prop changed:', {
        oldLength: prevProjectsLengthRef.current,
        newLength: visibleProjects.length,
        timestamp: now,
      });
      prevProjectsLengthRef.current = visibleProjects.length;
      renderStartTimeRef.current = now;
      
      // Measure when React finishes rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (renderStartTimeRef.current) {
            const renderEndTime = performance.now();
            console.log('[ProjectsGrid] Render completed:', `(${(renderEndTime - renderStartTimeRef.current).toFixed(2)}ms)`);
            renderStartTimeRef.current = null;
          }
        });
      });
    }
  }, [visibleProjects.length]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery?.trim()) {
      return visibleProjects;
    }

    const query = searchQuery.toLowerCase();
    return visibleProjects.filter((source) => {
      // For regular projects, check name and description
      if ('data' in source && 'builder' in source) {
        const project = source as Project;
        const name = String((project.data.name || project.data.title) || '').toLowerCase();
        const description = String(project.data.description || '').toLowerCase();
        return name.includes(query) || description.includes(query);
      }
      
      // For GitHub sources, we can't filter until loaded, so include all
      // (they'll be filtered client-side after loading if needed)
      return true;
    });
  }, [visibleProjects, searchQuery]);

  // Calculate optimal layout for grid (non-list modes only)
  const optimalLayout = useMemo(() => {
    if (layoutMode === 'list') {
      return { gap: 20, cardWidth: 0, columns: 1 }; // Fixed gap for list mode
    }

    const config = defaultCardConfigs[layoutMode];
    const targetGap = config.targetGap ?? 20;
    const padding = 40;
    const availableWidth = screenWidth - padding - 5 - 20; // Subtract 5px to account for borders and spacing, plus 20px for margin

    const minWidth = config.minWidth;
    const maxWidth = config.maxWidth;
    const targetWidth = minWidth && maxWidth ? (minWidth + maxWidth) / 2 : undefined;
    
    if (!targetWidth || !minWidth || !maxWidth) {
      return { gap: targetGap, cardWidth: 0, columns: 1 }; // Fallback to fixed gap
    }

    const minGap = config.minGap ?? 15;
    const maxGap = config.maxGap ?? 60;

    // Always calculate layout based on screen width, even if there are 0 projects
    // This ensures the grid structure is correct
    const layout = calculateOptimalCardLayout(
      availableWidth,
      50, // Always use 50 to avoid recomputing when number of items changes
      minWidth,
      maxWidth,
      targetWidth,
      targetGap,
      minGap,
      maxGap
    );

    const totalGridWidth = layout.columns * layout.cardWidth + (layout.columns - 1) * layout.gap;


    // Return the full layout
    return layout;
  }, [layoutMode, screenWidth]); // Removed filteredProjects.length since we always use 50

  // Memoize GridLayoutContext value
  const gridLayoutContextValue = useMemo(() => ({
    cardWidth: layoutMode !== 'list' ? optimalLayout.cardWidth : undefined,
    columns: layoutMode !== 'list' ? optimalLayout.columns : undefined,
  }), [layoutMode, optimalLayout.cardWidth, optimalLayout.columns]);

  // Memoize styles to prevent recreation on every render
  // Only recreate when theme or layoutMode changes
  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
      flexWrap: 'wrap',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: screenWidth > 768 ? 32 : 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    count: {
      fontSize: screenWidth > 768 ? 14 : 12,
      color: theme.colors.textSecondary,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Glass effect with dark background
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      height: 36,
      minWidth: 200,
      flex: 1,
      maxWidth: 300,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchBar: {
      flex: 1,
      height: '100%',
      paddingVertical: 8,
      fontSize: 14,
      color: theme.colors.text,
    },
    grid: {
      flexDirection: layoutMode === 'list' ? 'column' : 'row',
      flexWrap: layoutMode === 'list' ? 'nowrap' : 'wrap',
      gap: optimalLayout.gap,
      rowGap: layoutMode === 'list' ? 20 : (defaultCardConfigs[layoutMode].verticalGap || 20),
      width: layoutMode === 'list' ? '100%' : (optimalLayout.columns * optimalLayout.cardWidth + (optimalLayout.columns - 1) * optimalLayout.gap),
      alignItems: layoutMode === 'list' ? 'stretch' : 'flex-start',
      justifyContent: layoutMode === 'list' ? 'flex-start' : 'flex-start',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  }), [theme, layoutMode, optimalLayout]);

  // Loading state
  if (loading) {
    if (renderLoading) {
      return <View style={[styles.container, style]}>{renderLoading()}</View>;
    }
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  // Empty state
  if (filteredProjects.length === 0) {
    if (renderEmpty) {
      return <View style={[styles.container, style]}>{renderEmpty()}</View>;
    }
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {showCount && (
              <Text style={styles.count}>({filteredProjects.length})</Text>
            )}
          </View>
          {(onSearchChange || showLayoutToggle) && (
            <View style={styles.controlsRow}>
              {onSearchChange && (
                <View style={[styles.searchBarContainer, glassStyle]}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={theme.colors.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchBar}
                    placeholder="Search projects..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                  />
                </View>
              )}
              {showLayoutToggle && (
                <LayoutToggle singleIcon={screenWidth < 768} />
              )}
            </View>
          )}
        </View>
      )}
      
      <GridLayoutContext.Provider value={gridLayoutContextValue}>
        <View style={[styles.grid, gridStyle]}>
          {filteredProjects.map((source) => {
            // Regular Project object
            if ('data' in source && 'builder' in source) {
              const project = source as Project;
              return (
                <MemoizedProjectCard 
                  key={getProjectSlug(project.data)} 
                  project={project} 
                />
              );
            }
            
            // GitHub URL source
            if ('type' in source && source.type === 'github') {
              const MemoizedGitHubProjectCard = getMemoizedGitHubProjectCard();
              return (
                <MemoizedGitHubProjectCard
                  key={`github-${source.url}`}
                  githubUrl={source.url}
                  customData={source.customData}
                  githubToken={source.githubToken || githubToken}
                  showLoading={true}
                />
              );
            }
            
            // Fallback (shouldn't happen with proper typing)
            return null;
          })}
        </View>
      </GridLayoutContext.Provider>
    </View>
  );
};

export default ProjectsGrid;

// Export hook for cards to use
export const useGridLayout = (): GridLayoutContextType => {
  return useContext(GridLayoutContext);
};

