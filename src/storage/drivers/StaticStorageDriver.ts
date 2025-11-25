import { IStorageDriver } from '@/types/storage-driver';
import { Project } from '@/projects/types';
import { UserProfile, userProfile as staticUserProfile } from '@/user/profile';
import { userProjects as staticUserProjects } from '@/user/projects';
import { ensureProjectSlug, getProjectSlug } from '@/utils/slug';

/**
 * Static storage driver.
 * 
 * This driver loads data from hardcoded TypeScript files.
 * Perfect for static site generation where all data is known at build time.
 * 
 * The data is loaded synchronously from static imports, but methods return
 * Promises to maintain consistency with other async drivers (database, API, etc.).
 */
export class StaticStorageDriver implements IStorageDriver {
  private projects: Project[] = [];
  private profile: UserProfile | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    // Load data synchronously from static imports
    this.profile = { ...staticUserProfile }; // Create a copy
    this.projects = staticUserProjects.map(project => ({
      ...project,
      data: ensureProjectSlug({ ...project.data }),
    }));
    this.initialized = true;
  }

  async getUserProfile(): Promise<UserProfile> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.profile) {
      throw new Error('User profile not loaded');
    }
    return { ...this.profile }; // Return a copy to prevent mutation
  }

  async getAllProjects(): Promise<Project[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    // Return a deep copy to prevent mutation
    return this.projects.map(project => ({
      ...project,
      data: { ...project.data },
    }));
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }
    const project = this.projects.find((project) => getProjectSlug(project.data) === slug);
    if (!project) {
      return undefined;
    }
    // Return a copy to prevent mutation
    return {
      ...project,
      data: { ...project.data },
    };
  }

  async getFeaturedProjects(): Promise<Project[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    // Return a deep copy to prevent mutation
    return this.projects
      .filter((project) => project.data.featured)
      .map(project => ({
        ...project,
        data: { ...project.data },
      }));
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for static data
    this.projects = [];
    this.profile = null;
    this.initialized = false;
  }
}

