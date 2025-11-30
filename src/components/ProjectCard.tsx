import React, { useCallback, useEffect, useMemo } from 'react';
import { Project } from '@/projects/types';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { getProjectSlug } from '@/utils/slug';
import { cacheProjectData } from '@/utils/projectCache';
import { useRouter, usePathname } from 'expo-router';

interface ProjectCardProps {
  project: Project;
}

/**
 * ProjectCard component that uses the project's builder to render the preview card.
 * 
 * This component delegates rendering to the project's custom builder.
 * The builder is determined by the project's template field, or defaults to BaseProjectBuilder.
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { layoutMode } = useCardLayout();
  const router = useRouter();
  const pathname = usePathname();

  const slug = getProjectSlug(project.data);

  useEffect(() => {
    cacheProjectData(project.data);
  }, [project.data]);

  const handlePress = useCallback(() => {
    // Check if we're on a username route (starts with @)
    // If so, construct the full path to preserve the username in the URL
    const currentPath = pathname || '/';
    const pathParts = currentPath.split('/').filter(p => p);
    
    // If we're on a username route (e.g., /@modularizer), append the project slug
    // Otherwise, use relative navigation
    if (pathParts.length > 0 && pathParts[0].startsWith('@')) {
      // We're on a username route, construct full path: /@username/project
      router.push(`/${pathParts[0]}/${slug}`);
    } else {
      // Use relative navigation - append to current path
      router.push(`./${slug}`);
    }
  }, [slug, router, pathname]);

  // Memoize the card to prevent re-renders when props haven't changed
  const card = useMemo(() => {
    return project.builder.buildPreviewCard(project.data, handlePress, layoutMode);
  }, [project.builder, project.data, handlePress, layoutMode]);

  return card;
};

// Memoize the component to prevent re-renders when props haven't changed
export default React.memo(ProjectCard, (prevProps, nextProps) => {
  // Only re-render if the project data actually changed
  return (
    getProjectSlug(prevProps.project.data) === getProjectSlug(nextProps.project.data) &&
    prevProps.project.data === nextProps.project.data &&
    prevProps.project.builder === nextProps.project.builder
  );
});

