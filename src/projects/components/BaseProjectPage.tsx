import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ProjectData } from '../types/ProjectData';
import { LiveUrlPreview } from './LiveUrlPreview';
import { ReadmePreview } from './ReadmePreview';
import { CommitActivityChart } from '@/components/CommitActivityChart';
import { getLanguageDisplayName, getLanguageShortName, isLanguageExcluded } from '@/utils/languageDisplay';
import { parseGitHubUrl } from '@/utils/github';

interface BaseProjectPageProps {
  project: ProjectData;
  onBack: () => void;
}

type TagBadge = { text: string; isLanguage: boolean; percent?: number };

const formatDate = (date?: string) => {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return undefined;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return value.toLocaleString();
};


const toDisplayString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' ? value : undefined;
};

/**
 * Base project page component.
 * 
 * This is the default detail page component for all projects.
 * Extended by SoftwareProjectPage, AppProjectPage, etc.
 */
export const BaseProjectPage: React.FC<BaseProjectPageProps> = ({
  project,
  onBack,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isWide = screenWidth > 980;
  const ownerDisplayName = useMemo(() => {
    if (project.githubUrl) {
      const repoPath = parseGitHubUrl(project.githubUrl);
      if (repoPath) {
        const [owner] = repoPath.split('/');
        if (owner) {
          return owner;
        }
      }
    }
    const username = toDisplayString((project as any).username);
    if (username) return username;
    return undefined;
  }, [project.githubUrl, project]);

  const mergedTags = useMemo<TagBadge[]>(() => {
    const tags: TagBadge[] = [];
    const languageNames = new Set<string>();

    const pushLanguage = (lang: string, percent?: number) => {
      const langLower = lang.toLowerCase();
      if (isLanguageExcluded(langLower)) return;
      languageNames.add(langLower);
      tags.push({
        text: getLanguageDisplayName(lang),
        isLanguage: true,
        percent,
      });
    };

    if (project.githubLanguagesByCommits && typeof project.githubLanguagesByCommits === 'object') {
      const totalCommits = Object.values(project.githubLanguagesByCommits).reduce((sum, c) => sum + c, 0);
      if (totalCommits > 0) {
        Object.entries(project.githubLanguagesByCommits)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .forEach(([lang, commits]) => {
            pushLanguage(lang, Math.round((commits / totalCommits) * 100));
          });
      }
    } else if (project.githubLanguages && typeof project.githubLanguages === 'object') {
      const totalBytes = Object.values(project.githubLanguages).reduce((sum, c) => sum + c, 0);
      if (totalBytes > 0) {
        Object.entries(project.githubLanguages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .forEach(([lang, bytes]) => {
            pushLanguage(lang, Math.round((bytes / totalBytes) * 100));
          });
      }
    }

    project.tags.forEach(tag => {
      if (!languageNames.has(tag.toLowerCase())) {
        tags.push({ text: tag, isLanguage: false });
      }
    });

    return tags;
  }, [project.tags, project.githubLanguages, project.githubLanguagesByCommits]);

  const infoItems = useMemo(() => {
    const items: Array<{ label: string; value?: string; narrow?: boolean }> = [];
    const start = formatDate(project.startDate);
    const end = formatDate(project.endDate);

    if (project.reason) items.push({ label: 'Reason', value: `${project.reason}` });
    if (project.projectType) items.push({ label: 'Type', value: `${project.projectType}` });
    if (project.status) {
      const statusText = toDisplayString(project.status);
      if (statusText) items.push({ label: 'Status', value: statusText });
    }
    if (start || end) items.push({ label: 'Timeline', value: start && end ? `${start} → ${end}` : start || end });
    const commitsCount = toNumber(project.githubCommitsCount);
    const contributionPercent = toNumber(project.githubContributionPercent);
    if (commitsCount !== undefined) {
      let commitsValue: string;
      if (contributionPercent !== undefined && contributionPercent < 100 && contributionPercent > 0) {
        // Calculate owner commits
        const ownerCommits = Math.round(commitsCount * (contributionPercent / 100));
        commitsValue = `${ownerCommits.toLocaleString()} of ${commitsCount.toLocaleString()}`;
      } else {
        // 100% contribution or no contribution data - just show total
        commitsValue = commitsCount.toLocaleString();
      }
      items.push({ label: 'Commits', value: commitsValue });
    }
    const contributors = project.contributors;
    if (contributionPercent !== undefined || contributors !== undefined) {
      let contributionValue = '';
      if (contributionPercent !== undefined) {
        contributionValue = `${contributionPercent}%`;
      }
      if (contributors !== undefined) {
        const contributorText = contributors === 1 ? 'contributor' : 'contributors';
        if (contributionValue) {
          contributionValue = `${contributionValue} (${contributors} ${contributorText})`;
        } else {
          contributionValue = `${contributors} ${contributorText}`;
        }
      }
      if (contributionValue) {
        items.push({ label: 'Contribution', value: contributionValue });
      }
    }
    if (project.hoursWorked) items.push({ label: 'Hours', value: `${project.hoursWorked.toLocaleString()}` });
    if (project.rating) items.push({ label: 'Rating', value: `${project.rating}/10` });
    const license = toDisplayString(project.license);
    if (license) items.push({ label: 'License', value: license });

    return items;
  }, [project]);

  const githubStats = useMemo(() => {
    const stats: Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; value: string }> = [];
    const push = (label: string, icon: keyof typeof Ionicons.glyphMap, value?: string | number | null) => {
      if (value === undefined || value === null || value === '') return;
      stats.push({ label, icon, value: typeof value === 'number' ? value.toLocaleString() : value });
    };

    push('Stars', 'star', toNumber(project.githubStars));
    push('Forks', 'git-branch', toNumber(project.githubForks));
    push('Watchers', 'eye', toNumber(project.githubWatchers));
    push('Files', 'documents', toNumber(project.githubFilesCount));
    push('Lines of code', 'code-slash', formatNumber(toNumber(project.githubLinesOfCode)));
    push('Open issues', 'alert-circle', toNumber(project.githubOpenIssues));
    push('Latest release', 'pricetag', toDisplayString(project.githubLatestRelease));

    return stats;
  }, [project]);

  // Helper function to get ISO week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper function to get days in a month
  const getDaysInMonth = (monthBucket: string): number => {
    const [year, month] = monthBucket.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Helper function to count days in a week that fall in a specific month
  const getDaysInWeekForMonth = (weekStart: Date, weekEnd: Date, monthBucket: string): number => {
    const [year, month] = monthBucket.split('-').map(Number);
    let count = 0;
    const checkDate = new Date(weekStart);
    while (checkDate <= weekEnd) {
      if (checkDate.getFullYear() === year && checkDate.getMonth() + 1 === month) {
        count++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return count;
  };

  const commitChartData = useMemo(() => {
    if (!Array.isArray(project.githubCommitsHistory) || project.githubCommitsHistory.length === 0) {
      return [];
    }

    // Get contribution percentage
    const contributionPercent = typeof project.githubContributionPercent === 'number'
      ? project.githubContributionPercent
      : typeof project.githubOwnerCommitsPercent === 'number'
      ? project.githubOwnerCommitsPercent
      : null;
    
    const is100Percent = contributionPercent !== null && contributionPercent >= 100;

    // Get first and last commit dates
    const firstCommitDateStr = typeof project.githubFirstCommitDate === 'string' 
      ? project.githubFirstCommitDate 
      : null;
    const lastCommitDateStr = typeof project.githubLastCommitDate === 'string'
      ? project.githubLastCommitDate
      : null;
    
    const firstCommitDate = firstCommitDateStr ? new Date(firstCommitDateStr) : null;
    const lastCommitDate = lastCommitDateStr ? new Date(lastCommitDateStr) : null;

    // Process monthly data - calculate accurate owner commits
    const monthlyData = new Map<string, { total: number; owner: number }>();
    project.githubCommitsHistory.forEach(entry => {
      const total = typeof entry.total === 'number' ? entry.total : 0;
      let owner: number;
      
      if (is100Percent) {
        // If 100% contribution, owner = total
        owner = total;
      } else if (contributionPercent !== null && contributionPercent > 0) {
        // Calculate owner commits from total using contribution percentage
        owner = Math.round(total * (contributionPercent / 100) * 10) / 10;
      } else {
        // Fall back to stored owner value if available
        owner = typeof entry.owner === 'number' ? entry.owner : 0;
      }
      
      monthlyData.set(entry.bucket, { total, owner });
    });

    // If we don't have commit dates, fall back to monthly buckets
    if (!firstCommitDate || !lastCommitDate || isNaN(firstCommitDate.getTime()) || isNaN(lastCommitDate.getTime())) {
      return Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bucket, data]) => ({
          bucket,
          total: data.total,
          owner: data.owner,
        }));
    }

    // Calculate date difference in days
    const dateDiffMs = lastCommitDate.getTime() - firstCommitDate.getTime();
    const dateDiffDays = Math.ceil(dateDiffMs / (1000 * 60 * 60 * 24));
    const useDailyBuckets = dateDiffDays < 21; // Less than 3 weeks

    if (useDailyBuckets) {
      // Create daily buckets from first commit to last commit
      const dailyBuckets: Map<string, { total: number; owner: number }> = new Map();
      
      const startDate = new Date(firstCommitDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(lastCommitDate);
      endDate.setHours(23, 59, 59, 999);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Format as YYYY-MM-DD
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const bucket = `${year}-${month}-${day}`;

        // Get the month bucket for this day
        const monthBucket = `${year}-${month}`;
        const monthData = monthlyData.get(monthBucket);
        
        if (monthData) {
          // Distribute commits evenly across days in the month
          const daysInMonth = getDaysInMonth(monthBucket);
          const totalCommits = monthData.total / daysInMonth;
          // Calculate owner commits using the same proportion as the month
          const ownerCommits = monthData.total > 0 
            ? (monthData.owner / monthData.total) * totalCommits
            : 0;

          dailyBuckets.set(bucket, {
            total: Math.round(totalCommits * 10) / 10,
            owner: Math.round(ownerCommits * 10) / 10,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1); // Move to next day
      }

      // Convert to array and sort
      return Array.from(dailyBuckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bucket, data]) => ({
          bucket,
          total: data.total,
          owner: data.owner,
        }));
    } else {
      // Create weekly buckets from first commit to last commit
      const weeklyBuckets: Map<string, { total: number; owner: number }> = new Map();
      
      // Start from the beginning of the week containing the first commit
      const startDate = new Date(firstCommitDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0);

      // End at the end of the week containing the last commit
      const endDate = new Date(lastCommitDate);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of week (Saturday)
      endDate.setHours(23, 59, 59, 999);

      // Generate weekly buckets and distribute monthly commits
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Format as YYYY-WW (ISO week format)
        const year = weekStart.getFullYear();
        const weekNum = getWeekNumber(weekStart);
        const bucket = `${year}-W${weekNum.toString().padStart(2, '0')}`;

        // Find which months this week spans
        const monthsInWeek = new Set<string>();
        const checkDate = new Date(weekStart);
        while (checkDate <= weekEnd) {
          const monthBucket = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}`;
          monthsInWeek.add(monthBucket);
          checkDate.setDate(checkDate.getDate() + 1);
        }

        // Distribute commits from months proportionally
        let totalCommits = 0;
        let ownerCommits = 0;

        monthsInWeek.forEach(monthBucket => {
          const monthData = monthlyData.get(monthBucket);
          if (monthData) {
            // Count days of this week that fall in this month
            const daysInMonth = getDaysInMonth(monthBucket);
            const daysInWeekForMonth = getDaysInWeekForMonth(weekStart, weekEnd, monthBucket);
            const proportion = daysInWeekForMonth / daysInMonth;
            
            // Distribute total commits proportionally
            const weekTotalCommits = monthData.total * proportion;
            totalCommits += weekTotalCommits;
            
            // Calculate owner commits using the same proportion as the month
            const ownerProportion = monthData.total > 0 
              ? monthData.owner / monthData.total 
              : 0;
            ownerCommits += weekTotalCommits * ownerProportion;
          }
        });

        if (totalCommits > 0 || ownerCommits > 0) {
          weeklyBuckets.set(bucket, {
            total: Math.round(totalCommits * 10) / 10, // Round to 1 decimal
            owner: Math.round(ownerCommits * 10) / 10,
          });
        }

        currentDate.setDate(currentDate.getDate() + 7); // Move to next week
      }

      // Convert to array and sort
      return Array.from(weeklyBuckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bucket, data]) => ({
          bucket,
          total: data.total,
          owner: data.owner,
        }));
    }
  }, [project.githubCommitsHistory, project.githubFirstCommitDate, project.githubLastCommitDate, getWeekNumber, getDaysInMonth, getDaysInWeekForMonth]);

  const hasCommitHistory = commitChartData.length > 1 && commitChartData.some(entry => entry.total > 0);

  const isLicenseTag = (tagText: string): boolean => {
    return tagText.toLowerCase().includes('license') || 
      /^(MIT|Apache|GPL|LGPL|BSD|ISC|MPL|EPL|AGPL|Unlicense|CC0|Artistic|Zlib|Boost|WTFPL|Proprietary|Copyright)/i.test(tagText);
  };

  const languageBadges = mergedTags.filter(tag => tag.isLanguage);
  const otherTags = mergedTags.filter(tag => !tag.isLanguage);
  const licenseTags = otherTags.filter(tag => isLicenseTag(tag.text));
  const nonLicenseTags = otherTags.filter(tag => !isLicenseTag(tag.text));

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const heroHeight = isWide ? 360 : 240;

  const renderHero = () => {
    if (project.liveUrl) {
      return (
        <LiveUrlPreview
          url={project.liveUrl}
          imageUrl={project.imageUrl}
          style={{ width: '100%', height: heroHeight, borderRadius: 20 }}
        />
      );
    }

    if (project.imageUrl) {
      return (
        <Image
          source={{ uri: project.imageUrl }}
          style={{ width: '100%', height: heroHeight, borderRadius: 20 }}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={{ width: '100%', height: heroHeight, borderRadius: 20, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="layers" size={48} color={theme.colors.textSecondary} />
        <Text style={{ marginTop: 12, color: theme.colors.textSecondary, fontWeight: '600' }}>Preview coming soon</Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.background,
      position: 'relative',
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: isWide ? 28 : 40,
      paddingBottom: 40,
      paddingHorizontal: screenWidth > 600 ? 32 : 20,
      alignItems: 'center',
    },
    page: {
      width: '100%',
      maxWidth: 920,
    },
    backButton: {
      marginBottom: 24,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    backButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    backButtonOverlay: {
      position: 'absolute',
      left: 50,
      top: 32,
      zIndex: 20,
      marginBottom: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    heroCard: {
      overflow: 'visible',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 25,
      elevation: 8,
      marginBottom: 32,
      position: 'relative',
    },
    titleBlock: {
      marginBottom: 24,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12,
    },
    title: {
      fontSize: isWide ? 44 : 32,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: isWide ? 20 : 17,
      color: theme.colors.textSecondary,
      lineHeight: 28,
    },
    inlineBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
      marginBottom: 20,
    },
    badgeText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '600',
    },
    actionsRow: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      gap: 8,
      zIndex: 10,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    actionText: {
      color: theme.colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 14,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    infoCard: {
      flexBasis: isWide ? '30%' : '48%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    infoCardNarrow: {
      flexBasis: isWide ? '15%' : '30%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    infoLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      color: theme.colors.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 6,
      fontWeight: '600',
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flexBasis: isWide ? '22%' : '48%',
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      padding: 12,
      minWidth: isWide ? 180 : undefined,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    readmeContainer: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 400,
    },
  });

  return (
    <View style={styles.wrapper}>
      {isWide && (
        <TouchableOpacity onPress={onBack} style={[styles.backButton, styles.backButtonOverlay]}>
          <View style={styles.backButtonContent}>
            <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
      )}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          {!isWide && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <View style={styles.backButtonContent}>
                <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
                <Text style={styles.backButtonText}>Back</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.heroCard}>
            {renderHero()}
            <View style={styles.actionsRow}>
              {project.githubUrl && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLinkPress(project.githubUrl!)}>
                  <Ionicons name="logo-github" size={18} color={theme.colors.text} />
                  <Text style={styles.actionText}>GitHub</Text>
                </TouchableOpacity>
              )}
              {project.liveUrl && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLinkPress(project.liveUrl!)}>
                  <Ionicons name="globe" size={18} color={theme.colors.text} />
                  <Text style={styles.actionText}>Live Site</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{project.title}</Text>
              {(languageBadges.length > 0 || licenseTags.length > 0) && (
                <View style={styles.inlineBadges}>
                  {languageBadges.map((tag, index) => (
                    <View key={`title-lang-${index}`} style={styles.badge}>
                      <Ionicons name="code-slash" size={14} color={theme.colors.primary} />
                      <Text style={styles.badgeText}>
                        {tag.text}
                        {tag.percent !== undefined ? ` ${tag.percent}%` : ''}
                      </Text>
                    </View>
                  ))}
                  {licenseTags.map((tag, index) => (
                    <View key={`title-license-${index}`} style={styles.badge}>
                      <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.badgeText}>{tag.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {nonLicenseTags.length > 0 && (
              <View style={styles.badgeRow}>
                {nonLicenseTags.map((tag, index) => (
                  <View key={`tag-${index}`} style={styles.badge}>
                    <Ionicons name="pricetag" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.badgeText}>{tag.text}</Text>
                  </View>
                ))}
              </View>
            )}
            {project.description ? (
              <Text style={styles.description}>{project.description}</Text>
            ) : null}
          </View>


        {(infoItems.length > 0 || hasCommitHistory) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Snapshot</Text>
            {infoItems.length > 0 && (
            <View style={styles.infoGrid}>
              {infoItems.map(item => (
                <View key={item.label} style={item.narrow ? styles.infoCardNarrow : styles.infoCard}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            )}
            {hasCommitHistory && (
              <View style={{ marginTop: infoItems.length > 0 ? 24 : 0 }}>
                <CommitActivityChart
                  data={commitChartData.map(entry => ({
                    bucket: entry.bucket,
                    total: entry.total,
                    owner: entry.owner,
                  }))}
                  height={200}
                  showLegend={true}
                />
              </View>
            )}
          </View>
        )}

        {githubStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GitHub Insights</Text>
            <View style={styles.statsGrid}>
              {githubStats.map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <Ionicons name={stat.icon} size={24} color={theme.colors.primary} />
                  <View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}


        {project.githubUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>README Preview</Text>
            <View style={styles.readmeContainer}>
              <ReadmePreview
                githubUrl={project.githubUrl}
                defaultBranch={(project as any).githubDefaultBranch}
                imageUrl={project.imageUrl}
                style={{ width: '100%', height: 800, borderRadius: 20 }}
              />
            </View>
          </View>
        )}

        </View>
      </ScrollView>
    </View>
  );
};

