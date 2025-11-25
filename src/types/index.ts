/**
 * Central export point for global types
 * 
 * Project-related types are now organized in the projects/ directory:
 * - Base types: @/projects/types
 * - Software types: @/projects/extensions/software/types
 * - App types: @/projects/extensions/software/extensions/app/types
 * - Package types: @/projects/extensions/software/extensions/package/types
 */

export * from './theme';
export * from './storage-driver';

// Re-export project types for convenience (deprecated - use @/projects/types)
export type { Project, ProjectData, IProjectBuilder, ProjectReason, ProjectType, ProjectTag } from '@/projects/types';

