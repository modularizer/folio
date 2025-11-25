import { SoftwareProjectData } from '../../../types/SoftwareProjectData';

/**
 * App project data.
 * 
 * Extends SoftwareProjectData for application projects
 * (web apps, mobile apps, desktop apps).
 */
export interface AppProjectData extends SoftwareProjectData {
  template: 'App';
  
  /**
   * App platform(s)
   */
  platforms?: ('web' | 'ios' | 'android' | 'desktop' | 'all')[];
  
  /**
   * App store links (if published)
   */
  appStoreUrl?: string;
  playStoreUrl?: string;
  
  /**
   * Number of downloads/users (if available)
   */
  downloads?: number;
  users?: number;
  
  /**
   * App version
   */
  version?: string;
}

