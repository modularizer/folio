/**
 * GitHub API utilities
 * 
 * Modular functions for fetching and transforming GitHub repository data.
 * Can be used independently or with GitHubProjectCard component.
 * 
 * All API calls are cached using IndexedDB to reduce requests and improve performance.
 */

import { cachedFetch, CACHE_TTL } from './cache';
import { ensureProjectSlug } from './slug';
import { getUserCommitCount, HasCommitStats } from './githubStats';
import { shouldHideProject } from '@/projects/utils/visibility';
import { buildReadmeBranchCandidates, countAlphabeticLines, fetchReadmeMarkdown } from './readmeCache';

/**
 * Normalize GitHub-provided license names for cleaner display.
 */
const normalizeLicenseName = (licenseName?: string | null): string | undefined => {
  if (!licenseName) return undefined;
  const trimmed = licenseName.trim();
  if (trimmed === 'BSD 3-Clause "New" or "Revised" License') {
    return 'BSD 3-Clause';
  }
  return trimmed;
};

/**
 * GitHub API response types
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
  open_issues_count: number;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  fork: boolean; // Whether this is a fork
  size: number; // Size in KB
  parent?: { // If forked, info about parent repo
    full_name: string;
    html_url: string;
  };
  watchers_count?: number; // Number of watchers
  archived?: boolean; // Whether archived
  disabled?: boolean; // Whether disabled
  has_pages?: boolean; // Whether GitHub Pages is enabled
}

export interface GitHubPagesInfo {
  url: string;
  status: string;
  cname: string | null;
  custom_404: boolean;
  html_url: string | null;
  source?: {
    branch: string;
    path: string;
  };
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parse GitHub URL to owner/repo format
 * 
 * @param url - GitHub URL or owner/repo format
 * @returns owner/repo string or null if invalid
 * 
 * @example
 * parseGitHubUrl("https://github.com/facebook/react") // "facebook/react"
 * parseGitHubUrl("facebook/react") // "facebook/react"
 */
export const parseGitHubUrl = (url: string): string | null => {
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
    /^([^\/]+)\/([^\/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }

  return null;
};

/**
 * Fetch repository data from GitHub API
 * 
 * @param repoPath - Repository path in owner/repo format
 * @param token - Optional GitHub API token for higher rate limits
 * @returns Promise resolving to GitHub repository data
 * 
 * @example
 * const repo = await fetchGitHubRepo("facebook/react");
 */
export const fetchGitHubRepo = async (
  repoPath: string,
  token?: string
): Promise<GitHubRepo> => {
  const apiUrl = `https://api.github.com/repos/${repoPath}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    return await cachedFetch<GitHubRepo>(
      apiUrl,
      { headers },
      CACHE_TTL.REPO_DETAILS
    );
  } catch (error) {
    // Handle HTTP errors
    if (error instanceof Error && error.message.startsWith('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      if (status === 404) {
        throw new Error(`Repository not found: ${repoPath}`);
      }
      if (status === 403) {
        throw new Error('GitHub API rate limit exceeded. Consider providing a GitHub token.');
      }
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Get GitHub Pages URL for a repository if Pages is enabled
 * 
 * @param repo - GitHub repository data (must include has_pages field)
 * @returns GitHub Pages URL if enabled, null otherwise
 * 
 * @example
 * const pagesUrl = getGitHubPagesUrl(repo);
 */
export const getGitHubPagesUrl = (repo: GitHubRepo): string | null => {
  // Use the has_pages field from the repo data (no API call needed!)
  if (!repo.has_pages) {
    return null;
  }
  
  const [owner, repoName] = repo.full_name.split('/');
  
  // Construct GitHub Pages URL
  // Format: https://{owner}.github.io/{repo} or https://{owner}.github.io if repo name matches owner
  if (owner === repoName) {
    return `https://${owner}.github.io`;
  }
  return `https://${owner}.github.io/${repoName}`;
};

/**
 * Map file extension to programming language
 * Based on common file extensions and GitHub's language detection
 */
const getLanguageFromExtension = (filename: string): string | null => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'mjs': 'JavaScript',
    'cjs': 'JavaScript',
    
    // Python
    'py': 'Python',
    'pyw': 'Python',
    'pyi': 'Python',
    
    // Java
    'java': 'Java',
    
    // C/C++
    'c': 'C',
    'cpp': 'C++',
    'cc': 'C++',
    'cxx': 'C++',
    'h': 'C',
    'hpp': 'C++',
    
    // Go
    'go': 'Go',
    
    // Rust
    'rs': 'Rust',
    
    // Ruby
    'rb': 'Ruby',
    
    // PHP
    'php': 'PHP',
    
    // Swift
    'swift': 'Swift',
    
    // Kotlin
    'kt': 'Kotlin',
    'kts': 'Kotlin',
    
    // Dart
    'dart': 'Dart',
    
    // HTML/CSS
    'html': 'HTML',
    'htm': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    
    // Markup/Config
    'xml': 'XML',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'toml': 'TOML',
    
    // Shell
    'sh': 'Shell',
    'bash': 'Shell',
    'zsh': 'Shell',
    'fish': 'Shell',
    
    // SQL
    'sql': 'SQL',
    
    // R
    'r': 'R',
    'R': 'R',
    
    // MATLAB
    'm': 'MATLAB',
    
    // Lua
    'lua': 'Lua',
    
    // Perl
    'pl': 'Perl',
    'pm': 'Perl',
    
    // Scala
    'scala': 'Scala',
    
    // Clojure
    'clj': 'Clojure',
    'cljs': 'ClojureScript',
    
    // Haskell
    'hs': 'Haskell',
    
    // Elixir
    'ex': 'Elixir',
    'exs': 'Elixir',
    
    // Vue
    'vue': 'Vue',
    
    // Svelte
    'svelte': 'Svelte',
    
    // Markdown
    'md': 'Markdown',
    'markdown': 'Markdown',
  };
  
  return languageMap[ext] || null;
};

/**
 * Check if a file path should be excluded from language analysis
 * Excludes dependencies, generated files, and config files
 */
const shouldExcludeFile = (filePath: string): boolean => {
  const excludePatterns = [
    // Dependencies
    /^node_modules\//,
    /^vendor\//,
    /^\.venv\//,
    /^venv\//,
    /^\.gradle\//,
    /^\.mvn\//,
    /^target\//,
    /^bin\//,
    /^obj\//,
    /^__pycache__\//,
    /^\.pytest_cache\//,
    
    // Generated files
    /^dist\//,
    /^build\//,
    /^\.next\//,
    /^out\//,
    /^\.nuxt\//,
    /^\.output\//,
    /^coverage\//,
    /^\.nyc_output\//,
    
    // Config files (usually not "writing")
    /^package-lock\.json$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    /^Gemfile\.lock$/,
    /^Pipfile\.lock$/,
    /^poetry\.lock$/,
    /^Cargo\.lock$/,
    /^go\.sum$/,
    /^composer\.lock$/,
    /^\.gitignore$/,
    /^\.gitattributes$/,
    /^\.editorconfig$/,
    /^\.prettierrc/,
    /^\.eslintrc/,
    /^tsconfig\.json$/,
    /^jsconfig\.json$/,
    /^\.vscode\/settings\.json$/,
    /^\.idea\//,
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
    
    // Binary files
    /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz)$/i,
  ];
  
  return excludePatterns.some(pattern => pattern.test(filePath));
};

/**
 * Fetch commits with file changes for a repository
 * Samples the last N commits (or all if less than N)
 * 
 * @param repoPath - Repository path in owner/repo format
 * @param token - Optional GitHub API token
 * @param sampleSize - Number of commits to sample (default: 50)
 * @returns Promise resolving to array of commits with file changes
 */
const fetchCommitsWithFiles = async (
  repoPath: string,
  token?: string,
  sampleSize: number = 50
): Promise<Array<{
  sha: string;
  author: { login: string | null } | null;
  commit: { message: string; author: { date: string } };
  files: Array<{ filename: string; status: string }>;
}>> => {
  try {
    // First, fetch the list of commits
    const commitsUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=${Math.min(sampleSize, 100)}`;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      ...(token && { 'Authorization': `token ${token}` }),
    };
    
    const commits = await cachedFetch<Array<{
      sha: string;
      author: { login: string | null } | null;
      commit: { message: string; author: { date: string } };
    }>>(
      commitsUrl,
      { headers },
      CACHE_TTL.REPO_DETAILS
    );
    
    if (!commits || commits.length === 0) {
      return [];
    }
    
    // Fetch detailed commit info with file changes for each commit
    // Limit to sampleSize commits
    const commitsToFetch = commits.slice(0, sampleSize);
    const commitPromises = commitsToFetch.map(async (commit) => {
      try {
        const commitUrl = `https://api.github.com/repos/${repoPath}/commits/${commit.sha}`;
        const commitDetail = await cachedFetch<{
          sha: string;
          author: { login: string | null } | null;
          commit: { message: string; author: { date: string } };
          files: Array<{ filename: string; status: string }>;
        }>(
          commitUrl,
          { headers },
          CACHE_TTL.REPO_DETAILS
        );
        return commitDetail;
      } catch (error) {
        // If a commit fetch fails, return null (we'll filter these out)
        console.warn(`Failed to fetch commit ${commit.sha}:`, error);
        return null;
      }
    });
    
    const commitDetails = await Promise.all(commitPromises);
    return commitDetails.filter((commit): commit is NonNullable<typeof commit> => commit !== null);
  } catch (error) {
    console.error(`Failed to fetch commits for ${repoPath}:`, error);
    return [];
  }
};

/**
 * Calculate language breakdown by commits
 * Analyzes commits to determine what languages the user actually writes
 * 
 * @param repoPath - Repository path in owner/repo format
 * @param ownerLogin - Repository owner's GitHub login
 * @param token - Optional GitHub API token
 * @param sampleSize - Number of commits to sample (default: 50)
 * @returns Promise resolving to language breakdown by commit count
 */
const calculateLanguagesByCommits = async (
  repoPath: string,
  ownerLogin: string,
  token?: string,
  sampleSize: number = 50
): Promise<Record<string, number> | null> => {
  try {
    const commits = await fetchCommitsWithFiles(repoPath, token, sampleSize);
    
    if (commits.length === 0) {
      return null;
    }
    
    const languageCounts: Record<string, number> = {};
    const ownerLoginLower = ownerLogin.toLowerCase();
    
    for (const commit of commits) {
      // Skip merge commits (they're usually not "writing")
      if (commit.commit.message.startsWith('Merge ') || commit.commit.message.includes('Merge pull request')) {
        continue;
      }
      
      // Only count commits by the owner
      const commitAuthor = commit.author?.login?.toLowerCase();
      if (commitAuthor !== ownerLoginLower) {
        continue;
      }
      
      // Analyze files in this commit
      const fileLanguages: Record<string, number> = {};
      
      for (const file of commit.files || []) {
        // Skip deleted files and excluded files
        if (file.status === 'removed' || shouldExcludeFile(file.filename)) {
          continue;
        }
        
        const language = getLanguageFromExtension(file.filename);
        if (language) {
          fileLanguages[language] = (fileLanguages[language] || 0) + 1;
        }
      }
      
      // Determine primary language for this commit (most files changed)
      if (Object.keys(fileLanguages).length > 0) {
        const primaryLanguage = Object.entries(fileLanguages).reduce((a, b) => 
          a[1] > b[1] ? a : b
        )[0];
        
        // Store language names in lowercase for consistency
        const langLower = primaryLanguage.toLowerCase();
        languageCounts[langLower] = (languageCounts[langLower] || 0) + 1;
      }
    }
    
    return Object.keys(languageCounts).length > 0 ? languageCounts : null;
  } catch (error) {
    console.error(`Failed to calculate languages by commits for ${repoPath}:`, error);
    return null;
  }
};

/**
 * Transform GitHub repository data to ProjectData format
 * 
 * @param repo - GitHub repository data
 * @param customData - Optional custom data to merge/override
 * @param includeStats - Whether to include stats in description (default: true)
 * @param checkPages - Whether to check for GitHub Pages (default: true)
 * @param token - Optional GitHub API token for checking Pages
 * @returns Promise resolving to ProjectData object
 * 
 * @example
 * const repo = await fetchGitHubRepo("facebook/react");
 * const projectData = await transformGitHubToProject(repo, { featured: true });
 */
export const transformGitHubToProject = async (
  repo: GitHubRepo,
  customData: Partial<import('@/projects/types').ProjectData> = {},
  includeStats: boolean = true,
  checkPages: boolean = true,
  token?: string,
  fetchAdditionalStats: boolean = false // Whether to fetch languages and contribution stats (requires extra API calls)
): Promise<import('@/projects/types').ProjectData> => {
  // DEBUG: Always log when this function is called

  // Extract topics/tags
  const tags = [
    ...(repo.topics || []),
    ...(repo.language ? [repo.language] : []),
    ...(repo.license ? [repo.license.name] : []),
  ];

  // Build description (without stats - they'll be shown separately on the card)
  const description = repo.description || '';

  /**
   * Extract website URL from repository description
   * Looks for URLs in common patterns like:
   * - "Website: https://example.com"
   * - "Live: https://example.com"
   * - "Demo: https://example.com"
   * - "🌐 https://example.com"
   * - Or just plain URLs
   */
  const extractUrlFromDescription = (desc: string): string | null => {
    if (!desc) return null;
    
    // Common patterns for website URLs in descriptions
    const patterns = [
      /(?:website|live|demo|site|url)[:\s]+(https?:\/\/[^\s\)]+)/i,
      /🌐\s*(https?:\/\/[^\s\)]+)/i,
      /(?:visit|check out|see|view)[:\s]+(https?:\/\/[^\s\)]+)/i,
      // Look for URLs in parentheses or at the end
      /\(([^)]*https?:\/\/[^\s\)]+[^)]*)\)/i,
      // Plain URL (must be http:// or https://)
      /(https?:\/\/[^\s\)]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = desc.match(pattern);
      if (match) {
        const url = match[1] || match[0];
        // Clean up the URL (remove trailing punctuation)
        const cleanUrl = url.replace(/[.,;:!?]+$/, '').trim();
        // Validate it's a proper URL
        try {
          new URL(cleanUrl);
          // Exclude GitHub URLs (we want external sites)
          if (!cleanUrl.includes('github.com') && !cleanUrl.includes('github.io')) {
            return cleanUrl;
          }
        } catch {
          // Invalid URL, continue
        }
      }
    }
    
    return null;
  };

  // Determine liveUrl: custom > description URL > homepage > GitHub Pages > undefined
  let liveUrl = customData.liveUrl || undefined;
  
  // If no custom liveUrl, try to extract from description
  if (!liveUrl) {
    const descUrl = extractUrlFromDescription(description);
    if (descUrl) {
      liveUrl = descUrl;
    }
  }
  
  // Fall back to homepage if still no URL
  if (!liveUrl && repo.homepage) {
    liveUrl = repo.homepage;
  }
  
  // Check for GitHub Pages if no liveUrl is found
  // Use the has_pages field from the repo data (no additional API calls needed!)
  if (!liveUrl && repo.has_pages) {
    const pagesUrl = getGitHubPagesUrl(repo);
    if (pagesUrl) {
      liveUrl = pagesUrl;
    }
  }
  
  // No need to verify URLs - GitHub Pages URLs are trusted (from has_pages field)
  // and other URLs from description/homepage are assumed valid

  // Fetch additional stats if requested (languages, contribution percentage, commits, files)
  let githubLanguages: Record<string, number> | undefined;
  let githubLanguagesByCommits: Record<string, number> | null = null; // Language breakdown by commits
  let githubContributionPercent: number | null = null; // Code-based contribution (additions/deletions)
  let githubContributors: number | null = null; // Number of contributors
  let githubCommitsCount: number | null = null;
  let githubOwnerCommitsCount: number | null = null;
  let githubOwnerCommitsPercent: number | null = null; // Commit-based contribution percentage
  let githubFilesCount: number | null = null;
  let githubLinesOfCode: number | null = null;
  let githubFirstCommitDate: string | null = null;
  let githubLastCommitDate: string | null = null;
  let githubLatestRelease: string | null = null; // Latest release name/tag
  let githubCommitsHistory: Array<{ bucket: string; total: number; owner: number }> | null = null;

  
  // Fetch languages and basic commit info even without a token (public endpoints)
  // Only fetch expensive stats (contribution percentage, detailed commits) with a token
  if (fetchAdditionalStats) {
    // DEBUG: Log that we're fetching additional stats
    // console.log(`[GitHub] Fetching additional stats for ${repo.full_name}`, { fetchAdditionalStats, hasToken: !!token });
    
    // Fetch languages (public endpoint, no auth required but rate limited)
    const languagesPromise = (async () => {
      try {
        const apiUrl = `https://api.github.com/repos/${repo.full_name}/languages`;
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
          ...(token && { 'Authorization': `token ${token}` }),
        };
        return await cachedFetch<Record<string, number>>(
          apiUrl,
          { headers },
          CACHE_TTL.REPO_DETAILS
        );
      } catch {
        return undefined;
      }
    })();
    
    // Calculate language breakdown by commits (more accurate representation of what user writes)
    // Only do this if:
    // 1. We have a token (to avoid rate limits)
    // 2. We have owner info
    // 3. The repo has multiple languages (if it's 100% one language, no need to analyze commits)
    // Start the promise immediately - it will wait for languages internally
    const languagesByCommitsPromise = languagesPromise.then(async (languages) => {
      // If no languages, skip commit analysis
      if (!languages || Object.keys(languages).length === 0) {
        return null;
      }
      
      // Only proceed if we have token and owner info
      // Note: We calculate even for single-language repos because we need it for language levels
      if (!token || !repo.owner?.login) {
        return null;
      }
      
      try {
        return await calculateLanguagesByCommits(
          repo.full_name,
          repo.owner.login,
          token,
          50 // Sample last 50 commits
        );
      } catch (error) {
        console.error(`Failed to calculate languages by commits for ${repo.full_name}:`, error);
        return null;
      }
    }).catch(() => null);
    
    // Contribution percentage requires auth (more detailed stats)
    const contributionPromise = (repo.owner?.login && token) ? (async () => {
      try {
        const apiUrl = `https://api.github.com/repos/${repo.full_name}/contributors`;
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
        };
        const contributors = await cachedFetch<Array<{
          login: string;
          contributions: number;
        }>>(
          apiUrl,
          { headers },
          CACHE_TTL.REPO_DETAILS
        );
        
        const userContributions = contributors.find(c => c.login.toLowerCase() === repo.owner!.login.toLowerCase());
        if (!userContributions) return { percent: null, count: contributors.length };
        
        const totalContributions = contributors.reduce((sum, c) => sum + c.contributions, 0);
        if (totalContributions === 0) return { percent: null, count: contributors.length };
        
        return {
          percent: Math.round((userContributions.contributions / totalContributions) * 100),
          count: contributors.length
        };
      } catch {
        return { percent: null, count: null };
      }
    })() : Promise.resolve({ percent: null, count: null });
    
    // Fetch commits count, dates, and commit-based contribution percentage
    const commitsPromise = (async () => {
      try {
        // Use the commits API with per_page=1 to get total count from Link header
        const apiUrl = `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`;
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
          ...(token && { 'Authorization': `token ${token}` }),
        };
        
        // Get first commit (most recent) for last commit date - use cachedFetch
        // Note: We can't get Link header from cachedFetch, so we'll estimate from data
        const firstPageCommits = await cachedFetch<Array<{
          sha: string;
          commit: {
            author: {
              date: string;
              name: string;
              email: string;
            };
          };
          author: {
            login: string;
          } | null;
        }>>(
          apiUrl,
          { headers },
          CACHE_TTL.REPO_DETAILS
        );
        
        // Last commit date is the most recent commit
        const lastCommitDate = firstPageCommits.length > 0 
          ? firstPageCommits[0].commit.author.date 
          : repo.pushed_at;
        
        let commitsCount: number | null = null;
        let firstCommitDate: string | null = null;
        let ownerCommitsCount: number | null = null;
        
        // Sample commits to estimate count and get first commit date
        // We can't get Link header from cachedFetch, so we'll sample multiple pages
        if (firstPageCommits.length > 0) {
          // Sample first few pages to get a better estimate
          const pagesToSample = 3; // Sample first 3 pages (300 commits max)
          const samplePromises: Promise<Array<{
            sha: string;
            commit: {
              author: {
                date: string;
                name: string;
                email: string;
              };
            };
            author: {
              login: string;
            } | null;
          }>>[] = [];
          
          for (let page = 1; page <= pagesToSample; page++) {
            samplePromises.push(
              cachedFetch<Array<{
                sha: string;
                commit: {
                  author: {
                    date: string;
                    name: string;
                    email: string;
                  };
                };
                author: {
                  login: string;
                } | null;
              }>>(
                `https://api.github.com/repos/${repo.full_name}/commits?per_page=100&page=${page}`,
                { headers },
                CACHE_TTL.REPO_DETAILS
              ).catch(() => []) // Don't fail if a page fails - use what we have
            );
          }
          
          try {
            const sampleResults = await Promise.all(samplePromises);
            const allSampledCommits = sampleResults.flat();
            
            if (allSampledCommits.length > 0) {
              // Get first commit date (oldest in our sample - last item)
              firstCommitDate = allSampledCommits[allSampledCommits.length - 1].commit.author.date;
              
              // Count owner commits in sample
              const ownerLogin = repo.owner?.login?.toLowerCase();
              if (ownerLogin) {
                ownerCommitsCount = allSampledCommits.filter(c => 
                  c.author?.login?.toLowerCase() === ownerLogin
                ).length;
              }
              
              // Use sampled count as estimate (minimum - there might be more)
              commitsCount = allSampledCommits.length;

              // Build history buckets (monthly)
              const historyMap = new Map<string, { total: number; owner: number }>();
              const ownerLoginLower = repo.owner?.login?.toLowerCase();
              allSampledCommits.forEach(commit => {
                const date = commit.commit.author.date;
                if (!date) return;
                const bucket = date.slice(0, 7); // YYYY-MM
                const entry = historyMap.get(bucket) || { total: 0, owner: 0 };
                entry.total += 1;
                if (ownerLoginLower && commit.author?.login?.toLowerCase() === ownerLoginLower) {
                  entry.owner += 1;
                }
                historyMap.set(bucket, entry);
              });
              const sortedHistory = Array.from(historyMap.entries())
                .sort(([a], [b]) => (a > b ? 1 : -1))
                .map(([bucket, entry]) => ({
                  bucket,
                  total: entry.total,
                  owner: entry.owner,
                }));
              githubCommitsHistory = sortedHistory.slice(-18);
            }
          } catch {
            // If sampling fails, use first page data only
            if (firstPageCommits.length > 0) {
              firstCommitDate = firstPageCommits[0].commit.author.date;
              commitsCount = firstPageCommits.length;
              if (repo.owner?.login) {
                const ownerLogin = repo.owner.login.toLowerCase();
                ownerCommitsCount = firstPageCommits.filter(c => 
                  c.author?.login?.toLowerCase() === ownerLogin
                ).length;
              }
            }
          }
        }
        
        return {
          count: commitsCount,
          firstDate: firstCommitDate,
          lastDate: lastCommitDate,
          ownerCommitsCount,
          history: githubCommitsHistory || undefined,
        };
      } catch {
        return {
          count: null,
          firstDate: null,
          lastDate: repo.pushed_at || null,
          ownerCommitsCount: null,
          history: undefined,
        };
      }
    })();
    
    // Fetch files count (excluding boilerplate)
    // Fetch files count (requires auth to get detailed file tree)
    // Skip if no token to avoid rate limits
    const filesPromise = token ? (async () => {
      try {
        // Use the git trees API to get file count
        // Get the tree for the default branch recursively
        const apiUrl = `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`;
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
        };
        const tree = await cachedFetch<{
          tree: Array<{
            path: string;
            type: 'blob' | 'tree';
            size?: number;
          }>;
        }>(
          apiUrl,
          { headers },
          CACHE_TTL.REPO_DETAILS
        );
        
        // Common boilerplate directories/files to exclude
        const boilerplatePatterns = [
          /^node_modules\//,
          /^\.git\//,
          /^dist\//,
          /^build\//,
          /^\.next\//,
          /^out\//,
          /^\.nuxt\//,
          /^\.vscode\//,
          /^\.idea\//,
          /^\.gradle\//,
          /^\.mvn\//,
          /^target\//,
          /^bin\//,
          /^obj\//,
          /^\.pytest_cache\//,
          /^__pycache__\//,
          /^\.venv\//,
          /^venv\//,
          /^\.env/,
          /^package-lock\.json$/,
          /^yarn\.lock$/,
          /^pnpm-lock\.yaml$/,
          /^\.DS_Store$/,
          /^Thumbs\.db$/,
          /^\.gitignore$/,
          /^\.gitattributes$/,
          /^\.editorconfig$/,
          /^\.prettierrc/,
          /^\.eslintrc/,
          /^tsconfig\.json$/,
          /^jsconfig\.json$/,
          /^\.vscode\/settings\.json$/,
        ];
        
        // Count only files (blobs), excluding boilerplate
        const files = tree.tree.filter(
          item => item.type === 'blob' && 
          !boilerplatePatterns.some(pattern => pattern.test(item.path))
        );
        
        return files.length;
      } catch {
        return null;
      }
    })() : Promise.resolve(null);
    
    const [languages, languagesByCommits, contribution, commitsData, files] = await Promise.all([
      languagesPromise,
      languagesByCommitsPromise,
      contributionPromise,
      commitsPromise,
      filesPromise,
    ]);
    
    // DEBUG: Log what we got
    // console.log(`[GitHub] Stats for ${repo.full_name}:`, {
    //   languages: languages ? Object.keys(languages).length + ' languages' : 'none',
    //   commitsCount: commitsData?.count ?? 'none',
    //   contribution: contribution,
    //   files: files,
    // });
    //
    // Only set if we got valid data (not undefined from catch blocks)
    // Normalize language keys to lowercase for consistency
    if (languages !== undefined && languages !== null) {
      const normalizedLanguages: Record<string, number> = {};
      Object.entries(languages).forEach(([lang, bytes]) => {
        normalizedLanguages[lang.toLowerCase()] = bytes;
      });
      githubLanguages = normalizedLanguages;
    }
    if (languagesByCommits !== null && languagesByCommits !== undefined) {
      // languagesByCommits is already normalized to lowercase in calculateLanguagesByCommits
      githubLanguagesByCommits = languagesByCommits;
    }
    if (contribution && typeof contribution === 'object' && 'percent' in contribution) {
      githubContributionPercent = contribution.percent;
      githubContributors = contribution.count;
    } else if (typeof contribution === 'number') {
      // Handle legacy format where contribution is just a number
      githubContributionPercent = contribution;
    }
    if (commitsData && commitsData.count !== null && commitsData.count !== undefined) {
      githubCommitsCount = commitsData.count;
    }
    if (commitsData && commitsData.ownerCommitsCount !== null && commitsData.ownerCommitsCount !== undefined) {
      githubOwnerCommitsCount = commitsData.ownerCommitsCount;
    }
    if (commitsData && commitsData.history) {
      githubCommitsHistory = commitsData.history;
    }
    if (files !== null && files !== undefined) {
      githubFilesCount = files;
    }
    if (commitsData && commitsData.firstDate) {
      githubFirstCommitDate = commitsData.firstDate;
    }
    if (commitsData && commitsData.lastDate) {
      githubLastCommitDate = commitsData.lastDate;
    }
    
    // Calculate commit-based contribution percentage
    if (commitsData.count && commitsData.ownerCommitsCount !== null) {
      githubOwnerCommitsPercent = Math.round((commitsData.ownerCommitsCount / commitsData.count) * 100);
    }
    
    // Calculate lines of code from languages data
    if (languages) {
      githubLinesOfCode = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      // Convert bytes to approximate lines (assuming ~50 bytes per line average)
      githubLinesOfCode = Math.round(githubLinesOfCode / 50);
    }
  }

  // Merge with custom data (custom data takes precedence)
  // Note: We spread customData first, then override with GitHub-specific fields
  // This ensures GitHub stats are always included unless explicitly overridden
  const result = {
    id: customData.id || repo.full_name.toLowerCase().replace(/\//g, '-'),
    slug: customData.slug || repo.name,
    title: customData.title || repo.name,
    description: customData.description || description,
    imageUrl: customData.imageUrl || `https://opengraph.githubassets.com/1/${repo.full_name}`,
    githubUrl: customData.githubUrl || repo.html_url,
    liveUrl,
    tags: customData.tags || tags,
    featured: customData.featured || false,
    startDate: customData.startDate || repo.created_at.split('T')[0],
    endDate: customData.endDate || (repo.pushed_at ? repo.pushed_at.split('T')[0] : undefined),
    template: customData.template || (repo.html_url ? 'GitHub' : undefined),
    cardConfig: customData.cardConfig,
    // Merge any additional custom fields first
    ...customData,
    // GitHub-specific stats (set after spread to ensure they're always included)
    // NOTE: Only override if customData explicitly sets these, otherwise use fetched values
    githubStars: customData.githubStars !== undefined ? customData.githubStars : repo.stargazers_count,
    githubForks: customData.githubForks !== undefined ? customData.githubForks : repo.forks_count,
    githubIsFork: customData.githubIsFork !== undefined ? customData.githubIsFork : repo.fork,
    githubSize: customData.githubSize !== undefined ? customData.githubSize : repo.size,
    githubParentRepo: customData.githubParentRepo !== undefined ? customData.githubParentRepo : (repo.parent?.full_name || undefined),
    // Languages and commits: use fetched values unless explicitly overridden
    // Only set if we have valid data (not null/undefined from failed fetches)
    // Normalize all language keys to lowercase for consistency
    githubLanguages: (() => {
      const langs = customData.githubLanguages !== undefined 
        ? customData.githubLanguages 
        : (githubLanguages !== undefined && githubLanguages !== null ? githubLanguages : undefined);
      if (langs && typeof langs === 'object') {
        const normalized: Record<string, number> = {};
        Object.entries(langs).forEach(([lang, bytes]) => {
          normalized[lang.toLowerCase()] = bytes;
        });
        return normalized;
      }
      return langs;
    })(),
    githubLanguagesByCommits: (() => {
      const langsByCommits = customData.githubLanguagesByCommits !== undefined
        ? customData.githubLanguagesByCommits
        : (githubLanguagesByCommits !== null && githubLanguagesByCommits !== undefined ? githubLanguagesByCommits : undefined);
      if (langsByCommits && typeof langsByCommits === 'object') {
        const normalized: Record<string, number> = {};
        Object.entries(langsByCommits).forEach(([lang, commits]) => {
          normalized[lang.toLowerCase()] = commits;
        });
        return normalized;
      }
      return langsByCommits;
    })(),
    // Pre-compute language levels (0-4) based on user's commit count multiplied by language percent
    githubOwnerCommitsCount: customData.githubOwnerCommitsCount !== undefined
      ? customData.githubOwnerCommitsCount
      : (githubOwnerCommitsCount !== null && githubOwnerCommitsCount !== undefined ? githubOwnerCommitsCount : undefined),
    githubLanguageLevels: (() => {
      const levels: Record<string, number> = {};
      const languagesByCommits = customData.githubLanguagesByCommits !== undefined
        ? customData.githubLanguagesByCommits
        : (githubLanguagesByCommits !== null && githubLanguagesByCommits !== undefined ? githubLanguagesByCommits : undefined);
      
      const languages = customData.githubLanguages !== undefined
        ? customData.githubLanguages
        : (githubLanguages !== undefined && githubLanguages !== null ? githubLanguages : undefined);
      
      const commitsCount = customData.githubCommitsCount !== undefined
        ? customData.githubCommitsCount
        : (githubCommitsCount !== null && githubCommitsCount !== undefined ? githubCommitsCount : undefined);

      const ownerCommitsCount = customData.githubOwnerCommitsCount !== undefined
        ? customData.githubOwnerCommitsCount
        : (githubOwnerCommitsCount !== null && githubOwnerCommitsCount !== undefined ? githubOwnerCommitsCount : undefined);
      
      const ownerCommitsPercent = customData.githubOwnerCommitsPercent !== undefined
        ? customData.githubOwnerCommitsPercent
        : (githubOwnerCommitsPercent !== null && githubOwnerCommitsPercent !== undefined ? githubOwnerCommitsPercent : undefined);
      
      // Calculate total bytes for language percentage calculation
      let totalBytes = 0;
      if (languages && typeof languages === 'object') {
        totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      }
      
      // Calculate user's total commit count
      let userTotalCommits: number | undefined = ownerCommitsCount;
      if (userTotalCommits === undefined && commitsCount !== undefined && commitsCount !== null && ownerCommitsPercent !== undefined && ownerCommitsPercent !== null) {
        userTotalCommits = Math.round(commitsCount * (ownerCommitsPercent / 100));
      }
      
      if (languagesByCommits && typeof languagesByCommits === 'object' && totalBytes > 0) {
        // Preferred: Use githubLanguagesByCommits (most accurate - per-language commit breakdown)
        // Both languagesByCommits and languages now use lowercase keys
        Object.entries(languagesByCommits).forEach(([lang, userCommits]) => {
          const langLower = lang.toLowerCase(); // Already lowercase, but ensure consistency
          const commitCount = userCommits as number;
          
          // Find language percentage in repo (direct lookup since both are lowercase)
          let langPercent = 0;
          if (languages && languages[langLower] !== undefined) {
            const langBytes = languages[langLower];
            langPercent = (langBytes / totalBytes) * 100;
          }
          
          // Calculate weighted amount: user commits * language percent
          const weightedAmount = commitCount * (langPercent / 100);
          
          // Chunk to levels 0-4
          let level = 0;
          if (weightedAmount > 0) {
            if (weightedAmount <= 2.5) level = 1;      // 0-2.5
            else if (weightedAmount <= 7.5) level = 2; // 2.5-7.5
            else if (weightedAmount <= 15) level = 3;  // 7.5-15
            else level = 4;                            // >15
          }
          
          levels[langLower] = level;
        });
      } else if (languages && typeof languages === 'object' && totalBytes > 0) {
        // Fallback: Use githubLanguages + user commit count + owner percent
        // Distribute user's commits across languages based on language percentages
        // Languages already use lowercase keys
        // Calculate levels even if userTotalCommits is 0 (user still has access to the repo's languages)
        Object.entries(languages).forEach(([lang, langBytes]) => {
          const langLower = lang.toLowerCase(); // Already lowercase, but ensure consistency
          const langPercent = (langBytes / totalBytes) * 100;
          
          let level = 0;
          
          if (userTotalCommits !== undefined && userTotalCommits > 0) {
            // Estimate user commits in this language: user total commits * language percent
            const estimatedUserCommits = userTotalCommits * (langPercent / 100);
            
            // Calculate weighted amount: estimated user commits * language percent
            const weightedAmount = estimatedUserCommits * (langPercent / 100);
            
            // Chunk to levels 0-4 based on weighted amount
            if (weightedAmount > 0) {
              if (weightedAmount <= 2.5) level = 1;      // 0-2.5
              else if (weightedAmount <= 7.5) level = 2; // 2.5-7.5
              else if (weightedAmount <= 15) level = 3;  // 7.5-15
              else level = 4;                            // >15
            }
          } else {
            // User has 0 commits, but repo has this language
            // Set level based on language percentage in repo (scaled down since user didn't contribute)
            // This allows filtering to work even for forks/0% contribution repos
            if (langPercent > 0) {
              // Scale: 100% language = level 2, 50% = level 1, <50% = level 1
              if (langPercent >= 50) level = 2;
              else if (langPercent >= 10) level = 1;
              // else level = 0 (language exists but is minor)
            }
          }
          
          levels[langLower] = level;
        });
      } else if (languagesByCommits && typeof languagesByCommits === 'object') {
        // Fallback: if we don't have language percentages, use commit count directly
        Object.entries(languagesByCommits).forEach(([lang, commits]) => {
          const langLower = lang.toLowerCase();
          const commitCount = commits as number;
          
          // Chunk to levels 0-4 based on commit count
          let level = 0;
          if (commitCount > 0) {
            if (commitCount <= 5) level = 1;
            else if (commitCount <= 15) level = 2;
            else if (commitCount <= 30) level = 3;
            else level = 4;
          }
          
          levels[langLower] = level;
        });
      }
      
      return Object.keys(levels).length > 0 ? levels : undefined;
    })(),
    githubContributionPercent: customData.githubContributionPercent !== undefined ? customData.githubContributionPercent : githubContributionPercent,
    contributors: customData.contributors !== undefined ? customData.contributors : (githubContributors !== null ? githubContributors : undefined),
    githubCommitsCount: customData.githubCommitsCount !== undefined 
      ? customData.githubCommitsCount 
      : (githubCommitsCount !== null && githubCommitsCount !== undefined ? githubCommitsCount : undefined),
    githubCommitsHistory: customData.githubCommitsHistory !== undefined
      ? customData.githubCommitsHistory
      : (githubCommitsHistory !== null && githubCommitsHistory !== undefined ? githubCommitsHistory : undefined),
    githubOwnerCommitsPercent: customData.githubOwnerCommitsPercent !== undefined ? customData.githubOwnerCommitsPercent : githubOwnerCommitsPercent,
    githubFilesCount: customData.githubFilesCount !== undefined ? customData.githubFilesCount : githubFilesCount,
    githubLinesOfCode: customData.githubLinesOfCode !== undefined ? customData.githubLinesOfCode : githubLinesOfCode,
    githubOpenIssues: customData.githubOpenIssues !== undefined ? customData.githubOpenIssues : repo.open_issues_count,
    githubWatchers: customData.githubWatchers !== undefined ? customData.githubWatchers : repo.watchers_count,
    githubLicense: normalizeLicenseName(
      customData.githubLicense !== undefined ? customData.githubLicense : (repo.license?.name || undefined)
    ),
    githubArchived: customData.githubArchived !== undefined ? customData.githubArchived : repo.archived,
    githubFirstCommitDate: customData.githubFirstCommitDate !== undefined 
      ? customData.githubFirstCommitDate 
      : (githubFirstCommitDate || repo.created_at || undefined), // Fallback to repo creation date if first commit not fetched
    githubLastCommitDate: customData.githubLastCommitDate !== undefined 
      ? customData.githubLastCommitDate 
      : (githubLastCommitDate || repo.pushed_at || undefined),
    githubLatestRelease: customData.githubLatestRelease !== undefined ? customData.githubLatestRelease : githubLatestRelease,
    githubDefaultBranch: customData.githubDefaultBranch !== undefined ? customData.githubDefaultBranch : repo.default_branch,
    // Calculate days since last push (activity indicator)
    githubDaysSincePush: repo.pushed_at ? Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
    // Calculate project age in days
    githubProjectAge: Math.floor((Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  };
  
  return ensureProjectSlug(result);
};

/**
 * Fetch and transform GitHub repository to Project format
 * 
 * Convenience function that combines fetchGitHubRepo and transformGitHubToProject
 * 
 * @param githubUrl - GitHub URL or owner/repo format
 * @param customData - Optional custom data to merge
 * @param token - Optional GitHub API token
 * @param includeStats - Whether to include stats in description
 * @param checkPages - Whether to check for GitHub Pages (default: true)
 * @returns Promise resolving to ProjectData
 * 
 * @example
 * const projectData = await fetchGitHubProject("facebook/react", { featured: true });
 */
export const fetchGitHubProject = async (
  githubUrl: string,
  customData?: Partial<import('@/projects/types').ProjectData>,
  token?: string,
  includeStats: boolean = true,
  checkPages: boolean = true,
  fetchAdditionalStats: boolean = false
): Promise<import('@/projects/types').ProjectData> => {
  const repoPath = parseGitHubUrl(githubUrl);
  if (!repoPath) {
    throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  }

  const repo = await fetchGitHubRepo(repoPath, token);
  console.log(`[fetchGitHubProject] Calling transformGitHubToProject with fetchAdditionalStats=${fetchAdditionalStats}, hasToken=${!!token}`);
  return transformGitHubToProject(repo, customData, includeStats, checkPages, token, fetchAdditionalStats);
};

/**
 * Fetch GitHub user profile
 * 
 * @param username - GitHub username
 * @param token - Optional GitHub API token
 * @returns Promise resolving to GitHub user data
 * 
 * @example
 * const user = await fetchGitHubUser("octocat");
 */
export const fetchGitHubUser = async (
  username: string,
  token?: string
): Promise<GitHubUser> => {
  const apiUrl = `https://api.github.com/users/${username}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    return await cachedFetch<GitHubUser>(
      apiUrl,
      { headers },
      CACHE_TTL.USER_PROFILE
    );
  } catch (error) {
    // Handle HTTP errors
    if (error instanceof Error && error.message.startsWith('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      if (status === 404) {
        throw new Error(`User not found: ${username}`);
      }
      if (status === 403) {
        throw new Error('GitHub API rate limit exceeded. Consider providing a GitHub token (EXPO_PUBLIC_GITHUB_TOKEN) for higher rate limits (5000 requests/hour).');
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Fetch all public repositories for a GitHub user
 * 
 * @param username - GitHub username
 * @param token - Optional GitHub API token
 * @param options - Additional options (sort, direction, per_page, etc.)
 * @returns Promise resolving to array of repositories
 * 
 * @example
 * const repos = await fetchGitHubUserRepos("octocat", undefined, { sort: 'updated' });
 */
export const fetchGitHubUserRepos = async (
  username: string,
  token?: string,
  options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
    type?: 'all' | 'owner' | 'member';
  } = {}
): Promise<GitHubRepo[]> => {
  const {
    sort = 'updated',
    direction = 'desc',
    per_page = 20, // Reduced to 20 to minimize API calls (60 requests/hour limit for unauthenticated)
    page = 1,
    type = 'owner', // Only fetch repos owned by user, not forked ones (reduces results)
  } = options;

  const params = new URLSearchParams({
    sort,
    direction,
    per_page: per_page.toString(),
    page: page.toString(),
    type,
  });

  const apiUrl = `https://api.github.com/users/${username}/repos?${params.toString()}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    return await cachedFetch<GitHubRepo[]>(
      apiUrl,
      { headers },
      CACHE_TTL.USER_REPOS
    );
  } catch (error) {
    // Handle HTTP errors
    if (error instanceof Error && error.message.startsWith('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+):/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      if (status === 404) {
        throw new Error(`User not found: ${username}`);
      }
      if (status === 403) {
        throw new Error('GitHub API rate limit exceeded. Consider providing a GitHub token (EXPO_PUBLIC_GITHUB_TOKEN) for higher rate limits (5000 requests/hour).');
      }
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Transform GitHub user data to UserProfile format
 * 
 * @param user - GitHub user data
 * @param customData - Optional custom data to merge
 * @returns UserProfile object
 * 
 * @example
 * const user = await fetchGitHubUser("octocat");
 * const profile = transformGitHubUserToProfile(user, { background: "./assets/bg.jpg" });
 */
/**
 * Extract LinkedIn URL from GitHub user data
 * Checks blog field and bio for LinkedIn links
 */
const extractLinkedInFromGitHub = (user: GitHubUser): string | undefined => {
  // Check blog field for LinkedIn URL
  if (user.blog) {
    const linkedInPattern = /linkedin\.com\/in\/([^\/\s]+)/i;
    const match = user.blog.match(linkedInPattern);
    if (match) {
      return `https://www.linkedin.com/in/${match[1]}`;
    }
    // If blog is already a LinkedIn URL
    if (user.blog.includes('linkedin.com')) {
      return user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
    }
  }
  
  // Check bio for LinkedIn links
  if (user.bio) {
    const linkedInPattern = /linkedin\.com\/in\/([^\/\s\)]+)/i;
    const match = user.bio.match(linkedInPattern);
    if (match) {
      return `https://www.linkedin.com/in/${match[1]}`;
    }
  }
  
  return undefined;
};

export const transformGitHubUserToProfile = (
  user: GitHubUser,
  customData: Partial<import('@/user/profile').UserProfile> = {}
): import('@/user/profile').UserProfile => {
  // Extract LinkedIn from GitHub profile if not provided in customData
  const linkedinFromGitHub = customData.linkedin || extractLinkedInFromGitHub(user);
  
  return {
    name: customData.name || user.name || user.login,
    title: customData.title,
    bio: customData.bio || user.bio || undefined,
    email: customData.email || user.email || undefined,
    location: customData.location || user.location || undefined,
    github: customData.github || user.html_url,
    website: customData.website || user.blog || undefined,
    linkedin: linkedinFromGitHub,
    twitter: customData.twitter || (user.twitter_username ? `https://twitter.com/${user.twitter_username}` : undefined),
    background: customData.background,
    // Merge any additional custom fields
    ...customData,
  };
};

/**
 * Fetch pinned repositories for a user using GraphQL API
 * 
 * @param username - GitHub username
 * @param token - Optional GitHub API token (required for GraphQL)
 * @returns Promise resolving to array of repository full names (owner/repo)
 */
const fetchPinnedRepos = async (
  username: string,
  token?: string
): Promise<string[]> => {
  if (!token) {
    // GraphQL requires authentication, so return empty if no token
    return [];
  }

  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                nameWithOwner
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch pinned repos for ${username}:`, response.status);
      return [];
    }

    const data = await response.json();
    if (data.errors) {
      console.warn(`GraphQL errors fetching pinned repos:`, data.errors);
      return [];
    }

    const pinnedItems = data.data?.user?.pinnedItems?.nodes || [];
    return pinnedItems.map((item: { nameWithOwner: string }) => item.nameWithOwner);
  } catch (error) {
    console.warn(`Error fetching pinned repos for ${username}:`, error);
    return [];
  }
};

/**
 * Fetch all repositories for a user and transform them to Project format
 * 
 * @param username - GitHub username
 * @param token - Optional GitHub API token
 * @param customDataPerRepo - Function to generate custom data for each repo
 * @param options - Repository fetch options
 * @param checkPages - Whether to check for GitHub Pages for each repo (default: true)
 * @returns Promise resolving to array of ProjectData
 * 
 * @example
 * const projects = await fetchGitHubUserProjects("octocat", undefined, (repo) => ({
 *   featured: repo.stargazers_count > 100,
 * }));
 */
export const fetchGitHubUserProjects = async (
  username: string,
  token?: string,
  customDataPerRepo?: (repo: GitHubRepo) => Partial<import('@/projects/types').ProjectData>,
  options?: Parameters<typeof fetchGitHubUserRepos>[2],
  checkPages: boolean = false // Default to false to reduce API calls and avoid rate limits
): Promise<import('@/projects/types').ProjectData[]> => {
  // Fetch pinned repos first (if we have a token)
  const pinnedRepos = await fetchPinnedRepos(username, token);
  const pinnedReposSet = new Set(pinnedRepos.map(repo => repo.toLowerCase()));
  
  const repos = await fetchGitHubUserRepos(username, token, options);
  
  // Smart optimization: Only check GitHub Pages if:
  // 1. checkPages is explicitly enabled AND
  // 2. We have a token (to avoid hitting rate limits)
  // This prevents making 30+ additional API calls when unauthenticated
  const shouldCheckPages = checkPages && !!token;
  
  // Transform all repos in parallel for better performance
  // Note: If checkPages is true without a token, we skip it to avoid rate limits
  const projectPromises = repos.map(async (repo) => {
    const customData = customDataPerRepo ? customDataPerRepo(repo) : {};
    
    // Mark repo as pinned if it's in the pinned repos set
    const isPinned = pinnedReposSet.has(repo.full_name.toLowerCase());
    if (isPinned) {
      customData.githubIsPinned = true;
    }
    
    // Skip GitHub Pages check if repo already has a homepage
    const skipPagesCheck = !shouldCheckPages || !!repo.homepage || !!customData.liveUrl;
    // Enable fetchAdditionalStats to get commits, languages, etc.
    // These are public endpoints, so we can fetch without a token (but will be rate limited)
    // With a token, we get additional stats like contribution percentage and detailed file counts
    const shouldFetchAdditionalStats = true; // Always fetch basic stats (languages, commits)

    const project = await transformGitHubToProject(repo, customData, true, !skipPagesCheck, token, shouldFetchAdditionalStats);
    
    // Always count README lines for projects with githubUrl (regardless of liveUrl)
    // This allows filtering based on README content for all GitHub projects
    if (project.githubUrl) {
      const branchCandidates = buildReadmeBranchCandidates(repo.default_branch);
      try {
        const markdown = await fetchReadmeMarkdown(
          repo.full_name,
          branchCandidates[0],
          branchCandidates.slice(1)
        );
        const readmeAlphaLineCount = countAlphabeticLines(markdown);
        project.githubReadmeAlphaLineCount = readmeAlphaLineCount;
      } catch {
        // If README fetch fails, set count to 0 so it gets filtered by visibility check
        // (0 < MIN_README_ALPHA_LINES, so shouldHideProject will return true)
        project.githubReadmeAlphaLineCount = 0;
      }
    }
    
    return project;
  });
  
  const projects = (await Promise.all(projectPromises))
    .filter((p): p is import('@/projects/types').ProjectData => p !== null)
    .filter((project) => {
      if (shouldHideProject(project)) {
        return false;
      }
      
      const userCommits = getUserCommitCount(project as HasCommitStats);
      // Hide projects where the profiled user has 0 commits
      if (userCommits === 0) {
        return false;
      }
      return true;
    });
  
  // Sort: pinned repos first, then by updated date (most recent first)
  projects.sort((a, b) => {
    const aPinned = a.githubIsPinned ? 1 : 0;
    const bPinned = b.githubIsPinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned; // Pinned repos first
    }
    // For non-pinned or both pinned, sort by updated date
    const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
    const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
    return bDate - aDate; // Most recent first
  });
  
  return projects;
};

