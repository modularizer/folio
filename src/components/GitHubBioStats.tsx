import React from 'react';
import { IconLabel } from './IconLabel';
import { TimeRangeIconLabel } from './TimeRangeIconLabel';

interface GitHubBioStatsProps {
  followers?: number;
  following?: number;
  totalRepos?: number;
  totalStars?: number;
  totalForks?: number;
  totalCommits?: number;
  totalLinesOfCode?: number;
  earliestCommit?: string;
  latestUpdate?: string;
  /**
   * Font size for stats text (default: 12)
   */
  fontSize?: number;
  /**
   * Text color for stats (default: theme.colors.textSecondary)
   */
  textColor?: string;
  /**
   * Icon size (default: 14)
   */
  iconSize?: number;
}

/**
 * GitHub-specific bio stats component
 * Renders GitHub stats using IconLabel and TimeRangeIconLabel components
 */
export const GitHubBioStats: React.FC<GitHubBioStatsProps> = ({
  followers,
  following,
  totalRepos,
  totalStars,
  totalForks,
  totalCommits,
  totalLinesOfCode,
  earliestCommit,
  latestUpdate,
  fontSize,
  textColor,
  iconSize,
}) => {
  return (
    <>
      {followers !== undefined && (
        <IconLabel icon="people" label={`${followers.toLocaleString()} followers`} fontSize={fontSize} textColor={textColor} iconSize={iconSize} />
      )}
      {following !== undefined && (
        <IconLabel icon="person-add" label={`${following.toLocaleString()} following`} fontSize={fontSize} textColor={textColor} iconSize={iconSize} />
      )}
      {totalStars !== undefined && totalStars > 0 && (
        <IconLabel icon="star" label={`${totalStars.toLocaleString()} stars`} fontSize={fontSize} textColor={textColor} iconSize={iconSize} />
      )}
      {totalForks !== undefined && totalForks > 0 && (
        <IconLabel icon="git-branch" label={`${totalForks.toLocaleString()} forks`} fontSize={fontSize} textColor={textColor} iconSize={iconSize} />
      )}
      {totalCommits !== undefined && totalCommits > 0 && (
        <IconLabel icon="code-working" label={`${totalCommits.toLocaleString()} commits`} fontSize={fontSize} textColor={textColor} iconSize={iconSize} />
      )}
      {earliestCommit && latestUpdate && (
        <TimeRangeIconLabel 
          startDate={earliestCommit} 
          endDate={latestUpdate}
          fontSize={fontSize}
          textColor={textColor}
          iconSize={iconSize}
        />
      )}
    </>
  );
};

