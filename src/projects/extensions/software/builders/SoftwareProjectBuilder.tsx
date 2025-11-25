import React from 'react';
import { IProjectBuilder, CardLayoutMode } from '../../types';
import { SoftwareProjectData } from '../types/SoftwareProjectData';
import { SoftwareProjectCard } from '../components/SoftwareProjectCard';
import { SoftwareProjectPage } from '../components/SoftwareProjectPage';

/**
 * Software project builder.
 * 
 * Extends BaseProjectBuilder with software-specific rendering.
 * Uses SoftwareProjectCard and SoftwareProjectPage components.
 */
export class SoftwareProjectBuilder implements IProjectBuilder {
  buildPreviewCard(
    project: SoftwareProjectData, 
    onPress: () => void,
    layoutMode: CardLayoutMode = 'medium'
  ): React.ReactElement {
    return <SoftwareProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
  }

  buildDetailPage(project: SoftwareProjectData, onBack: () => void): React.ReactElement {
    return <SoftwareProjectPage project={project} onBack={onBack} />;
  }
}

