import React from 'react';
import { IProjectBuilder, CardLayoutMode } from '../../../types';
import { AppProjectData } from '../types/AppProjectData';
import { AppProjectCard } from '../components/AppProjectCard';
import { AppProjectPage } from '../components/AppProjectPage';

/**
 * App project builder.
 * 
 * Extends SoftwareProjectBuilder with app-specific rendering.
 * Uses AppProjectCard and AppProjectPage components.
 */
export class AppProjectBuilder implements IProjectBuilder {
  buildPreviewCard(
    project: AppProjectData, 
    onPress: () => void,
    layoutMode: CardLayoutMode = 'medium'
  ): React.ReactElement {
    return <AppProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
  }

  buildDetailPage(project: AppProjectData, onBack: () => void): React.ReactElement {
    return <AppProjectPage project={project} onBack={onBack} />;
  }
}

