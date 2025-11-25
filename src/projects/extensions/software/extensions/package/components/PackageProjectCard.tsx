import React from 'react';
import { SoftwareProjectCard } from '../../../components/SoftwareProjectCard';
import { SoftwarePackageProjectData } from '../types/SoftwarePackageProjectData';

interface PackageProjectCardProps {
  project: SoftwarePackageProjectData;
  onPress: () => void;
}

/**
 * Package project card component.
 * 
 * Extends SoftwareProjectCard with package-specific information.
 */
export const PackageProjectCard: React.FC<PackageProjectCardProps> = ({
  project,
  onPress,
  layoutMode = 'medium',
}) => {
  return <SoftwareProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
};

