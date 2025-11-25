import { ReactElement } from 'react';

export type BackgroundSource = 
  | string
  | ReactElement;

export interface UserProfile {
  name: string;
  title?: string;
  bio?: string;
  email?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  linkedinAvatarUrl?: string;
  twitter?: string;
  website?: string;
  background?: BackgroundSource;
  [key: string]: unknown;
}

// Default empty profile for bundle
export const userProfile: UserProfile = {
  name: '',
};
