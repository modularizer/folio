import { ProjectData } from '@/projects/types';

const DEFAULT_SLUG = 'project';

const hasValue = (value?: string | null): value is string =>
  typeof value === 'string' && value.length > 0;

const deriveSlug = (project: ProjectData): string => {
  if (hasValue(project.slug)) {
    return project.slug;
  }
  if (hasValue(project.id)) {
    return project.id;
  }
  if (hasValue(project.title)) {
    return project.title;
  }
  return DEFAULT_SLUG;
};

/**
 * Ensure a project data object has a slug field populated.
 * Returns a new object if normalization is needed.
 */
export const ensureProjectSlug = <T extends ProjectData>(project: T): T => {
  const slug = deriveSlug(project);
  if (project.slug === slug && project.slug) {
    return project;
  }
  return {
    ...(project as ProjectData),
    slug,
  } as T;
};

/**
 * Convenience helper to read a slug from project data.
 */
export const getProjectSlug = (project: ProjectData): string => {
  return deriveSlug(project);
};
