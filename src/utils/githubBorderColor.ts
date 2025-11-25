import { ProjectData } from '@/projects/types';

/**
 * Calculate commit percentage for a GitHub project
 * 
 * Priority:
 * 1. Use githubContributionPercent or githubOwnerCommitsPercent if available
 * 2. If unknown, estimate from contributors (assuming equal contribution)
 * 3. If contributors unknown, use forked status:
 *    - If forked, assume 5 contributors (1/5 = 20%)
 *    - If not forked, assume 1 contributor (1/1 = 100%)
 */
export function calculateCommitPercentage(project: ProjectData): number {
  // Priority 1: Use actual commit percentage if available
  if (project.githubContributionPercent !== null && project.githubContributionPercent !== undefined) {
    return project.githubContributionPercent;
  }
  
  if (project.githubOwnerCommitsPercent !== null && project.githubOwnerCommitsPercent !== undefined) {
    return project.githubOwnerCommitsPercent;
  }
  
  // Priority 2: Estimate from contributors (assuming equal contribution)
  if (project.contributors !== undefined && project.contributors !== null && project.contributors > 0) {
    // If 1 contributor, 100%; 2 contributors, 50%; etc.
    return Math.round((1 / project.contributors) * 100);
  }
  
  // Priority 3: Use forked status
  if (project.githubIsFork) {
    // If forked, assume 5 contributors (1/5 = 20%)
    return 20;
  } else {
    // If not forked, assume 1 contributor (1/1 = 100%)
    return 100;
  }
}

/**
 * Get border color based on commit percentage and pinned status
 * 
 * Color scheme:
 * - >80% + pinned: Brightest gold (#f59e0b)
 * - >80% (not pinned): More dimmed gold (#d97706) - same as 50-80% range
 * - 50-80%: Dimmer gold (#ca6510)
 * - 20-50%: Dullish gold (#b45309)
 * - 5-20%: Muted color (#92400e)
 * - <5%: Grey (#6b7280)
 */
export function getBorderColorFromCommitPercentage(percentage: number, isPinned: boolean = false): string {
  if (percentage > 80) {
    if (isPinned) {
      return '#f59e0b'; // Brightest gold for pinned + >80%
    } else {
      return '#b45309'; // Much dimmer gold for non-pinned >80% (same as 20-50% range)
    }
  } else if (percentage >= 50) {
    return '#d97706'; // Dimmer gold
  } else if (percentage >= 20) {
    return '#b45309'; // Dullish gold
  } else if (percentage >= 5) {
    return '#92400e'; // Muted color
  } else {
    return '#6b7280'; // Grey
  }
}

/**
 * Get border color for a GitHub project based on commit percentage
 */
export function getGitHubProjectBorderColor(project: ProjectData): string {
  const percentage = calculateCommitPercentage(project);
  const isPinned = project.githubIsPinned === true;
  return getBorderColorFromCommitPercentage(percentage, isPinned);
}

