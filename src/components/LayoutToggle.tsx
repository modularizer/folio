import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCardLayout } from '@/contexts/CardLayoutContext';
import { CardLayoutMode } from '@/projects/types/CardConfig';

interface LayoutToggleProps {
  /**
   * Custom container style
   */
  style?: any;
  
  /**
   * Whether to show as a single icon that cycles through modes (default: true)
   * If false, shows all mode buttons
   */
  singleIcon?: boolean;
}

/**
 * Layout Toggle Component
 * 
 * A reusable component for toggling between different card layout modes:
 * - list: Single column list view
 * - small: Small grid cards
 * - medium: Medium grid cards
 * - large: Large grid cards
 * 
 * Can be used as a single icon that cycles through modes, or as multiple buttons.
 * 
 * Usage:
 * <LayoutToggle /> // Single icon that cycles
 * <LayoutToggle singleIcon={false} /> // All buttons visible
 */
export const LayoutToggle: React.FC<LayoutToggleProps> = ({ style, singleIcon = true }) => {
  const { theme } = useTheme();
  const { layoutMode, setLayoutMode } = useCardLayout();

  // Order of layout modes for cycling
  const layoutOrder: CardLayoutMode[] = ['list', 'small', 'medium', 'large'];
  
  // Get icon for current mode
  const getIconForMode = (mode: CardLayoutMode): keyof typeof Ionicons.glyphMap => {
    switch (mode) {
      case 'list': return 'list';
      case 'small': return 'grid-outline';
      case 'medium': return 'grid';
      case 'large': return 'albums';
      default: return 'grid';
    }
  };

  // Cycle to next mode
  const cycleToNextMode = () => {
    const currentIndex = layoutOrder.indexOf(layoutMode);
    const nextIndex = (currentIndex + 1) % layoutOrder.length;
    setLayoutMode(layoutOrder[nextIndex]);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: singleIcon ? 0 : 4, // No padding when single icon, let height control it
      paddingHorizontal: singleIcon ? 8 : 4, // Horizontal padding for single icon
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: singleIcon ? 36 : undefined,
      height: singleIcon ? 36 : undefined, // Match search bar height (36px)
      minHeight: singleIcon ? 36 : undefined,
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      width: 28,
      height: 28,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonActive: {
      backgroundColor: theme.colors.primary,
    },
    singleIconButton: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // Single icon mode - cycles through on click
  if (singleIcon) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={cycleToNextMode}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getIconForMode(layoutMode)}
          size={20}
          color={theme.colors.text}
        />
      </TouchableOpacity>
    );
  }

  // Multi-button mode - show all options
  const layoutModes: Array<{
    mode: CardLayoutMode;
    icon: keyof typeof Ionicons.glyphMap;
    size: number;
  }> = [
    { mode: 'list', icon: 'list', size: 16 },
    { mode: 'small', icon: 'grid-outline', size: 16 },
    { mode: 'medium', icon: 'grid', size: 16 },
    { mode: 'large', icon: 'albums', size: 16 },
  ];

  return (
    <View style={[styles.container, style]}>
      {layoutModes.map(({ mode, icon, size }) => {
        const isActive = layoutMode === mode;
        const iconColor = isActive 
          ? theme.colors.background
          : theme.colors.textSecondary;

        return (
          <TouchableOpacity
            key={mode}
            style={[
              styles.button,
              isActive && styles.buttonActive,
            ]}
            onPress={() => setLayoutMode(mode)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon}
              size={size}
              color={iconColor}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default LayoutToggle;

