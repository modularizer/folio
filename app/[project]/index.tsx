import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { storageManager } from '@/storage';
import { Project } from '@/projects/types';
import { getCachedProjectDataBySlug } from '@/utils/projectCache';
import { getBuilderForProject } from '@/projects/builders';
import { GitHubUserPage } from '@/components';

export default function ProjectDetailScreen() {
  const { project: projectSlug } = useLocalSearchParams<{ project: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // If the "project" parameter starts with @, it's actually a username route
  // Redirect to GitHub user page
  if (projectSlug && projectSlug.startsWith('@')) {
    const username = projectSlug.slice(1); // Remove @
    console.log('[ProjectDetailScreen] Detected @username route, redirecting to GitHub user page:', username);
    return <GitHubUserPage username={username} />;
  }

  useEffect(() => {
    const loadProject = async () => {
      if (!projectSlug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Ensure StorageManager is initialized before accessing it
        // If it's already initialized, this will return immediately
        await storageManager.initialize();
        let loadedProject = await storageManager.getProjectBySlug(projectSlug);

        if (!loadedProject) {
          const cachedData = await getCachedProjectDataBySlug(projectSlug);
          if (cachedData) {
            const builder = getBuilderForProject(cachedData);
            loadedProject = {
              data: cachedData,
              builder,
            };
          }
        }

        setProject(loadedProject);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectSlug]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    // Use relative navigation to go back to parent directory
    // This works whether we're at /:project or /@username/:project
    router.push('../');
  };

  // Use the project's builder to render the detail page
  const detailPage = project.builder.buildDetailPage(project.data, handleBack);

  // On web, the background is set on the body element, so we don't need BackgroundWrapper
  // Just render the content with transparent background
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {detailPage}
      </View>
    );
  }

  // For native platforms, use BackgroundWrapper
  return (
    <BackgroundWrapper 
      background={theme.background} 
      style={styles.container}
      overlayOpacity={0}
    >
      {detailPage}
    </BackgroundWrapper>
  );
}

