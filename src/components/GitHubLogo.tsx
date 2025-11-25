import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface GitHubLogoProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Modular GitHub logo component
 * 
 * Displays the GitHub logo icon using Ionicons.
 * 
 * @example
 * <GitHubLogo size={24} />
 * <GitHubLogo size={32} color="#333" />
 */
export const GitHubLogo: React.FC<GitHubLogoProps> = ({
  size = 24,
  color,
  style,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.text;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="logo-github" size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GitHubLogo;



