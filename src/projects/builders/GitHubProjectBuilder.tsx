import React from 'react';
import { ProjectData, IProjectBuilder, CardLayoutMode } from '../types';
import { GitHubProjectCardRenderer } from '@/components/GitHubProjectCardRenderer';
import { BaseProjectPage } from '../components/BaseProjectPage';

/**
 * GitHub-specific implementation of IProjectBuilder.
 * 
 * Uses GitHubProjectCardRenderer to display GitHub-specific stats and information.
 * This builder should be used for projects that come from GitHub.
 */
export class GitHubProjectBuilder implements IProjectBuilder {
  buildPreviewCard(
    project: ProjectData, 
    onPress: () => void,
    layoutMode: CardLayoutMode = 'medium'
  ): React.ReactElement {
    return <GitHubProjectCardRenderer project={project} onPress={onPress} layoutMode={layoutMode} />;
  }

  buildDetailPage(project: ProjectData, onBack: () => void): React.ReactElement {
    return <BaseProjectPage project={project} onBack={onBack} />;
  }
}



