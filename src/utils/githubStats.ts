export interface HasCommitStats {
  githubOwnerCommitsCount?: number | null;
  githubCommitsCount?: number | null;
  githubOwnerCommitsPercent?: number | null;
}

/**
 * Derive the number of commits authored by the profiled user.
 * Prefers explicit owner commit counts, then falls back to total * percent.
 */
export const getUserCommitCount = (data: HasCommitStats | null | undefined): number | null => {
  if (!data) {
    return null;
  }

  if (typeof data.githubOwnerCommitsCount === 'number') {
    return data.githubOwnerCommitsCount;
  }

  const totalCommits = data.githubCommitsCount;
  const ownerPercent = data.githubOwnerCommitsPercent;

  if (typeof totalCommits === 'number' && typeof ownerPercent === 'number') {
    return Math.round(totalCommits * (ownerPercent / 100));
  }

  return null;
};

