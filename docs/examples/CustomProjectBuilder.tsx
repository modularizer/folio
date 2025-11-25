/**
 * Example: Custom Project Builder
 * 
 * This file demonstrates how to create a custom project builder
 * that extends the base functionality with custom styling and components.
 * 
 * To use this as a template:
 * 1. Copy this file to your own project extension folder
 * 2. Rename the class and components
 * 3. Customize the styling and layout
 * 4. Import and use in your user/projects.ts
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ProjectData, IProjectBuilder } from '@/projects/types';
import { BaseProjectBuilder } from '@/projects';

/**
 * Example custom project builder.
 * This demonstrates how to create a custom builder that extends the base functionality.
 */
export class ExampleProjectBuilder extends BaseProjectBuilder implements IProjectBuilder {
  // Override preview card with custom styling
  buildPreviewCard(project: ProjectData, onPress: () => void): React.ReactElement {
    return <CustomPreviewCard project={project} onPress={onPress} />;
  }

  // Override detail page with additional content
  buildDetailPage(project: ProjectData, onBack: () => void): React.ReactElement {
    return <CustomDetailPage project={project} onBack={onBack} />;
  }
}

// Custom Preview Card
interface CustomPreviewCardProps {
  project: ProjectData;
  onPress: () => void;
}

const CustomPreviewCard: React.FC<CustomPreviewCardProps> = ({ project, onPress }) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 768;
  const cardWidth = isTablet ? (screenWidth - 100) / 3 : screenWidth - 40;

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    imageContainer: {
      width: '100%',
      height: 220,
      backgroundColor: theme.colors.surface,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.textSecondary,
      marginBottom: 14,
      lineHeight: 22,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {project.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: project.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {project.description}
        </Text>
        <View style={styles.tagsContainer}>
          {project.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Detail Page
interface CustomDetailPageProps {
  project: ProjectData;
  onBack: () => void;
}

const CustomDetailPage: React.FC<CustomDetailPageProps> = ({ project, onBack }) => {
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
      fontSize: screenWidth > 768 ? 52 : 36,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    description: {
      fontSize: screenWidth > 768 ? 20 : 18,
      color: theme.colors.textSecondary,
      lineHeight: 28,
      marginBottom: 32,
    },
    linksContainer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 24,
    },
    link: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    linkText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 20,
    },
    tag: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
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
      <View style={styles.tagsContainer}>
        {project.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.linksContainer}>
        {project.githubUrl && (
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleLinkPress(project.githubUrl!)}
          >
            <Text style={styles.linkText}>View on GitHub</Text>
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
      {/* Add custom sections here for this specific project */}
    </ScrollView>
  );
};

