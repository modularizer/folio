import React from 'react';
import { IProjectBuilder, CardLayoutMode } from '../../../types';
import { SoftwarePackageProjectData } from '../types/SoftwarePackageProjectData';
import { PackageProjectCard } from '../components/PackageProjectCard';
import { PackageProjectPage } from '../components/PackageProjectPage';

/**
 * Package project builder.
 * 
 * Extends SoftwareProjectBuilder with package-specific rendering.
 * Uses PackageProjectCard and PackageProjectPage components.
 */
export class PackageProjectBuilder implements IProjectBuilder {
  buildPreviewCard(
    project: SoftwarePackageProjectData, 
    onPress: () => void,
    layoutMode: CardLayoutMode = 'medium'
  ): React.ReactElement {
    return <PackageProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
  }

  buildDetailPage(project: SoftwarePackageProjectData, onBack: () => void): React.ReactElement {
    return <PackageProjectPage project={project} onBack={onBack} />;
  }
}

