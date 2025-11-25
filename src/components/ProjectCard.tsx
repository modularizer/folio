import React, { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Project } from '@/projects/types';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { getProjectSlug } from '@/utils/slug';
import { cacheProjectData } from '@/utils/projectCache';

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
  const router = useRouter();
  const { layoutMode } = useCardLayout();

  const slug = getProjectSlug(project.data);

  useEffect(() => {
    cacheProjectData(project.data);
  }, [project.data]);

  const handlePress = useCallback(() => {
    router.push(`/${slug}`);
  }, [router, slug]);

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

