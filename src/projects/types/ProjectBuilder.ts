import React from 'react';
import { ProjectData } from './ProjectData';
import { CardLayoutMode } from './CardConfig';

/**
 * Abstract interface for building project UI components.
 * Each project should implement this interface to provide
 * custom rendering for preview cards and detail pages.
 */
export interface IProjectBuilder {
  /**
   * Builds a preview card component for the project.
   * This is displayed in the portfolio grid on the home page.
   * 
   * @param project - The project data
   * @param onPress - Callback when the card is pressed
   * @param layoutMode - Current layout mode (list, small, medium, large)
   * @returns React component for the preview card
   */
  buildPreviewCard(
    project: ProjectData, 
    onPress: () => void,
    layoutMode?: CardLayoutMode
  ): React.ReactElement;

  /**
   * Builds the full detail page component for the project.
   * This is displayed when navigating to the project detail page.
   * 
   * @param project - The project data
   * @param onBack - Callback when back button is pressed
   * @returns React component for the detail page
   */
  buildDetailPage(project: ProjectData, onBack: () => void): React.ReactElement;
}

