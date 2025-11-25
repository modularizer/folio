import { ProjectData } from './ProjectData';
import { IProjectBuilder } from './ProjectBuilder';

/**
 * Complete project definition including data and builder.
 */
export interface Project {
  data: ProjectData;
  builder: IProjectBuilder;
}

