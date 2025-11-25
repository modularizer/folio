import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SoftwareProjectPage } from '../../../components/SoftwareProjectPage';
import { AppProjectData } from '../types/AppProjectData';

interface AppProjectPageProps {
  project: AppProjectData;
  onBack: () => void;
}

/**
 * App project page component.
 * 
 * Extends SoftwareProjectPage with app-specific information
 * like platforms, app store links, downloads, etc.
 */
export const AppProjectPage: React.FC<AppProjectPageProps> = ({
  project,
  onBack,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // For now, use SoftwareProjectPage as base
  // Can be extended with app-specific sections
  return <SoftwareProjectPage project={project} onBack={onBack} />;
};

