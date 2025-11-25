import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SoftwareProjectData } from '../types/SoftwareProjectData';
import { Language, Framework } from '../types/enums';
import { ProjectTag } from '../../types/enums';

interface SoftwareProjectPageProps {
  project: SoftwareProjectData;
  onBack: () => void;
}

/**
 * Software project page component.
 * 
 * Extends the base project page with software-specific information
 * like languages, frameworks, status, license, etc.
 */
export const SoftwareProjectPage: React.FC<SoftwareProjectPageProps> = ({
  project,
  onBack,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: screenWidth > 768 ? 40 : 20,
      paddingTop: 60,
      paddingBottom: 40,
    },
    backButton: {
      marginBottom: 24,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
    title: {
      fontSize: screenWidth > 768 ? 48 : 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    description: {
      fontSize: screenWidth > 768 ? 18 : 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: screenWidth > 768 ? 24 : 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    languagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    languageTag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    languageText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    frameworksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    frameworkTag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    frameworkText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      width: 120,
    },
    infoValue: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    linksContainer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 24,
    },
    link: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    linkText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.description}>{project.description}</Text>
      
      {project.languages && project.languages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.languagesContainer}>
            {project.languages.map((lang, index) => (
              <View key={index} style={styles.languageTag}>
                <Text style={styles.languageText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {project.frameworks && project.frameworks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frameworks</Text>
          <View style={styles.frameworksContainer}>
            {project.frameworks.map((framework, index) => (
              <View key={index} style={styles.frameworkTag}>
                <Text style={styles.frameworkText}>{framework}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>{project.status || 'N/A'}</Text>
        </View>
        {project.license && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License:</Text>
            <Text style={styles.infoValue}>{project.license}</Text>
          </View>
        )}
        {project.packageName && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Package:</Text>
            <Text style={styles.infoValue}>{project.packageName}</Text>
          </View>
        )}
        {project.linesOfCode && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lines of Code:</Text>
            <Text style={styles.infoValue}>{project.linesOfCode.toLocaleString()}</Text>
          </View>
        )}
      </View>
      
      {project.tags && project.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {project.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.linksContainer}>
        {project.githubUrl && (
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleLinkPress(project.githubUrl!)}
          >
            <Text style={styles.linkText}>GitHub</Text>
          </TouchableOpacity>
        )}
        {project.liveUrl && (
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleLinkPress(project.liveUrl!)}
          >
            <Text style={styles.linkText}>Live Demo</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

