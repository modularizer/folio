import { evaluateCondition, FilterCondition } from 'tsfiltor';
import { ProjectData } from '../types/ProjectData';

type HideCondition = FilterCondition | ((project: ProjectData) => boolean);
const MIN_README_ALPHA_LINES = 2;

const toArray = (conditions: HideCondition | HideCondition[]): HideCondition[] => {
  if (!conditions) {
    return [];
  }
  return Array.isArray(conditions) ? conditions : [conditions];
};

const evaluateHideCondition = (project: ProjectData, condition: HideCondition): boolean => {
  if (typeof condition === 'function') {
    return condition(project);
  }
  try {
    return evaluateCondition(project, condition);
  } catch (error) {
    console.warn('[visibility] Failed to evaluate hide condition', {
      projectId: project.id,
      error,
    });
    return false;
  }
};

/**
 * Determine whether a project should be hidden based on its hideWhen config.
 */
export const shouldHideProject = (project?: ProjectData | null): boolean => {
  if (
    typeof project?.githubReadmeAlphaLineCount === 'number' &&
    project.githubReadmeAlphaLineCount < MIN_README_ALPHA_LINES
  ) {
    console.log('[Visibility] Hiding project due to README alpha lines', {
      projectId: project?.id,
      lineCount: project?.githubReadmeAlphaLineCount,
    });
    return true;
  }

  if (!project || !project.hideWhen) {
    return false;
  }

  const conditions = toArray(project.hideWhen as HideCondition | HideCondition[]);
  if (conditions.length === 0) {
    return false;
  }

  return conditions.some((condition) => evaluateHideCondition(project, condition));
};

