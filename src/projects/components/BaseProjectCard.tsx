import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ProjectData } from '../types/ProjectData';
import { CardLayoutMode, defaultCardConfigs, CardConfig } from '../types/CardConfig';
import { useGridLayout } from '@/components/ProjectsGrid';
import { getLanguageDisplayName, getLanguageShortName, isLanguageExcluded } from '@/utils/languageDisplay';
import { LiveUrlPreview } from './LiveUrlPreview';
import { ReadmePreview } from './ReadmePreview';

interface BaseProjectCardProps {
  project: ProjectData;
  onPress: () => void;
  layoutMode?: CardLayoutMode;
  /**
   * Optional border color for the card.
   * When provided, the card border will use this color.
   */
  borderColor?: string;
  /**
   * Whether this project is pinned/highlighted.
   * When true, shows a bookmark icon in the top right corner.
   */
  pinned?: boolean;
  /**
   * Optional custom render function for the title row.
   * If provided, this will be used instead of the default title + tags rendering.
   */
  renderTitleRow?: (styles: any) => React.ReactNode;
  /**
   * Optional custom render function for the description.
   * If provided, this will be used instead of the default description rendering.
   */
  renderDescription?: (styles: any) => React.ReactNode;
  /**
   * Optional custom content to render at the bottom of the card (after description).
   * This is useful for adding project-specific stats or actions.
   */
  renderBottomContent?: (styles: any) => React.ReactNode;
  /**
   * Optional stats to display in an overlay on the top right of the image.
   * Only shown in small card mode.
   * Array of { icon: string, label: string } objects.
   */
  imageOverlayStats?: Array<{ icon: string; label: string }>;
}

/**
 * Base project card component.
 * 
 * This is the default card component for all projects.
 * Extended by SoftwareProjectCard, AppProjectCard, etc.
 * 
 * Supports multiple layout modes and per-project card configuration.
 */
export const BaseProjectCard: React.FC<BaseProjectCardProps> = ({
  project,
  onPress,
  layoutMode = 'medium',
  borderColor,
  pinned = false,
  renderTitleRow,
  renderDescription,
  renderBottomContent,
  imageOverlayStats,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 768;
  const gridLayout = useGridLayout();
  const { cardWidth: gridCardWidth, columns: gridColumns } = gridLayout;
  // console.log(`[BaseProjectCard] useGridLayout returned:`, gridLayout, 'for layoutMode:', layoutMode);
  
  // Get default config for layout mode
  const defaultConfig = defaultCardConfigs[layoutMode];
  
  // Calculate card dimensions based on layout mode and card config
  const cardDimensions = useMemo(() => {
    const config = project.cardConfig || {};
    const baseColumns = defaultConfig.columns;
    
    // Calculate columns (respect min/max from config)
    let columns = baseColumns;
    if (config.minColumns) columns = Math.max(columns, config.minColumns);
    if (config.maxColumns) columns = Math.min(columns, config.maxColumns);
    
    // Calculate width
    let cardWidth: number | string;
    if (layoutMode === 'list') {
      // In list mode, use 100% width to fit container (accounts for parent padding)
      cardWidth = '100%';
    } else {
      // ONLY use grid-calculated width - no fallback calculation
      if (gridCardWidth === undefined) {
        // console.error(`[BaseProjectCard] ${layoutMode} - NO GRID WIDTH PROVIDED! This should never happen.`);
        // Fallback to a safe default, but this should not occur
        cardWidth = defaultConfig.minWidth || 200;
      } else {
        // console.log(`[BaseProjectCard] ${layoutMode} - USING GRID WIDTH:`, gridCardWidth, 'columns:', gridColumns);
        cardWidth = gridCardWidth;
      }
    }
    
    // Calculate height
    let imageHeight = defaultConfig.imageHeight;
    // In list mode, don't constrain height - let it match the card content
    if (layoutMode === 'list') {
      imageHeight = defaultConfig.imageHeight; // Keep original for width calculation
    }
    if (config.aspectRatio && project.imageUrl && typeof cardWidth === 'number') {
      // Only calculate from aspect ratio if we have a numeric width
      imageHeight = cardWidth / config.aspectRatio;
    }
    if (config.height) {
      imageHeight = config.height;
    } else {
      if (config.minHeight) imageHeight = Math.max(imageHeight, config.minHeight);
      if (config.maxHeight) imageHeight = Math.min(imageHeight, config.maxHeight);
    }
    
    return {
      width: cardWidth,
      imageHeight,
      columns,
    };
  }, [screenWidth, layoutMode, project.cardConfig, project.imageUrl, gridCardWidth, gridColumns]);
  
  // Merge languages into tags, removing duplicates
  const mergedTags = useMemo(() => {
    const tags: Array<{ text: string; isLanguage: boolean; percent?: number }> = [];
    const languageNames = new Set<string>();
    
    // First, add languages with percentages (if available)
    // Prefer commit-based breakdown (more accurate) over lines-of-code breakdown
    let hasLanguageData = false;
    if (project.githubLanguagesByCommits && typeof project.githubLanguagesByCommits === 'object') {
      // Commit-based: count is number of commits, not bytes
      const totalCommits = Object.values(project.githubLanguagesByCommits).reduce((sum, c) => sum + c, 0);
      if (totalCommits > 0) {
        hasLanguageData = true;
        const languageEntries = Object.entries(project.githubLanguagesByCommits)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5); // Top 5 languages
        
        languageEntries.forEach(([lang, commits]) => {
          const langLower = lang.toLowerCase();
          // Skip excluded languages (markdown, toml, yaml, json, xml, etc.)
          if (isLanguageExcluded(langLower)) return;
          const percent = Math.round((commits / totalCommits) * 100);
          tags.push({ text: getLanguageShortName(lang), isLanguage: true, percent });
          languageNames.add(langLower);
        });
      }
    } else if (project.githubLanguages && typeof project.githubLanguages === 'object') {
      // Fallback to lines-of-code breakdown
      const totalBytes = Object.values(project.githubLanguages).reduce((sum, b) => sum + b, 0);
      if (totalBytes > 0) {
        hasLanguageData = true;
        const languageEntries = Object.entries(project.githubLanguages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5); // Top 5 languages
        
        languageEntries.forEach(([lang, bytes]) => {
          const langLower = lang.toLowerCase();
          // Skip excluded languages (markdown, toml, yaml, json, xml, etc.)
          if (isLanguageExcluded(langLower)) return;
          const percent = Math.round((bytes / totalBytes) * 100);
          tags.push({ text: getLanguageShortName(lang), isLanguage: true, percent });
          languageNames.add(langLower);
        });
      }
    }
    
    // If we don't have language breakdown data, try to extract languages from tags
    // (GitHub's primary language is often included in tags)
    if (!hasLanguageData && project.tags && project.tags.length > 0) {
      // Common language names that might be in tags
        const commonLanguages = [
          'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
          'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Shell', 'SQL',
          'R', 'MATLAB', 'Lua', 'Perl', 'Scala', 'Clojure', 'Haskell', 'Elixir', 'Vue', 'Svelte',
          'XML'
        ];
      
      project.tags.forEach(tag => {
        // Check if tag matches a common language name (case-insensitive)
        const matchingLanguage = commonLanguages.find(lang => 
          lang.toLowerCase() === tag.toLowerCase()
        );
        if (matchingLanguage && !languageNames.has(matchingLanguage.toLowerCase())) {
          tags.push({ text: getLanguageShortName(matchingLanguage), isLanguage: true }); // No percent
          languageNames.add(matchingLanguage.toLowerCase());
        }
      });
    }
    
    // Then, add regular tags, skipping any that match languages (case-insensitive)
    project.tags.forEach(tag => {
      if (!languageNames.has(tag.toLowerCase())) {
        tags.push({ text: tag, isLanguage: false });
      }
    });
    
    return tags;
  }, [project.tags, project.githubLanguages, project.githubLanguagesByCommits]);
  
  const styles = StyleSheet.create({
    card: {
      width: cardDimensions.width,
      height: project.cardConfig?.height || defaultConfig.cardHeight, // Use standard height unless overridden
      backgroundColor: theme.colors.cardBackground,
      borderRadius: layoutMode === 'list' ? 8 : 12,
      overflow: 'visible', // Changed to 'visible' to allow bookmark icon to show
      marginBottom: 20,
      borderWidth: 1,
      borderColor: borderColor || theme.colors.border,
      ...(layoutMode !== 'list' && borderColor && {
        borderLeftWidth: 12,
        borderLeftColor: borderColor,
      }),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      ...(project.cardConfig?.minHeight && { minHeight: project.cardConfig.minHeight }),
      ...(project.cardConfig?.maxHeight && { maxHeight: project.cardConfig.maxHeight }),
    },
    cardContent: {
      flexDirection: layoutMode === 'list' ? 'row' : 'column',
      flex: 1,
      alignItems: layoutMode === 'list' ? 'stretch' : undefined,
      
    },
    imageContainer: {
      width: layoutMode === 'list' ? defaultConfig.imageHeight * 2 : '100%',
      height: layoutMode === 'list' ? '100%' : cardDimensions.imageHeight,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden', // Clip image to container
      position: 'relative', // Allow absolute positioning of bookmark icon
      ...(layoutMode !== 'list' && {
        // Top left should not be rounded if there's a border color (left border takes that space)
        ...(borderColor ? {borderTopLeftRadius: 1} : { borderTopLeftRadius: 11 }),
        borderTopRightRadius: 11, // Slightly smaller than card radius
      }),
      ...(layoutMode === 'list' && {
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
      }),
    },
    image: {
      width: '100%',
      height: '100%',
    },
    content: {
      padding: layoutMode === 'list' ? 12 : 16,
      flex: 1, // Always use flex to allow marginTop: 'auto' to work
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderTopRightRadius: layoutMode === 'list' ? 8 : 12, // Match outer card border radius
    },
    statsOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 8,
      padding: 6,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    statOverlayItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statOverlayText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    },
    pinnedIconDangling: {
      position: 'absolute',
      top: -10,
      right: 4,
      padding: 4,
      zIndex: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    pinnedIconContainerNoImage: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 16,
      padding: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: layoutMode === 'list' ? 4 : 8,
      flexWrap: 'nowrap',
    },
    titleWithTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
      flexWrap: 'wrap',
    },
    title: {
      fontSize: defaultConfig.fontSize.title,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 0,
    },
    description: {
      fontSize: defaultConfig.fontSize.description,
      color: theme.colors.textSecondary,
      marginBottom: 0, // Remove margin, spacing handled by flexbox
      lineHeight: defaultConfig.fontSize.description + 4,
    },
    topContent: {
      flex: 1, // Allow top content to grow and push tags to bottom
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagsContainerInline: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: 6,
      flexShrink: 1,
      overflow: 'hidden',
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    languageTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    languageText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {(project.liveUrl || project.imageUrl) && (
          <View style={styles.imageContainer}>
            {(() => {
              // Check if liveUrl is a GitHub URL - if so, ignore it
              let shouldUseLiveUrl = false;
              if (project.liveUrl) {
                try {
                  const url = new URL(project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`);
                  shouldUseLiveUrl = url.hostname !== 'github.com' && url.hostname !== 'www.github.com';
                } catch (e) {
                  // Invalid URL, use it anyway
                  shouldUseLiveUrl = true;
                }
              }

              // Check if we should avoid recursive previews
              const shouldAvoidRecursion = (() => {
                // Check if project name is "folio"
                if (project.githubUrl) {
                  const match = project.githubUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
                  const projectName = match ? match[1] : null;
                  if (projectName?.toLowerCase() === 'folio') {
                    return true;
                  }
                }
                
                // Check if current window location starts with the liveUrl
                if (project.liveUrl && typeof window !== 'undefined') {
                  try {
                    const liveUrl = project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`;
                    const currentLocation = window.location.href;
                    if (currentLocation.startsWith(liveUrl)) {
                      return true;
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }
                
                return false;
              })();
              
              if (shouldUseLiveUrl && project.liveUrl && !shouldAvoidRecursion) {
                return (
                  <>
                    <LiveUrlPreview
                      url={project.liveUrl}
                      imageUrl={project.imageUrl}
                      style={styles.image}
                    />
                  </>
                );
              } else if ((!project.liveUrl || shouldAvoidRecursion) && project.githubUrl) {
                // If no liveUrl or should avoid recursion, show README preview
                return (
                  <>
                    <ReadmePreview
                      githubUrl={project.githubUrl}
                      defaultBranch={(project as any).githubDefaultBranch}
                      imageUrl={project.imageUrl}
                      style={styles.image}
                    />
                  </>
                );
              } else if (project.imageUrl) {
                return (
                  <Image
                    source={{ uri: project.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                );
              }
              return null;
            })()}
            {/* Stats overlay in top right (only in small mode) */}
            {layoutMode === 'small' && imageOverlayStats && imageOverlayStats.length > 0 && (
              <View style={styles.statsOverlay}>
                {imageOverlayStats.map((stat, index) => (
                  <View key={index} style={styles.statOverlayItem}>
                    <Ionicons name={stat.icon as any} size={12} color="#fff" />
                    <Text style={styles.statOverlayText}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {/* Pinned icon - dangling in very top right */}
        {pinned && (
          <View style={styles.pinnedIconDangling}>
            <Ionicons name="bookmark" size={20} color="#FFD700" borderWidth={1}/>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.topContent}>
            {renderTitleRow ? (
              renderTitleRow(styles)
            ) : (
              <View style={styles.titleRow}>
                <View style={styles.titleWithTags}>
                  <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{project.title}</Text>
                  {mergedTags.length > 0 && (
                    <View style={styles.tagsContainerInline}>
                      {mergedTags.slice(0, layoutMode === 'list' ? 2 : 3).map((tag, index) => (
                        <View key={index} style={tag.isLanguage ? styles.languageTag : styles.tag}>
                          <Text style={tag.isLanguage ? styles.languageText : styles.tagText}>
                            {tag.text}{tag.percent !== undefined ? ` ${tag.percent}%` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
            {renderDescription ? (
              renderDescription(styles)
            ) : (
              <Text style={styles.description} numberOfLines={layoutMode === 'small' ? 2 : 3}>
                {project.description}
              </Text>
            )}
          </View>
          {renderBottomContent && renderBottomContent(styles)}
        </View>
      </View>
    </TouchableOpacity>
  );
};

