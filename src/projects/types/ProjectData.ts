import { ProjectReason, ProjectType } from './enums';
import { CardConfig } from './CardConfig';
import { FilterCondition } from 'tsfiltor';

/**
 * JSON data structure for a project.
 * This contains all the static data about a project.
 */
export interface ProjectData {
  /**
   * Route slug (used verbatim in /[project] URL).
   * If omitted, falls back to the project's id (or title) without modification.
   */
  slug?: string;
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  /**
   * URL to a description page or documentation to show at the bottom of the project detail page.
   * If provided, this will be shown as a LiveUrlPreview instead of the README.
   * Useful for non-GitHub projects that have documentation elsewhere.
   */
  descriptionUrl?: string;
  /**
   * URL to a README or markdown content to show at the bottom of the project detail page.
   * If provided, this will be shown as a LiveUrlPreview instead of the README.
   * Alternative to descriptionUrl - both can be provided, descriptionUrl takes precedence.
   */
  readmeUrl?: string;
  tags: string[];
  featured?: boolean;
  
  /**
   * Project creation or completion date (legacy field)
   * Format: ISO 8601 date string (YYYY-MM-DD) or full datetime
   * @deprecated Use startDate and endDate instead
   */
  date?: string;
  
  /**
   * Project start date
   * Format: ISO 8601 date string (YYYY-MM-DD)
   */
  startDate?: string;
  
  /**
   * Project end date (or current date if still active)
   * Format: ISO 8601 date string (YYYY-MM-DD)
   */
  endDate?: string;
  
  /**
   * Total number of hours worked on the project
   * Can be approximate
   */
  hoursWorked?: number;
  
  /**
   * Number of contributors to the project
   * Default: 1 (just you)
   */
  contributors?: number;
  
  /**
   * Project reason/purpose
   * Why this project was created
   */
  reason?: ProjectReason;
  
  /**
   * Project type/category
   * Work, personal, business venture, etc.
   */
  projectType?: ProjectType;
  
  /**
   * Project rating (1-5 stars, or 0-10 scale)
   * Optional rating for personal assessment
   */
  rating?: number;
  
  /**
   * Template name for project extension/type.
   * Examples: 'App', 'SoftwarePackage', 'Library', 'Base' (default)
   * Used to determine which builder/component to use for rendering.
   * If not specified, uses 'Base' template.
   */
  template?: string;
  
  /**
   * Card layout configuration
   * Allows per-project customization of card dimensions and layout
   */
  cardConfig?: CardConfig;

  /**
   * Number of README lines that contain alphabetic characters.
   * Computed during GitHub sync to measure README substance.
   */
  githubReadmeAlphaLineCount?: number;

  /**
   * Monthly commit history (used for activity charts).
   * Each bucket represents YYYY-MM with total commits and commits authored by the owner.
   */
  githubCommitsHistory?: Array<{
    bucket: string;
    total: number;
    owner: number;
  }>;
  
  /**
   * Hide rules expressed as tsfiltor conditions or predicate functions.
   * When any condition evaluates to true, the project will be excluded from grids/lists.
   * Accepts a single condition or an array for OR-style checks.
   */
  hideWhen?: FilterCondition | FilterCondition[] | ((project: ProjectData) => boolean) | Array<(project: ProjectData) => boolean>;
  
  // Allow additional custom fields for specific projects
  [key: string]: unknown;
}

