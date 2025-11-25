/**
 * Expo Status Bar shim for webpack bundle mode
 * 
 * StatusBar doesn't apply to web, so this is a no-op component.
 */

import React from 'react';

export interface StatusBarProps {
  style?: 'auto' | 'inverted' | 'light' | 'dark';
  animated?: boolean;
  backgroundColor?: string;
  hidden?: boolean;
  networkActivityIndicatorVisible?: boolean;
  translucent?: boolean;
}

export function StatusBar(props: StatusBarProps) {
  // StatusBar is a no-op on web
  return null;
}

// Default export
export default StatusBar;

