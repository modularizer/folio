/**
 * Configurable Storage Driver
 * 
 * This driver accepts configuration data at runtime instead of
 * importing from static files. This is used for the bundle version
 * where config is passed via JavaScript.
 */

import type { IStorageDriver } from '@/types/storage-driver';
import type { UserProfile } from '@/user/profile';
import type { Project } from '@/types/project';

export interface ConfigurableStorageDriverConfig {
  profile: UserProfile;
  projects: Project[];
}

export class ConfigurableStorageDriver implements IStorageDriver {
  private config: ConfigurableStorageDriverConfig;

  constructor(config: ConfigurableStorageDriverConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // No initialization needed - data is already in memory
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }

  async getProfile(): Promise<UserProfile> {
    return this.config.profile;
  }

  async getProjects(): Promise<Project[]> {
    return this.config.projects;
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.config.projects.find(p => p.data.id === id) || null;
  }
}

