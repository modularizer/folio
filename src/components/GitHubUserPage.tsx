import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Project } from '@/projects/types';
import { GitHubProjectBuilder } from '@/projects/builders/GitHubProjectBuilder';
import { UserPortfolioPage } from './UserPortfolioPage';
import { ProjectsGrid, ProjectSource } from './ProjectsGrid';
import { TokenWarningIcon } from './TokenWarningIcon';
import { GitHubBioStats } from './GitHubBioStats';
import {
  fetchGitHubUser,
  fetchGitHubUserProjects,
  transformGitHubUserToProfile,
  GitHubUser,
} from '@/utils/github';
import { UserProfile } from '@/user/profile';
import { useGitHubFilterSortController } from './filters/GitHubFilterSortController';
import { isLanguageExcluded } from '@/utils/languageDisplay';
import { getUserCommitCount, HasCommitStats } from '@/utils/githubStats';

interface GitHubUserPageProps {
  /**
   * GitHub username
   */
  username: string;
  
  /**
   * Optional GitHub API token for higher rate limits
   */
  githubToken?: string;
  
  /**
   * Custom profile data to merge with GitHub profile
   */
  customProfileData?: Partial<UserProfile>;
  
  /**
   * Function to generate custom data for each repository
   * Useful for marking repos as featured, setting templates, etc.
   */
  customDataPerRepo?: (repo: any) => Partial<import('@/projects/types').ProjectData>;
  
  /**
   * Repository fetch options
   */
  repoOptions?: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
    type?: 'all' | 'owner' | 'member';
  };
  
  /**
   * Whether to show loading state (default: true)
   */
  showLoading?: boolean;
  
  /**
   * Custom loading component
   */
  renderLoading?: () => React.ReactElement;
  
  /**
   * Custom error component
   */
  renderError?: (error: string) => React.ReactElement;
  
  /**
   * Callback when data is successfully loaded
   */
  onLoad?: (profile: UserProfile, projects: Project[]) => void;
  
  /**
   * Callback when loading fails
   */
  onError?: (error: Error) => void;
  
  /**
   * Whether to show profile section (default: true)
   */
  showProfile?: boolean;
  
  /**
   * Whether to show stats (default: true)
   */
  showStats?: boolean;
  
  /**
   * Additional projects to mix with GitHub projects
   * Can be regular Project objects or GitHub URLs
   * If provided, GitHub projects will be mixed with these
   */
  additionalProjects?: ProjectSource[];
  
  /**
   * If true, only show GitHub projects (ignore additionalProjects)
   * If false, mix GitHub projects with additionalProjects
   * Default: false (mix all projects)
   */
  onlyGitHubProjects?: boolean;
  
  /**
   * Custom container style
   */
  style?: any;
}

/**
 * GitHub User Page Component
 * 
 * A modular component that builds a complete portfolio page from just a GitHub username.
 * Fetches the user's profile and all their public repositories, then displays them
 * using your existing project card system.
 * 
 * This is one way to use the portfolio - you can also manually define projects,
 * or mix both approaches.
 * 
 * Usage:
 * <GitHubUserPage username="octocat" />
 * 
 * Or in a route:
 * app/github/[username].tsx
 */
export const GitHubUserPage: React.FC<GitHubUserPageProps> = ({
  username,
  githubToken,
  customProfileData,
  customDataPerRepo,
  repoOptions,
  showLoading = true,
  renderLoading,
  renderError,
  onLoad,
  onError,
  showProfile = true,
  showStats = true,
  additionalProjects = [],
  onlyGitHubProjects = false,
  style,
}) => {
  const { theme } = useTheme();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [githubUserData, setGitHubUserData] = useState<GitHubUser | null>(null); // Store raw GitHub user data for avatar
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Store all GitHub projects
  const [filteredProjects, setFilteredProjects] = useState<Project[] | null>(null); // Filtered/sorted projects (null = not initialized, [] = filtered to empty)
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Separate loading state for profile
  const [projectsLoading, setProjectsLoading] = useState(true); // Separate loading state for projects
  const [error, setError] = useState<string | null>(null);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToken, setUserToken] = useState<string>('');
  const [userTokenInput, setUserTokenInput] = useState<string>('');
  
  // Helper to check if an error is an auth/rate limit error
  const isAuthError = (errorMessage: string | null): boolean => {
    if (!errorMessage) return false;
    const lowerError = errorMessage.toLowerCase();
    return (
      lowerError.includes('rate limit') ||
      lowerError.includes('403') ||
      lowerError.includes('forbidden') ||
      lowerError.includes('authentication') ||
      lowerError.includes('unauthorized')
    );
  };

  // Load user token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = window.localStorage.getItem('github_user_token');
      if (storedToken) {
        setUserToken(storedToken);
        setUserTokenInput(storedToken);
      }
    }
  }, []);

  // Save user token to localStorage
  const saveUserToken = (token: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem('github_user_token', token);
      } else {
        window.localStorage.removeItem('github_user_token');
      }
    }
    setUserToken(token);
  };

  // Use user token if available, otherwise fall back to provided token
  const effectiveToken = useMemo(() => userToken || githubToken, [userToken, githubToken]);

  useEffect(() => {
    // Force log to console - this should ALWAYS show
    console.log('[GitHubUserPage] useEffect triggered', {
      username,
      hasToken: !!effectiveToken,
      tokenLength: effectiveToken?.length,
    });
    // Also use alert as a fallback to ensure we see it
    if (typeof window !== 'undefined') {
      console.warn('[GitHubUserPage] Component mounted for user:', username);
    }
    const loadGitHubUserData = async () => {
      try {
        console.log('[GitHubUserPage] Starting data load', {
          username,
          hasToken: !!effectiveToken,
          tokenLength: effectiveToken?.length,
        });
        setLoading(true);
        setProfileLoading(true);
        setProjectsLoading(true);
        setError(null);

        // Load profile first - if this succeeds, we can show the header even if projects fail
        let userProfile: UserProfile;
        try {
          const userData = await fetchGitHubUser(username, effectiveToken);
          userProfile = transformGitHubUserToProfile(userData, customProfileData);
          setProfile(userProfile);
          setGitHubUserData(userData);
          setProfileLoading(false);
        } catch (profileErr) {
          const errorMessage = profileErr instanceof Error ? profileErr.message : 'Failed to load GitHub user profile';
          setError(errorMessage);
          setHasAuthError(isAuthError(errorMessage));
          setProfileLoading(false);
          setLoading(false);
          onError?.(profileErr instanceof Error ? profileErr : new Error(errorMessage));
          return; // Don't try to load projects if profile fails
        }

          // Load projects separately - if this fails, we still show the header
          try {
            const shouldCheckPages = !!effectiveToken;
            console.log('[GitHubUserPage] Fetching projects', {
              username,
              hasToken: !!effectiveToken,
              tokenValue: effectiveToken ? `${effectiveToken.substring(0, 10)}...` : 'none',
              tokenLength: effectiveToken?.length,
              shouldCheckPages,
              willFetchAdditionalStats: !!effectiveToken && effectiveToken.length > 0,
            });
            const projectDataList = await fetchGitHubUserProjects(
              username,
              effectiveToken,
              customDataPerRepo,
              repoOptions,
              shouldCheckPages
            );
            console.log('[GitHubUserPage] Got projects', {
              count: projectDataList.length,
              firstProject: projectDataList[0] ? {
                title: projectDataList[0].title,
            hasCommits: getUserCommitCount(projectDataList[0] as HasCommitStats) !== null,
                hasLanguages: projectDataList[0].githubLanguages !== undefined,
              } : null,
            });

          // Transform repositories to projects
          const userProjects: Project[] = projectDataList.map((data) => ({
            data,
            builder: new GitHubProjectBuilder(),
          }));
          
          // Print list of data dicts to console on page load (all fields, not just components)
          console.log('[GitHubUserPage] Project data dictionaries:', userProjects.map(p => {
            // Create a copy of the data object, excluding builder/component-related fields
            const dataCopy: any = {};
            for (const key in p.data) {
              // Include all data fields (everything except builder which is on the Project object, not data)
              dataCopy[key] = p.data[key];
            }
            return dataCopy;
          }));
          
          setAllProjects(userProjects);
          // Initialize filtered projects with all projects
          setFilteredProjects(userProjects);
          setProjectsLoading(false);
          
          // Call onLoad with the profile we just loaded
          onLoad?.(userProfile, userProjects);
        } catch (projectsErr) {
          // Projects failed, but we still have the profile - show error in projects section
          const errorMessage = projectsErr instanceof Error ? projectsErr.message : 'Failed to load repositories';
          const isAuthErr = isAuthError(errorMessage);
          setHasAuthError(isAuthErr);
          
          // If we have cached projects, don't show error - cachedFetch should have returned them
          // Only show error if we truly have no projects
          if (allProjects.length === 0) {
            if (isAuthErr) {
              setError(errorMessage);
            } else {
              // Only set error for non-auth errors (auth errors are handled by warning icon)
              setError(errorMessage);
            }
            onError?.(projectsErr instanceof Error ? projectsErr : new Error(errorMessage));
          } else {
            // We have cached projects, just log the error but don't show it
            console.warn('[GitHubUserPage] Error fetching fresh projects, but using cached data:', errorMessage);
          }
          
          setProjectsLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load GitHub user data';
        setError(errorMessage);
        setHasAuthError(isAuthError(errorMessage));
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    loadGitHubUserData();
    }, [username, githubToken, userToken, customProfileData, customDataPerRepo, repoOptions, onLoad, onError]);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  
  // Calculate aggregate statistics across all GitHub projects
  // IMPORTANT: Only include repos OWNED by the user, not repos where they're just a contributor
  const aggregateStats = useMemo(() => {
    const githubProjects = allProjects.filter(p => p.data.githubUrl);
    if (githubProjects.length === 0) return null;

    // Helper to extract owner from GitHub URL
    const getOwnerFromUrl = (url: string): string | null => {
      const match = url.match(/github\.com\/([^\/]+)\//);
      return match ? match[1].toLowerCase() : null;
    };

    // Filter to only include repos owned by the user (not just contributed to)
    const ownedProjects = githubProjects.filter(project => {
      if (!project.data.githubUrl) return false;
      
      const repoOwner = getOwnerFromUrl(project.data.githubUrl);
      const userLogin = username.toLowerCase();
      
      // Only include if the repo owner matches the username
      // This ensures we only count repos the user owns, not repos they contribute to
      return repoOwner === userLogin;
    });

    if (ownedProjects.length === 0) return null;

    let totalLinesOfCode = 0;
    let totalStars = 0;
    let totalForks = 0;
    let totalCommits = 0;
    let totalRepos = ownedProjects.length;
    let earliestCommit: string | null = null;
    let latestUpdate: string | null = null;
    const languageBytes: Record<string, number> = {};

    ownedProjects.forEach(project => {
      const data = project.data;
      
      // Sum lines of code
      if (data.githubLinesOfCode && typeof data.githubLinesOfCode === 'number') {
        totalLinesOfCode += data.githubLinesOfCode;
      }
      
      // Sum stars and forks
      if (data.githubStars !== undefined && data.githubStars !== null && typeof data.githubStars === 'number') {
        totalStars += data.githubStars;
      }
      if (data.githubForks !== undefined && data.githubForks !== null && typeof data.githubForks === 'number') {
        totalForks += data.githubForks;
      }
      
      // Sum commits
      const userCommits = getUserCommitCount(data as HasCommitStats);
      if (typeof userCommits === 'number' && userCommits > 0) {
        totalCommits += userCommits;
      }
      
      // Track earliest commit and latest update
      if (data.githubFirstCommitDate && typeof data.githubFirstCommitDate === 'string') {
        if (!earliestCommit || data.githubFirstCommitDate < earliestCommit) {
          earliestCommit = data.githubFirstCommitDate;
        }
      }
      if (data.githubLastCommitDate && typeof data.githubLastCommitDate === 'string') {
        if (!latestUpdate || data.githubLastCommitDate > latestUpdate) {
          latestUpdate = data.githubLastCommitDate;
        }
      }
      
        // Aggregate languages - ONLY use commit-based breakdown (githubLanguagesByCommits)
        // This ensures we only count languages from commits authored by the user
        // We do NOT use githubLanguages (repo-wide breakdown) because it includes code from all contributors
        // Also collect languages from tags if detailed breakdown is not available
        if (data.githubLanguagesByCommits && typeof data.githubLanguagesByCommits === 'object') {
          // Commit-based: count is number of commits authored by the user
          Object.entries(data.githubLanguagesByCommits).forEach(([lang, commits]) => {
            languageBytes[lang] = (languageBytes[lang] || 0) + commits;
          });
        } else if (data.tags && Array.isArray(data.tags)) {
          // Last resort: extract languages from tags (GitHub's primary language is often in tags)
          const commonLanguages = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
            'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Shell', 'SQL',
            'R', 'MATLAB', 'Lua', 'Perl', 'Scala', 'Clojure', 'Haskell', 'Elixir', 'Vue', 'Svelte',
            'XML'
          ];
          data.tags.forEach(tag => {
            const matchingLanguage = commonLanguages.find(lang => 
              lang.toLowerCase() === tag.toLowerCase()
            );
            if (matchingLanguage) {
              // Use a default count of 1 so it shows up (we can't calculate percentages)
              languageBytes[matchingLanguage] = (languageBytes[matchingLanguage] || 0) + 1;
            }
          });
        }
    });

    // Calculate language percentages (if we have valid data)
    // Note: languageBytes now contains either commit counts (if using commit-based) or bytes (if using lines-of-code)
    // If we only have tag-based languages (value = 1), we can't calculate meaningful percentages
    // Exclude non-programming languages (markdown, toml, yaml, json, xml, etc.)
    const totalLanguageValue = Object.values(languageBytes).reduce((sum, v) => sum + v, 0);
    const hasValidPercentages = totalLanguageValue > 0 && Object.values(languageBytes).some(v => v > 1);
    const languagePercentages = Object.entries(languageBytes)
      .filter(([lang]) => !isLanguageExcluded(lang.toLowerCase())) // Exclude non-programming languages
      .map(([lang, value]) => ({
        lang,
        percent: hasValidPercentages && totalLanguageValue > 0 ? Math.round((value / totalLanguageValue) * 100) : undefined,
      }))
      .sort((a, b) => {
        // Sort by percent if available, otherwise by name
        if (a.percent !== undefined && b.percent !== undefined) {
          return b.percent - a.percent;
        }
        if (a.percent !== undefined) return -1;
        if (b.percent !== undefined) return 1;
        return a.lang.localeCompare(b.lang);
      })
      .slice(0, 5); // Top 5 languages

    return {
      totalLinesOfCode,
      totalStars,
      totalForks,
      totalCommits,
      totalRepos,
      earliestCommit,
      latestUpdate,
      languagePercentages,
    };
  }, [allProjects, username]);

  // Create filter/sort controller callback first (before it's used)
  const handleProjectsChange = useCallback((filtered: Project[]) => {
    const startTime = performance.now();
    console.log('[GitHubUserPage] handleProjectsChange called:', filtered.length, 'projects');
    setFilteredProjects(filtered);
    // Use requestAnimationFrame to measure when React actually processes the update
    requestAnimationFrame(() => {
      const endTime = performance.now();
      console.log('[GitHubUserPage] State update processed by React:', `(${(endTime - startTime).toFixed(2)}ms)`);
    });
  }, []);

  // Create filter/sort controller (after aggregateStats is computed)
  const filterSortController = useGitHubFilterSortController(
    allProjects,
    handleProjectsChange,
    [],
    'pinnedFirst',
    aggregateStats?.languagePercentages
  );
  
  // Controller now handles updates internally via useEffect

  // Combine GitHub projects with additional projects
  // This must be defined before any early returns
  // Use filteredProjects directly - it's already been filtered/sorted by the controller
  const allProjectSources: ProjectSource[] = useMemo(() => {
    // Always use filteredProjects - even if empty (means filter removed all items)
    // Only fall back to allProjects if filteredProjects hasn't been initialized yet (null/undefined)
    const projectsToUse = filteredProjects !== null && filteredProjects !== undefined ? filteredProjects : allProjects;
    const githubProjectSources: ProjectSource[] = projectsToUse || [];
    
    console.log('[GitHubUserPage] Merging projects:', {
      githubProjectsCount: githubProjectSources.length,
      additionalProjectsCount: additionalProjects?.length || 0,
      onlyGitHubProjects,
      additionalProjects: additionalProjects?.map((p: any) => 
        'data' in p ? { id: p.data.id, title: p.data.title, preferredIndex: p.data.preferredIndex } : p
      ),
    });
    
    if (onlyGitHubProjects) {
      console.log('[GitHubUserPage] onlyGitHubProjects is true, returning only GitHub projects');
      return githubProjectSources;
    }
    
    // Mix GitHub projects with additional projects, respecting preferredIndex
    const allProjectsWithIndex: Array<{ project: ProjectSource; index: number; isCustom: boolean }> = [];
    
    // Add GitHub projects with their natural index
    githubProjectSources.forEach((project, index) => {
      allProjectsWithIndex.push({
        project,
        index,
        isCustom: false,
      });
    });
    
    // Add custom projects with their preferredIndex (or append to end if not specified)
    (additionalProjects || []).forEach((project) => {
      const preferredIndex = 'data' in project && project.data.preferredIndex !== undefined
        ? project.data.preferredIndex
        : githubProjectSources.length; // Default to end if not specified
      
      allProjectsWithIndex.push({
        project,
        index: preferredIndex,
        isCustom: true,
      });
    });
    
    // Sort by index, then by isCustom (GitHub projects first at same index)
    allProjectsWithIndex.sort((a, b) => {
      if (a.index !== b.index) {
        return a.index - b.index;
      }
      // If same index, GitHub projects come first
      return a.isCustom ? 1 : -1;
    });
    
    const merged = allProjectsWithIndex.map(item => item.project);
    
    console.log('[GitHubUserPage] Merged projects with preferredIndex:', {
      total: merged.length,
      github: githubProjectSources.length,
      additional: additionalProjects?.length || 0,
      sorted: merged.map((p: any) => 
        'data' in p ? { id: p.data.id, title: p.data.title, preferredIndex: p.data.preferredIndex } : p
      ),
    });
    
    return merged;
  }, [filteredProjects, allProjects, additionalProjects, onlyGitHubProjects]);

  // All layout styles have been moved to UserPortfolioPage component

  // Create a fallback profile from username if profile fetch failed
  const displayProfile = useMemo(() => profile || {
    name: username,
    github: `https://github.com/${username}`,
  }, [profile, username]);

  const screenWidth = Dimensions.get('window').width;
  
  // Get custom bio stats from window config
  const customBioStats = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    
    const config = (window as any).__FOLIO_CONFIG__;
    if (!config || !config.customBioStats) {
      return undefined;
    }
    
    try {
      const { createBioStatsFromData } = require('@/utils/customBioStats');
      const bioStatsNode = createBioStatsFromData(config.customBioStats);
      console.log('[GitHubUserPage] Created custom bio stats from config');
      return bioStatsNode;
    } catch (error) {
      console.error('[GitHubUserPage] Failed to create custom bio stats:', error);
      return undefined;
    }
  }, []);
  
  // Prepare bio stats React node from GitHub data and aggregate stats
  const githubBioStats = useMemo(() => {
    if (!githubUserData && !aggregateStats) return undefined;
    
    // Use smaller, darker font for header stats on wide screens
    const isInHeader = screenWidth > 1000;
    
    return (
      <GitHubBioStats
        followers={githubUserData?.followers}
        following={githubUserData?.following}
        totalRepos={aggregateStats?.totalRepos}
        totalStars={aggregateStats?.totalStars}
        totalForks={aggregateStats?.totalForks}
        totalCommits={aggregateStats?.totalCommits}
        totalLinesOfCode={aggregateStats?.totalLinesOfCode}
        earliestCommit={aggregateStats?.earliestCommit || undefined}
        latestUpdate={aggregateStats?.latestUpdate || undefined}
        fontSize={isInHeader ? 11 : undefined}
        textColor={isInHeader ? theme.colors.textTertiary : undefined} // Darker gray for better contrast on gray background
        iconSize={isInHeader ? 13 : undefined}
      />
    );
  }, [githubUserData, aggregateStats, screenWidth, theme]);
  
  // Merge GitHub bio stats with custom bio stats
  const bioStats = useMemo(() => {
    if (!customBioStats) {
      return githubBioStats;
    }
    
    if (!githubBioStats) {
      return customBioStats;
    }
    
    // Both exist - merge them
    return (
      <>
        {githubBioStats}
        {customBioStats}
      </>
    );
  }, [githubBioStats, customBioStats]);

  // Initial loading state - only show full-screen loader if we don't have profile yet
  if (profileLoading && showLoading && !profile && !error) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: theme.colors.textSecondary }}>Loading GitHub profile...</Text>
      </View>
    );
  }

  // Prepare header extra content (warning icon)
  const headerExtra = hasAuthError && !effectiveToken ? (
    <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
      <TokenWarningIcon
        userTokenInput={userTokenInput}
        onUserTokenInputChange={setUserTokenInput}
        userToken={userToken}
        onSaveUserToken={(token) => {
          saveUserToken(token);
          setError(null);
          setHasAuthError(false);
          setProfileLoading(true);
          setProjectsLoading(true);
        }}
      />
    </View>
  ) : undefined;

  // Custom error renderer for rate limit errors
  const renderCustomError = (errorMessage: string) => {
    if (!errorMessage.includes('rate limit')) {
      return <Text style={{ fontSize: 18, color: theme.colors.text, textAlign: 'center' }}>{errorMessage}</Text>;
    }

    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: theme.colors.text, textAlign: 'center', marginBottom: 12 }}>{errorMessage}</Text>
        <View style={{ marginTop: 16, padding: 16, backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, maxWidth: 600 }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 }}>
            <Text style={{ fontWeight: 'bold' }}>How to get a GitHub token:</Text>
            {'\n\n'}
            1. Go to{' '}
            <TouchableOpacity
              onPress={() => {
                Linking.openURL('https://github.com/settings/tokens/new?scopes=public_repo&description=Portfolio%20App').catch((err) => {
                  console.error('Failed to open GitHub settings:', err);
                });
              }}
              style={{}}
            >
              <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline', fontWeight: '600' }}>GitHub Token Settings</Text>
            </TouchableOpacity>
            {'\n'}
            2. Set expiration to "No expiration"
            {'\n'}
            3. Review the pre-filled name and scope, then click "Generate token"
            {'\n'}
            4. Copy the token (you won't see it again!)
            {'\n\n'}
            <Text style={{ fontStyle: 'italic' }}>
              This increases your rate limit from 60 to 5,000 requests per hour.
            </Text>
            {'\n\n'}
            <Text style={{ fontWeight: 'bold' }}>For Developers (Site Owners):</Text>
            {'\n'}
            {'    '}Option 1: Create a .env file in your project root:
            {'\n'}
            {'    '}EXPO_PUBLIC_GITHUB_TOKEN=your_token_here
            {'\n\n'}
            {'    '}Option 2: Pass it directly in app/index.tsx:
            {'\n'}
            {'    '}githubToken={process.env.EXPO_PUBLIC_GITHUB_TOKEN}
            {'\n\n'}
            <Text style={{ fontWeight: 'bold' }}>For Users:</Text>
            {'\n'}
            {'    '}Enter your own GitHub token below to view this portfolio:
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8, paddingLeft: 32 }}>
            <TextInput
              style={{ width: 300, height: 40, backgroundColor: theme.colors.background, borderRadius: 8, paddingHorizontal: 12, paddingLeft: 20, paddingVertical: 8, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
              placeholder="Enter your GitHub token..."
              placeholderTextColor={theme.colors.textSecondary}
              value={userTokenInput}
              onChangeText={setUserTokenInput}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => {
                if (userTokenInput.trim()) {
                  saveUserToken(userTokenInput.trim());
                  setError(null);
                  setProfileLoading(true);
                  setProjectsLoading(true);
                } else {
                  saveUserToken('');
                }
              }}
            >
              <Text style={{ color: theme.colors.background, fontSize: 14, fontWeight: '600' }}>
                {userToken ? 'Update' : 'Save'} Token
              </Text>
            </TouchableOpacity>
            {userToken && (
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => {
                  saveUserToken('');
                  setUserTokenInput('');
                }}
              >
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {userToken && (
            <Text style={{ fontSize: 12, color: theme.colors.primary, fontStyle: 'italic', marginTop: 4 }}>
              ✓ Token saved. Data will reload automatically.
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <UserPortfolioPage
      profile={displayProfile}
      avatarUrl={githubUserData?.avatar_url}
      bio={profile?.bio}
      bioStats={bioStats}
      languagePercentages={aggregateStats?.languagePercentages}
      projects={allProjectSources}
      projectsLoading={projectsLoading}
      error={error}
      showError={!profile && !profileLoading}
      renderError={renderCustomError}
      emptyMessage="No public repositories found."
      background={typeof profile?.background === 'string' ? profile.background : undefined}
      style={style}
      headerExtra={headerExtra}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      githubToken={effectiveToken}
      filterSortController={filterSortController}
    />
  );
};

export default GitHubUserPage;

