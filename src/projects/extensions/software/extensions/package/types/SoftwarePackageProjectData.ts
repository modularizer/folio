import { SoftwareProjectData } from '../../../types/SoftwareProjectData';

/**
 * Software package project data.
 * 
 * Extends SoftwareProjectData for published packages/libraries
 * (npm packages, pip packages, etc.).
 */
export interface SoftwarePackageProjectData extends SoftwareProjectData {
  template: 'SoftwarePackage';
  
  /**
   * Package name (required for packages)
   */
  packageName: string;
  
  /**
   * Package manager (required for packages)
   */
  packageManager: 'npm' | 'pip' | 'cargo' | 'maven' | 'gradle' | 'nuget' | 'pub' | 'other';
  
  /**
   * Package version
   */
  version?: string;
  
  /**
   * Number of downloads (if available)
   */
  downloads?: number;
  
  /**
   * Package registry URL
   */
  registryUrl?: string;
  
  /**
   * Whether the package is published
   */
  published?: boolean;
}

