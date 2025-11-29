import React from 'react';
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
import { BaseProjectCard } from '@/projects/components/BaseProjectCard';
import { SoftwareProjectData } from '../types/SoftwareProjectData';
import { Language, Framework } from '../types/enums';
import { CardLayoutMode } from '@/projects/types/CardConfig';
import { meetsMinStat } from '@/config/minStats';
import { parseGitHubUrl } from '@/utils/github';

interface SoftwareProjectCardProps {
  project: SoftwareProjectData;
  onPress: () => void;
  layoutMode?: CardLayoutMode;
}

/**
 * Software project card component.
 * 
 * Extends BaseProjectCard with software-specific information
 * like languages and frameworks.
 */
export const SoftwareProjectCard: React.FC<SoftwareProjectCardProps> = ({
  project,
  onPress,
  layoutMode = 'medium',
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 768;
  const cardWidth = isTablet ? (screenWidth - 100) / 3 : screenWidth - 40;

  const ownerDisplayName = React.useMemo(() => {
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

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Glass effect with dark background
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    imageContainer: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden', // Clip overflow
    },
    image: {
      width: '150%', // Make image wider to allow more shifting
      height: '100%',
      alignSelf: 'flex-end', // Align to right to show right side of image
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    languagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    languageTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    languageText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    frameworksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    frameworkTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    frameworkText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
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
      color: theme.colors.textSecondary,
    },
    githubLanguagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    githubLanguageTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    githubLanguageText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    commitDatesContainer: {
      marginTop: 8,
      gap: 4,
    },
    commitDateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    commitDateText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {project.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: project.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {project.description}
        </Text>
        
        {project.languages && project.languages.length > 0 && (
          <View style={styles.languagesContainer}>
            {project.languages.slice(0, 3).map((lang, index) => (
              <View key={index} style={styles.languageTag}>
                <Text style={styles.languageText}>{lang}</Text>
              </View>
            ))}
          </View>
        )}
        
        {project.frameworks && project.frameworks.length > 0 && (
          <View style={styles.frameworksContainer}>
            {project.frameworks.slice(0, 2).map((framework, index) => (
              <View key={index} style={styles.frameworkTag}>
                <Text style={styles.frameworkText}>{framework}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.tagsContainer}>
          {project.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        {/* GitHub stats (stars and forks) */}
        {(meetsMinStat(project.githubStars, 'githubStars') ||
          meetsMinStat(project.githubForks, 'githubForks') ||
          project.githubIsFork ||
          project.githubSize !== undefined ||
          meetsMinStat(project.githubContributionPercent, 'githubContributionPercent') ||
          hasOwnerCommitCount ||
          hasOwnerContributionPercent ||
          meetsMinStat(project.githubFilesCount, 'githubFilesCount') ||
          meetsMinStat(project.githubLinesOfCode, 'githubLinesOfCode') ||
          meetsMinStat(project.githubOpenIssues, 'githubOpenIssues') ||
          meetsMinStat(project.githubWatchers, 'githubWatchers') ||
          project.githubLicense ||
          project.githubFirstCommitDate ||
          project.githubLastCommitDate) && (
          <View style={styles.statsContainer}>
            {meetsMinStat(project.githubStars, 'githubStars') && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubStars.toLocaleString()}</Text>
              </View>
            )}
            {meetsMinStat(project.githubForks, 'githubForks') && (
              <View style={styles.statItem}>
                <Ionicons name="git-branch" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubForks.toLocaleString()}</Text>
              </View>
            )}
            {project.githubIsFork && (
              <View style={styles.statItem}>
                <Ionicons name="git-merge" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>Fork</Text>
              </View>
            )}
            {project.githubSize !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="folder" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>
                  {project.githubSize >= 1024 
                    ? `${(project.githubSize / 1024).toFixed(1)} MB`
                    : `${project.githubSize} KB`}
                </Text>
              </View>
            )}
            {meetsMinStat(project.githubContributionPercent, 'githubContributionPercent') && (
              <View style={styles.statItem}>
                <Ionicons name="code" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubContributionPercent}% code</Text>
              </View>
            )}
            {hasOwnerCommitCount && (
              <View style={styles.statItem}>
                <Ionicons name="git-commit" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{ownerCommitCount!.toLocaleString()} commits</Text>
              </View>
            )}
            {hasOwnerContributionPercent && (
              <View style={styles.statItem}>
                <Ionicons name="person" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>
                  {ownerDisplayName ? `${ownerDisplayName}'s commits` : 'Owner commits'} · {ownerContributionPercent}%
                </Text>
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
            {meetsMinStat(project.githubOpenIssues, 'githubOpenIssues') && (
              <View style={styles.statItem}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubOpenIssues} issues</Text>
              </View>
            )}
            {meetsMinStat(project.githubWatchers, 'githubWatchers') && (
              <View style={styles.statItem}>
                <Ionicons name="eye" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubWatchers.toLocaleString()} watchers</Text>
              </View>
            )}
            {project.githubLicense && (
              <View style={styles.statItem}>
                <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>{project.githubLicense}</Text>
              </View>
            )}
            {project.githubArchived && (
              <View style={styles.statItem}>
                <Ionicons name="archive" size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                <Text style={styles.statText}>Archived</Text>
              </View>
            )}
            {(project.githubFirstCommitDate || project.githubLastCommitDate) && (() => {
              const formatDate = (dateString: string): { text: string; daysAgo: number; isDaysAgo: boolean; date: Date } => {
                const date = new Date(dateString);
                const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                const showDaysAgo = daysAgo <= 21; // Show "days ago" if within 3 weeks
                
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
                  text = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }
                
                return { text, daysAgo, isDaysAgo: showDaysAgo, date };
              };
              
              const firstDateInfo = project.githubFirstCommitDate ? formatDate(project.githubFirstCommitDate) : null;
              const lastDateInfo = project.githubLastCommitDate ? formatDate(project.githubLastCommitDate) : null;
              
              let displayText: string;
              if (firstDateInfo && lastDateInfo) {
                // Both dates available - consolidate if possible
                if (firstDateInfo.text === lastDateInfo.text) {
                  // Same date, just show once
                  displayText = firstDateInfo.text;
                  } else if (firstDateInfo.isDaysAgo && lastDateInfo.isDaysAgo) {
                    // Both in "days ago" format - show as "older → newer days ago"
                    const older = Math.max(firstDateInfo.daysAgo, lastDateInfo.daysAgo);
                    const newer = Math.min(firstDateInfo.daysAgo, lastDateInfo.daysAgo);
                    if (older === newer) {
                      displayText = firstDateInfo.text;
                    } else {
                      // Format the days ago text properly
                      const olderText = older === 1 ? 'Yesterday' : `${older} days ago`;
                      const newerText = newer === 1 ? 'Yesterday' : newer === 0 ? 'Today' : `${newer} days ago`;
                      displayText = `${olderText} → ${newerText}`;
                    }
                } else if (!firstDateInfo.isDaysAgo && !lastDateInfo.isDaysAgo) {
                  // Both are full dates - check if same month/year to consolidate
                  const first = firstDateInfo.date;
                  const last = lastDateInfo.date;
                  if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
                    // Same month and year - show "Nov 10 - 17, 2025"
                    const month = first.toLocaleDateString('en-US', { month: 'short' });
                    const year = first.getFullYear();
                    const firstDay = first.getDate();
                    const lastDay = last.getDate();
                    displayText = `${month} ${firstDay} - ${lastDay}, ${year}`;
                  } else {
                    // Different months/years - show both
                    displayText = `${firstDateInfo.text} → ${lastDateInfo.text}`;
                  }
                } else {
                  // Mixed format - show both with arrow
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
          </View>
        )}
        {/* Language breakdown (if available) */}
        {project.githubLanguages && Object.keys(project.githubLanguages).length > 0 && (
          <View style={styles.githubLanguagesContainer}>
            {Object.entries(project.githubLanguages)
              .sort(([, a], [, b]) => b - a) // Sort by bytes, descending
              .slice(0, 3) // Show top 3 languages
              .map(([lang, bytes]) => {
                const totalBytes = Object.values(project.githubLanguages!).reduce((sum, b) => sum + b, 0);
                const percent = Math.round((bytes / totalBytes) * 100);
                return (
                  <View key={lang} style={styles.githubLanguageTag}>
                    <Text style={styles.githubLanguageText}>{lang} {percent}%</Text>
                  </View>
                );
              })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

