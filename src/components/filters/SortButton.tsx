import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SortOption } from './types';

interface SortButtonProps {
  /**
   * Sort option to display
   */
  option: SortOption;
  
  /**
   * Whether this sort is currently active
   */
  active: boolean;
  
  /**
   * Callback when sort is pressed
   */
  onPress: (sortId: string) => void;
  
  /**
   * Optional custom style
   */
  style?: any;

  /**
   * When true, only render the icon (still showing direction arrow)
   */
  compact?: boolean;
}

/**
 * Generic sort button component
 * Displays a sort option as a button that can be toggled
 * Shows direction indicator when active
 */
export const SortButton: React.FC<SortButtonProps> = ({
  option,
  active,
  onPress,
  style,
  compact = false,
}) => {
  const { theme } = useTheme();

  // Determine text color based on background
  // When active, use primary as background, so use background color as text (they're opposites)
  // When inactive, use normal text color
  const getTextColor = () => {
    if (active) {
      // When active, background is primary, so use background color for text (inverse)
      return theme.colors.background;
    }
    return theme.colors.text;
  };

  const getIconColor = () => {
    if (active) {
      return theme.colors.background;
    }
    return theme.colors.textSecondary;
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 4 : 6,
      paddingHorizontal: compact ? 10 : 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: active ? theme.colors.primary : theme.colors.background,
      borderColor: active ? theme.colors.primary : theme.colors.border,
    },
    buttonText: {
      fontSize: 13,
      fontWeight: active ? '600' : '400',
      color: getTextColor(),
    },
    icon: {
      marginRight: -2,
    },
    directionIcon: {
      marginLeft: 2,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => onPress(option.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={option.label}
    >
      {option.icon && (
        <Ionicons
          name={option.icon as any}
          size={14}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      {!compact && (
        <Text style={styles.buttonText}>{option.label}</Text>
      )}
      {active && option.direction && (
        <Ionicons
          name={option.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={12}
          color={getIconColor()}
          style={styles.directionIcon}
        />
      )}
    </TouchableOpacity>
  );
};

