import { ProjectData } from '@/projects/types/ProjectData';
import { Language, Framework } from './enums';
import { ProjectTag } from '@/projects/types/enums';

/**
 * Base software project data interface.
 * 
 * This interface extends ProjectData with software-specific fields
 * like languages, frameworks, and categorized tags.
 */
export interface SoftwareProjectData extends ProjectData {
  /**
   * Template name for this software project type.
   * Examples: 'App', 'SoftwarePackage', 'Library', etc.
   * Used to determine which builder/component to use.
   */
  template: string;
  
  /**
   * Primary and secondary programming languages used
   */
  languages: Language[];
  
  /**
   * Frameworks and libraries used
   */
  frameworks?: Framework[];
  
  /**
   * Categorized tags using ProjectTag enum
   * Can be combined with custom string tags
   */
  categorizedTags?: ProjectTag[];
  
  /**
   * Lines of code (optional, approximate)
   */
  linesOfCode?: number;
  
  /**
   * Project status
   */
  status?: 'active' | 'completed' | 'archived' | 'maintenance';
  
  /**
   * License type (if open source)
   */
  license?: string;
  
  /**
   * Package manager or registry (npm, pip, etc.)
   */
  packageManager?: 'npm' | 'pip' | 'cargo' | 'maven' | 'gradle' | 'nuget' | 'pub' | 'other';
  
  /**
   * Package name (if published)
   */
  packageName?: string;
}

