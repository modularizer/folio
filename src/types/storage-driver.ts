import { Project } from './project';
import { UserProfile } from '../user/profile';

/**
 * Abstract interface for data storage drivers.
 * 
 * This allows the application to work with different data sources:
 * - Static/hardcoded data (current implementation)
 * - Database (future)
 * - API endpoints (future)
 * - File system (future)
 * - etc.
 * 
 * Implement this interface to create a new storage driver.
 */
export interface IStorageDriver {
  /**
   * Get the user profile information.
   * @returns Promise resolving to the user profile
   */
  getUserProfile(): Promise<UserProfile>;

  /**
   * Get all projects.
   * @returns Promise resolving to an array of projects
   */
  getAllProjects(): Promise<Project[]>;

  /**
   * Get a project by its slug.
   * @param slug - The project slug (URL segment)
   * @returns Promise resolving to the project, or undefined if not found
   */
  getProjectBySlug(slug: string): Promise<Project | undefined>;

  /**
   * Get all featured projects.
   * @returns Promise resolving to an array of featured projects
   */
  getFeaturedProjects(): Promise<Project[]>;

  /**
   * Optional: Initialize the driver (e.g., connect to database, load config)
   * @returns Promise that resolves when initialization is complete
   */
  initialize?(): Promise<void>;

  /**
   * Optional: Cleanup resources (e.g., close database connections)
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup?(): Promise<void>;
}

