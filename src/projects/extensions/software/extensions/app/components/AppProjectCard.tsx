import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SoftwareProjectCard } from '../../../components/SoftwareProjectCard';
import { AppProjectData } from '../types/AppProjectData';
import { CardLayoutMode } from '../../../../types/CardConfig';

interface AppProjectCardProps {
  project: AppProjectData;
  onPress: () => void;
  layoutMode?: CardLayoutMode;
}

/**
 * App project card component.
 * 
 * Extends SoftwareProjectCard with app-specific information
 * like platforms and download counts.
 */
export const AppProjectCard: React.FC<AppProjectCardProps> = ({
  project,
  onPress,
  layoutMode = 'medium',
}) => {
  // Use SoftwareProjectCard as base and add app-specific enhancements
  return <SoftwareProjectCard project={project} onPress={onPress} layoutMode={layoutMode} />;
};

