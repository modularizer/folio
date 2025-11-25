import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface LinkedInLogoProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Modular LinkedIn logo component
 * 
 * Displays the LinkedIn logo icon using Ionicons.
 * 
 * @example
 * <LinkedInLogo size={24} />
 * <LinkedInLogo size={32} color="#0077b5" />
 */
export const LinkedInLogo: React.FC<LinkedInLogoProps> = ({
  size = 24,
  color,
  style,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.text;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="logo-linkedin" size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LinkedInLogo;



