import React from 'react';
import { ProjectData, IProjectBuilder, CardLayoutMode } from '../types';
import { BaseProjectCard } from '../components/BaseProjectCard';
import { BaseProjectPage } from '../components/BaseProjectPage';

/**
 * Base implementation of IProjectBuilder.
 * 
 * Provides default rendering using BaseProjectCard and BaseProjectPage.
 * Extended by SoftwareProjectBuilder, AppProjectBuilder, etc.
 */
export class BaseProjectBuilder implements IProjectBuilder {
  buildPreviewCard(
    project: ProjectData, 
    onPress: () => void,
    layoutMode: CardLayoutMode = 'medium'
  ): React.ReactElement {
    return <BaseProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
  }

  buildDetailPage(project: ProjectData, onBack: () => void): React.ReactElement {
    return <BaseProjectPage project={project} onBack={onBack} />;
  }
}

