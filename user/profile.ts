import { ReactElement } from 'react';

/**
 * Background image source - can be a URL, local asset path, or a React element
 */
export type BackgroundSource = 
  | string // URL or local asset path (e.g., "https://example.com/bg.jpg" or "./assets/bg.jpg")
  | ReactElement; // Custom React component/element for background

/**
 * Personal Profile Information
 * 
 * Customize this file with your own information.
 * This data is used throughout the portfolio for displaying
 * your name, social links, and other personal details.
 */
export interface UserProfile {
  name: string;
  title?: string;
  bio?: string;
  email?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  linkedinAvatarUrl?: string; // Optional LinkedIn profile picture URL (must be provided manually as LinkedIn doesn't have a public API)
  twitter?: string;
  website?: string;
  /**
   * Background image or element for the portfolio.
   * Can be:
   * - A URL: "https://example.com/background.jpg"
   * - A local asset path: "./assets/background.jpg" or require('./assets/background.jpg')
   * - A React element: <CustomBackground />
   */
  background?: BackgroundSource;
  // Add any other social links or personal info
  [key: string]: unknown;
}

/**
 * Your personal profile information.
 * Replace with your own details.
 */
export const userProfile: UserProfile = {
  name: 'Your Name',
  title: 'Software Developer',
  bio: 'A passionate developer building cool things.',
  email: 'your.email@example.com',
  location: 'Your Location',
  github: 'https://github.com/yourusername',
  linkedin: 'https://linkedin.com/in/yourusername',
  twitter: 'https://twitter.com/yourusername',
  website: 'https://yourwebsite.com',
  
  // Background can be:
  // - A URL: 'https://example.com/background.jpg'
  // - A local asset path: './assets/background.jpg'
  // - A React element: <CustomBackgroundComponent />
  // - undefined: No background (default)
  // background: 'https://example.com/background.jpg',
  // Or use a custom React component:
  // background: (
  //   <View style={{ flex: 1, backgroundColor: '#000' }}>
  //     <Text>Custom Background</Text>
  //   </View>
  // ),
};

