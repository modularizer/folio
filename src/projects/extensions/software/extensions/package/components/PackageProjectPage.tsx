import React from 'react';
import { SoftwareProjectPage } from '../../../components/SoftwareProjectPage';
import { SoftwarePackageProjectData } from '../types/SoftwarePackageProjectData';

interface PackageProjectPageProps {
  project: SoftwarePackageProjectData;
  onBack: () => void;
}

/**
 * Package project page component.
 * 
 * Extends SoftwareProjectPage with package-specific information
 * like package name, downloads, registry URL, etc.
 */
export const PackageProjectPage: React.FC<PackageProjectPageProps> = ({
  project,
  onBack,
}) => {
  return <SoftwareProjectPage project={project} onBack={onBack} />;
};

