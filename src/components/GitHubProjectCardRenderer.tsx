import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ProjectData } from '@/projects/types';
import { CardLayoutMode } from '@/projects/types/CardConfig';
import { BaseProjectCard } from '@/projects/components/BaseProjectCard';
import { getGitHubProjectBorderColor } from '@/utils/githubBorderColor';
import { getLanguageDisplayName, getLanguageShortName, isLanguageExcluded } from '@/utils/languageDisplay';
import { meetsMinStat } from '@/config/minStats';
import { parseGitHubUrl } from '@/utils/github';

interface GitHubProjectCardRendererProps {
  project: ProjectData;
  onPress: () => void;
  layoutMode?: CardLayoutMode;
}

/**
 * GitHub-specific project card renderer.
 * 
 * Uses BaseProjectCard for layout/styling and adds GitHub-specific content.
 * This component should ONLY be used for GitHub projects.
 */
export const GitHubProjectCardRenderer: React.FC<GitHubProjectCardRendererProps> = ({
  project,
  onPress,
  layoutMode = 'medium',
}) => {
  const { theme } = useTheme();

  // Calculate border color based on commit percentage
  const borderColor = useMemo(() => {
    return getGitHubProjectBorderColor(project);
  }, [project]);

  const ownerDisplayName = useMemo(() => {
    if (project.githubUrl) {
      const repoPath = parseGitHubUrl(project.githubUrl);
      if (repoPath) {
        const [owner] = repoPath.split('/');
        if (owner) return owner;
      }
    }
    if (typeof (project as any).username === 'string') {
      return (project as any).username as string;
    }
    return undefined;
  }, [project.githubUrl, project]);

  const ownerContributionPercent = typeof project.githubContributionPercent === 'number'
    ? project.githubContributionPercent
    : undefined;

  const totalCommits = typeof project.githubCommitsCount === 'number'
    ? project.githubCommitsCount
    : undefined;

  const ownerCommitCount = ownerContributionPercent !== undefined && totalCommits !== undefined
    ? Math.round((ownerContributionPercent / 100) * totalCommits)
    : undefined;

  const hasOwnerCommitCount = meetsMinStat(ownerCommitCount, 'githubCommits');
  const hasOwnerContributionPercent = ownerContributionPercent !== undefined && ownerContributionPercent > 0;

  // Merge languages into tags, removing duplicates (same logic as BaseProjectCard)
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

  // GitHub-specific styles (only for content, not layout)
  const styles = StyleSheet.create({
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    forkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    forkBadgeText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    titleStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    titleStatText: {
      fontSize: 12,
      lineHeight: 14,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      rowGap: 4,
      marginTop: 'auto',
      flexWrap: 'wrap',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statIcon: {
      fontSize: 14,
    },
    statText: {
      fontSize: 12,
      lineHeight: 12,
      color: theme.colors.textSecondary,
    },
  });

  // Render GitHub-specific title row (with fork badge, title, stats)
  const renderTitleRow = (baseStyles: any) => {
    // Always show title and stats - never hide them

    // Calculate title font size based on length
    const titleLength = project.title.length;
    const baseTitleFontSize = typeof baseStyles.title.fontSize === 'number' 
      ? baseStyles.title.fontSize 
      : 20; // fallback
    let titleFontSize = baseTitleFontSize;
    if (titleLength > 14) {
      titleFontSize = baseTitleFontSize - 2;
    } else if (titleLength > 8) {
      titleFontSize = baseTitleFontSize - 1;
    }

    return (
      <View style={baseStyles.titleRow}>
        {project.githubIsFork && (
          <View style={styles.forkBadge}>
            <Ionicons name="git-merge" size={14} color={theme.colors.textSecondary} />
          </View>
        )}
        <View style={baseStyles.titleWithTags}>
          <Text style={[baseStyles.title, { fontSize: titleFontSize }]}>{project.title}</Text>
          {mergedTags.length > 0 && (
            <View style={baseStyles.tagsContainerInline}>
              {mergedTags.slice(0, layoutMode === 'list' ? 2 : 3).map((tag, index) => (
                <View key={index} style={tag.isLanguage ? baseStyles.languageTag : baseStyles.tag}>
                  <Text style={tag.isLanguage ? baseStyles.languageText : baseStyles.tagText}>
                    {tag.text}{tag.percent !== undefined ? ` ${tag.percent}%` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {/* Only show title stats if NOT in small mode (small mode shows them in overlay) */}
        {layoutMode !== 'small' && (project.githubStars !== undefined || project.githubForks !== undefined || (project.contributors !== undefined && project.contributors > 0) || project.githubOpenIssues !== undefined) && (
          <View style={styles.titleStats}>
            {project.contributors !== undefined && project.contributors > 0 && (
              <View style={styles.titleStatItem}>
                <Ionicons name="people" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.titleStatText}>{project.contributors.toLocaleString()}</Text>
              </View>
            )}
            {project.githubStars !== undefined && (
              <View style={styles.titleStatItem}>
                <Ionicons name="star" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.titleStatText}>{project.githubStars.toLocaleString()}</Text>
              </View>
            )}
            {project.githubForks !== undefined && (
              <View style={styles.titleStatItem}>
                <Ionicons name="git-branch" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.titleStatText}>{project.githubForks.toLocaleString()}</Text>
              </View>
            )}
            {project.githubOpenIssues !== undefined && project.githubOpenIssues > 0 && (
              <View style={styles.titleStatItem}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.titleStatText}>{project.githubOpenIssues}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render GitHub-specific description (always show)
  const renderDescription = (baseStyles: any) => {
    return (
      <Text style={baseStyles.description} numberOfLines={layoutMode === 'small' ? 2 : 3}>
        {project.description}
      </Text>
    );
  };

  // Render GitHub-specific bottom content (stats)
  const renderBottomContent = (baseStyles: any) => {
    const hasStats = project.liveUrl || 
      hasOwnerCommitCount ||
      hasOwnerContributionPercent ||
      meetsMinStat(project.githubFilesCount, 'githubFilesCount') ||
      meetsMinStat(project.githubLinesOfCode, 'githubLinesOfCode') ||
      project.githubLicense || 
      project.githubLatestRelease || 
      project.githubFirstCommitDate || 
      project.githubLastCommitDate || 
      (project.githubLanguages && typeof project.githubLanguages === 'object' && Object.keys(project.githubLanguages).length > 0);

    if (!hasStats) {
      return null;
    }

    return (
      <View style={styles.statsContainer}>
        {hasOwnerCommitCount && (
          <View style={styles.statItem}>
            <Ionicons name="git-commit" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>{ownerCommitCount!.toLocaleString()} commits</Text>
          </View>
        )}
        {hasOwnerContributionPercent && (
          <View style={styles.statItem}>
            <Ionicons name="person" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>{ownerContributionPercent}%</Text>
          </View>
        )}
        {meetsMinStat(project.githubFilesCount, 'githubFilesCount') && (
          <View style={styles.statItem}>
            <Ionicons name="document" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>{project.githubFilesCount.toLocaleString()} files</Text>
          </View>
        )}
        {meetsMinStat(project.githubLinesOfCode, 'githubLinesOfCode') && (
          <View style={styles.statItem}>
            <Ionicons name="code-slash" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>
              {project.githubLinesOfCode >= 1000 
                ? `${(project.githubLinesOfCode / 1000).toFixed(1)}k` 
                : project.githubLinesOfCode.toLocaleString()} LOC
            </Text>
          </View>
        )}
        {project.githubLicense && (
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>{project.githubLicense}</Text>
          </View>
        )}
        {project.githubLatestRelease && (
          <View style={styles.statItem}>
            <Ionicons name="pricetag" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>{project.githubLatestRelease}</Text>
          </View>
        )}
        {project.githubArchived && (
          <View style={styles.statItem}>
            <Ionicons name="archive" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={styles.statText}>Archived</Text>
          </View>
        )}
        {(project.githubFirstCommitDate || project.githubLastCommitDate) && (() => {
          const formatDate = (dateString: string, includeDay: boolean = true): { text: string; daysAgo: number; isDaysAgo: boolean; date: Date } => {
            const date = new Date(dateString);
            const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            const showDaysAgo = daysAgo <= 21;
            
            let text: string;
            if (showDaysAgo) {
              if (daysAgo === 0) {
                text = 'Today';
              } else if (daysAgo === 1) {
                text = 'Yesterday';
              } else if (daysAgo < 30) {
                text = `${daysAgo} days ago`;
              } else if (daysAgo < 365) {
                text = `${Math.floor(daysAgo / 30)} months ago`;
              } else {
                text = `${Math.floor(daysAgo / 365)} years ago`;
              }
            } else {
              if (includeDay) {
                text = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                });
              } else {
                text = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short'
                });
              }
            }
            
            return { text, daysAgo, isDaysAgo: showDaysAgo, date };
          };
          
          const isShortMode = layoutMode === 'small';
          const firstDateInfo = project.githubFirstCommitDate ? formatDate(project.githubFirstCommitDate, !isShortMode) : null;
          const lastDateInfo = project.githubLastCommitDate ? formatDate(project.githubLastCommitDate, !isShortMode) : null;
          
          let displayText: string;
          if (firstDateInfo && lastDateInfo) {
            if (firstDateInfo.text === lastDateInfo.text) {
              displayText = firstDateInfo.text;
            } else if (firstDateInfo.isDaysAgo && lastDateInfo.isDaysAgo) {
              const older = Math.max(firstDateInfo.daysAgo, lastDateInfo.daysAgo);
              const newer = Math.min(firstDateInfo.daysAgo, lastDateInfo.daysAgo);
              if (older === newer) {
                displayText = firstDateInfo.text;
              } else {
                const olderText = older === 1 ? 'Yesterday' : `${older} days ago`;
                const newerText = newer === 1 ? 'Yesterday' : newer === 0 ? 'Today' : `${newer} days ago`;
                displayText = `${olderText} → ${newerText}`;
              }
            } else if (!firstDateInfo.isDaysAgo && !lastDateInfo.isDaysAgo) {
              const first = firstDateInfo.date;
              const last = lastDateInfo.date;
              if (isShortMode) {
                // Short mode: show "Jul - Aug, 2024" format
                const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
                const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });
                const firstYear = first.getFullYear();
                const lastYear = last.getFullYear();
                
                if (firstYear === lastYear) {
                  if (firstMonth === lastMonth) {
                    displayText = `${firstMonth}, ${firstYear}`;
                  } else {
                    displayText = `${firstMonth} - ${lastMonth}, ${firstYear}`;
                  }
                } else {
                  displayText = `${firstMonth}, ${firstYear} - ${lastMonth}, ${lastYear}`;
                }
              } else {
                // Normal mode: show full dates with days
                if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
                  const month = first.toLocaleDateString('en-US', { month: 'short' });
                  const year = first.getFullYear();
                  const firstDay = first.getDate();
                  const lastDay = last.getDate();
                  displayText = `${month} ${firstDay} - ${lastDay}, ${year}`;
                } else {
                  displayText = `${firstDateInfo.text} → ${lastDateInfo.text}`;
                }
              }
            } else {
              displayText = `${firstDateInfo.text} → ${lastDateInfo.text}`;
            }
          } else if (lastDateInfo) {
            displayText = lastDateInfo.text;
          } else if (firstDateInfo) {
            displayText = firstDateInfo.text;
          } else {
            return null;
          }
          
          return (
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
              <Text style={styles.statText}>{displayText}</Text>
            </View>
          );
        })()}
        {project.liveUrl && (() => {
          const isGitHubIo = project.liveUrl.includes('github.io');
          return (
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => {
                Linking.openURL(project.liveUrl!).catch((err) => {
                  console.error('Failed to open URL:', err);
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="globe" size={14} color="#3b82f6" style={styles.statIcon} />
              {!isGitHubIo && layoutMode !== 'small' && (
                <Text style={[styles.statText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
                  {project.liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </Text>
              )}
            </TouchableOpacity>
          );
        })()}
      </View>
    );
  };

  // Prepare image overlay stats for small mode
  const imageOverlayStats = useMemo(() => {
    if (layoutMode !== 'small') return undefined;
    
    const stats: Array<{ icon: string; label: string }> = [];
    
    if (project.contributors !== undefined && project.contributors > 0) {
      stats.push({ icon: 'people', label: project.contributors.toLocaleString() });
    }
    if (project.githubStars !== undefined) {
      stats.push({ icon: 'star', label: project.githubStars.toLocaleString() });
    }
    if (project.githubForks !== undefined) {
      stats.push({ icon: 'git-branch', label: project.githubForks.toLocaleString() });
    }
    if (project.githubOpenIssues !== undefined && project.githubOpenIssues > 0) {
      stats.push({ icon: 'alert-circle', label: project.githubOpenIssues.toString() });
    }
    
    return stats.length > 0 ? stats : undefined;
  }, [layoutMode, project.contributors, project.githubStars, project.githubForks, project.githubOpenIssues]);

  return (
    <BaseProjectCard
      project={project}
      onPress={onPress}
      layoutMode={layoutMode}
      borderColor={borderColor}
      pinned={project.githubIsPinned || false}
      renderTitleRow={renderTitleRow}
      renderDescription={renderDescription}
      renderBottomContent={renderBottomContent}
      imageOverlayStats={imageOverlayStats}
    />
  );
};

export default GitHubProjectCardRenderer;
