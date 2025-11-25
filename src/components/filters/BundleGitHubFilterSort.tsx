/**
 * Simplified GitHub filter/sort for bundle (no expo-router)
 */

import React from 'react';
import { View } from 'react-native';

// Minimal stub - we'll skip filtering for bundle version
export function BundleGitHubFilterSort({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

