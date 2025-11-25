const readmeCache = new Map<string, string>();
const readmePromises = new Map<string, Promise<string>>();

const normalizeBranch = (branch?: string | null): string | undefined => {
  if (!branch) return undefined;
  return branch.replace(/^refs\/heads\//, '').trim();
};

export const buildReadmeUrl = (repoPath: string, branch: string): string => {
  const [owner, repo] = repoPath.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repo path: ${repoPath}`);
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/README.md`;
};

const fetchWithCache = (url: string): Promise<string> => {
  if (readmeCache.has(url)) {
    return Promise.resolve(readmeCache.get(url)!);
  }

  if (readmePromises.has(url)) {
    return readmePromises.get(url)!;
  }

  const promise = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch README (${response.status})`);
    }
    const markdown = await response.text();
    readmeCache.set(url, markdown);
    readmePromises.delete(url);
    return markdown;
  }).catch((error) => {
    readmePromises.delete(url);
    throw error;
  });

  readmePromises.set(url, promise);
  return promise;
};

const unique = <T,>(items: T[]): T[] => {
  return Array.from(new Set(items));
};

export const buildReadmeBranchCandidates = (primaryBranch?: string | null): string[] => {
  const normalizedPrimary = normalizeBranch(primaryBranch);
  const candidates = [
    normalizedPrimary || 'master',
    'main',
    'master',
  ].filter(Boolean) as string[];

  return unique(candidates);
};

export const fetchReadmeWithCache = async (candidateUrls: string[]): Promise<string> => {
  let lastError: unknown = null;
  for (const url of candidateUrls) {
    try {
      return await fetchWithCache(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Failed to fetch README');
};

export const fetchReadmeMarkdown = async (
  repoPath: string,
  primaryBranch: string,
  fallbackBranches: string[] = [],
): Promise<string> => {
  const candidates = unique([
    normalizeBranch(primaryBranch) || 'master',
    ...fallbackBranches.map(normalizeBranch).filter(Boolean) as string[],
  ]);
  if (candidates.length === 0) {
    throw new Error('No branches provided for README fetch');
  }
  const urls = candidates.map((branch) => buildReadmeUrl(repoPath, branch));
  return fetchReadmeWithCache(urls);
};

export const countAlphabeticLines = (markdown: string): number => {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /[a-zA-Z]/.test(line))
    .length;
};

