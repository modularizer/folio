import { ProjectData } from '@/projects/types';
import { getCache, setCache, CACHE_TTL } from './cache';

type CacheKeyKind = 'slug' | 'id';

const memoryCache = new Map<string, ProjectData>();

const createKey = (kind: CacheKeyKind, value: string) => {
  return `project:${kind}:${value}`;
};

const setMemoryCache = (key: string, project: ProjectData) => {
  memoryCache.set(key, project);
};

const getMemoryCache = (key: string): ProjectData | undefined => {
  return memoryCache.get(key);
};

const persistProject = async (key: string, project: ProjectData) => {
  try {
    await setCache(key, project, CACHE_TTL.MEDIUM);
  } catch (error) {
    console.warn('[projectCache] Failed to persist project data:', error);
  }
};

const readPersistedProject = async (key: string): Promise<ProjectData | null> => {
  try {
    const cached = await getCache<ProjectData>(key);
    if (cached) {
      setMemoryCache(key, cached);
      return cached;
    }
  } catch (error) {
    console.warn('[projectCache] Failed to read cached project data:', error);
  }
  return null;
};

/**
 * Cache project data for quick lookup by slug or id.
 * Stores the data in memory for fast reuse and persists it via IndexedDB for reloads.
 */
export const cacheProjectData = async (project: ProjectData) => {
  if (!project) return;

  const tasks: Promise<void>[] = [];

  if (project.slug) {
    const slugKey = createKey('slug', project.slug);
    setMemoryCache(slugKey, project);
    tasks.push(persistProject(slugKey, project));
  }

  if (project.id) {
    const idKey = createKey('id', project.id);
    setMemoryCache(idKey, project);
    tasks.push(persistProject(idKey, project));
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
};

const getProjectByKey = async (kind: CacheKeyKind, value?: string | null): Promise<ProjectData | null> => {
  if (!value) {
    return null;
  }
  const key = createKey(kind, value);
  const memoryHit = getMemoryCache(key);
  if (memoryHit) {
    return memoryHit;
  }
  return readPersistedProject(key);
};

/**
 * Retrieve cached project data.
 * Tries slug first (if provided), then id.
 */
export const getCachedProjectData = async (options: { slug?: string | null; id?: string | null }): Promise<ProjectData | null> => {
  const { slug, id } = options;

  const slugHit = await getProjectByKey('slug', slug);
  if (slugHit) {
    return slugHit;
  }

  return getProjectByKey('id', id);
};

export const getCachedProjectDataBySlug = async (slug: string): Promise<ProjectData | null> => {
  return getProjectByKey('slug', slug);
};

export const getCachedProjectDataById = async (id: string): Promise<ProjectData | null> => {
  return getProjectByKey('id', id);
};

