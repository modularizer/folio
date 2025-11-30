import React, { useCallback, useEffect, useMemo } from 'react';
import { Project } from '@/projects/types';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { getProjectSlug } from '@/utils/slug';
import { cacheProjectData } from '@/utils/projectCache';
import { useRouter, usePathname } from 'expo-router';
import { navigateToPath as bundleNavigateToPath } from '@/utils/bundleNavigation';

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
    console.log('[ProjectCard] handlePress called:', { slug, pathname, projectId: project.data.id });
    
    // Check if we're in bundle mode (has __FOLIO_CONFIG__)
    const isBundleMode = typeof window !== 'undefined' && (window as any).__FOLIO_CONFIG__;
    
    // Ensure project is cached before navigation
    cacheProjectData(project.data).then(() => {
      console.log('[ProjectCard] Project cached, navigating to:', slug);
      
      // Check if we're on a username route (starts with @)
      // If so, construct the full path to preserve the username in the URL
      const currentPath = pathname || '/';
      const pathParts = currentPath.split('/').filter(p => p);
      
      let targetPath: string;
      if (pathParts.length > 0 && pathParts[0].startsWith('@')) {
        // We're on a username route, construct full path: /@username/project
        targetPath = `/${pathParts[0]}/${slug}`;
      } else {
        // Use relative navigation - append to current path
        targetPath = `./${slug}`;
      }
      
      if (isBundleMode) {
        // Use bundle navigation (history.pushState, no navigation event)
        console.log('[ProjectCard] Using bundle navigation to:', targetPath);
        bundleNavigateToPath(targetPath, false);
      } else {
        // Use expo-router navigation (normal navigation)
        console.log('[ProjectCard] Using expo-router navigation to:', targetPath);
        router.push(targetPath);
      }
    }).catch((error) => {
      console.error('[ProjectCard] Failed to cache project before navigation:', error);
      // Still try to navigate even if caching fails
      const currentPath = pathname || '/';
      const pathParts = currentPath.split('/').filter(p => p);
      const targetPath = pathParts.length > 0 && pathParts[0].startsWith('@')
        ? `/${pathParts[0]}/${slug}`
        : `./${slug}`;
      
      if (isBundleMode) {
        bundleNavigateToPath(targetPath, false);
      } else {
        router.push(targetPath);
      }
    });
  }, [slug, router, pathname, project.data]);

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

