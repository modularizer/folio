import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface IconLabelProps {
  /**
   * Icon name from Ionicons
   */
  icon: keyof typeof Ionicons.glyphMap;
  
  /**
   * Label text to display
   */
  label: string;
  
  /**
   * Icon size (default: 14)
   */
  iconSize?: number;
  
  /**
   * Text font size (default: 12)
   */
  fontSize?: number;
  
  /**
   * Text color (default: theme.colors.textSecondary)
   */
  textColor?: string;
  
  /**
   * Custom container style
   */
  style?: any;
}

/**
 * Reusable Icon Label Component
 * 
 * Displays an icon with text label, matching the style used in project cards.
 * 
 * @example
 * <IconLabel icon="star" label="1.2k" />
 */
export const IconLabel: React.FC<IconLabelProps> = ({
  icon,
  label,
  iconSize = 14,
  fontSize,
  textColor,
  style,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    icon: {
      fontSize: iconSize,
    },
    text: {
      fontSize: fontSize ?? 12,
      lineHeight: fontSize ? fontSize + 2 : 14, // Reduce line height to match icon size
      color: textColor ?? theme.colors.textSecondary,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={iconSize} color={textColor ?? theme.colors.textSecondary} style={styles.icon} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

export default IconLabel;

