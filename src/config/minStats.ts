type SupportedStat =
  | 'githubStars'
  | 'githubForks'
  | 'githubCommits'
  | 'githubContributionPercent'
  | 'githubOwnerCommitsPercent'
  | 'githubFilesCount'
  | 'githubLinesOfCode'
  | 'githubOpenIssues'
  | 'githubWatchers';

export const MIN_STATS: Record<SupportedStat, number> = {
  githubStars: 1,
  githubForks: 1,
  githubCommits: 1,
  githubContributionPercent: 1,
  githubOwnerCommitsPercent: 1,
  githubFilesCount: 1,
  githubLinesOfCode: 1,
  githubOpenIssues: 1,
  githubWatchers: 1,
};

export const meetsMinStat = (
  value: number | null | undefined,
  stat: SupportedStat,
): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  return value >= MIN_STATS[stat];
};

