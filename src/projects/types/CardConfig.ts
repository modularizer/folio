/**
 * Card layout configuration
 * Allows per-project customization of card dimensions and layout
 */
export interface CardConfig {
  /**
   * Minimum number of columns this card should span
   * Default: 1
   */
  minColumns?: number;
  
  /**
   * Maximum number of columns this card should span
   * Default: unlimited
   */
  maxColumns?: number;
  
  /**
   * Minimum card width in pixels
   * Default: auto (based on columns)
   */
  minWidth?: number;
  
  /**
   * Maximum card width in pixels
   * Default: auto (based on columns)
   */
  maxWidth?: number;
  
  /**
   * Fixed card height in pixels
   * If not set, height is determined by content
   */
  height?: number;
  
  /**
   * Minimum card height in pixels
   * Default: auto
   */
  minHeight?: number;
  
  /**
   * Maximum card height in pixels
   * Default: auto
   */
  maxHeight?: number;
  
  /**
   * Aspect ratio (width / height)
   * Examples: 16/9, 4/3, 1/1
   * If set, card height will be calculated from width
   */
  aspectRatio?: number;
}

/**
 * Card layout mode
 * Determines the overall size and style of cards
 */
export type CardLayoutMode = 'list' | 'small' | 'medium' | 'large';

/**
 * Default card configurations for each layout mode
 */
export const defaultCardConfigs: Record<CardLayoutMode, {
  columns: number;
  cardWidth: number;
  imageHeight: number;
  cardHeight: number; // Standardized height for all cards
  minWidth?: number; // Minimum card width (±15% range)
  maxWidth?: number; // Maximum card width (±15% range)
    minGap?: number;
    maxGap?: number;
    targetGap?: number;
    verticalGap?: number;
  fontSize: {
    title: number;
    description: number;
  };
}> = {
  list: {
    columns: 1,
    cardWidth: 0, // Full width
    imageHeight: 120,
      verticalGap: 10,
    cardHeight: 95, // Reduced height for list mode
    fontSize: {
      title: 18,
      description: 14,
    },
  },
  small: {
    columns: 4,
    cardWidth: 0, // Calculated from columns
    imageHeight: 160,
    cardHeight: 300, // Reduced height
    minWidth: 280,
    maxWidth: 500,
      minGap: 35,
      maxGap: 60,
      targetGap: 40,
      verticalGap: 20,
    fontSize: {
      title: 16,
      description: 12,
    },
  },
  medium: {
    columns: 3,
    cardWidth: 0, // Calculated from columns
    imageHeight: 180,
    cardHeight: 380, // Standardized height
    minWidth: 320, // ~85% of typical 380px width
    maxWidth: 600, // ~115% of typical 380px width
      minGap: 25,
      maxGap: 60,
      targetGap: 40,
      verticalGap: 25,
    fontSize: {
      title: 20,
      description: 14,
    },
  },
  large: {
    columns: 2,
    cardWidth: 0, // Calculated from columns
    imageHeight: 200,
    cardHeight: 380, // Standardized height
    minWidth: 490, // ~85% of typical 580px width
    maxWidth: 670, // ~115% of typical 580px width
      minGap: 30,
      maxGap: 90,
      targetGap: 60,
      verticalGap: 30,
    fontSize: {
      title: 24,
      description: 16,
    },
  },
};

