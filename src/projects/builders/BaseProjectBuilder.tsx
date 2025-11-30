import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectData, IProjectBuilder, CardLayoutMode } from '../types';
import { BaseProjectCard } from '../components/BaseProjectCard';
import { BaseProjectPage } from '../components/BaseProjectPage';
import { useTheme } from '@/contexts/ThemeContext';
import { TimeRangeIconLabel } from '@/components/TimeRangeIconLabel';

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
    // Render bottom content with date range if available
    const renderBottomContent = (styles: any) => {
      if (!project.startDate && !project.endDate) {
        return null;
      }
      
      return <DateRangeBottomContent project={project} layoutMode={layoutMode} />;
    };
    
    return (
      <BaseProjectCard 
        project={project} 
        onPress={onPress} 
        layoutMode={layoutMode}
        renderBottomContent={renderBottomContent}
      />
    );
  }

  buildDetailPage(project: ProjectData, onBack: () => void): React.ReactElement {
    return <BaseProjectPage project={project} onBack={onBack} />;
  }
}

/**
 * Component to render date range in bottom content of project card
 */
const DateRangeBottomContent: React.FC<{ project: ProjectData; layoutMode: CardLayoutMode }> = ({ 
  project, 
  layoutMode 
}) => {
  const { theme } = useTheme();
  
  // Use startDate/endDate if available, otherwise fall back to date (legacy)
  const startDate = project.startDate || project.date;
  const endDate = project.endDate || project.date;
  
  if (!startDate && !endDate) {
    return null;
  }
  
  // If only one date, use it for both
  const effectiveStartDate = startDate || endDate;
  const effectiveEndDate = endDate || startDate;
  
  if (!effectiveStartDate || !effectiveEndDate) {
    return null;
  }
  
  const styles = StyleSheet.create({
    bottomContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
  });
  
  return (
    <View style={styles.bottomContent}>
      <TimeRangeIconLabel
        startDate={effectiveStartDate}
        endDate={effectiveEndDate}
        iconSize={14}
        fontSize={12}
      />
    </View>
  );
};

