import { ProjectData, IProjectBuilder } from '../types';
import { BaseProjectBuilder } from './BaseProjectBuilder';
import { GitHubProjectBuilder } from './GitHubProjectBuilder';
import { SoftwareProjectBuilder } from '../extensions/software/builders/SoftwareProjectBuilder';
import { AppProjectBuilder } from '../extensions/software/extensions/app/builders/AppProjectBuilder';
import { PackageProjectBuilder } from '../extensions/software/extensions/package/builders/PackageProjectBuilder';

type TemplateKey = 'GitHub' | 'Software' | 'App' | 'SoftwarePackage' | 'Base';

const builderSingletons: Record<TemplateKey, IProjectBuilder> = {
  Base: new BaseProjectBuilder(),
  GitHub: new GitHubProjectBuilder(),
  Software: new SoftwareProjectBuilder(),
  App: new AppProjectBuilder(),
  SoftwarePackage: new PackageProjectBuilder(),
};

const getTemplateKey = (template?: string): TemplateKey => {
  switch (template) {
    case 'GitHub':
      return 'GitHub';
    case 'Software':
      return 'Software';
    case 'App':
      return 'App';
    case 'SoftwarePackage':
      return 'SoftwarePackage';
    default:
      return 'Base';
  }
};

/**
 * Resolve an appropriate builder instance for the provided project data.
 */
export const getBuilderForProject = (project: ProjectData): IProjectBuilder => {
  const templateKey = getTemplateKey(project.template);
  return builderSingletons[templateKey];
};

