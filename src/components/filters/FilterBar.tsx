import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FilterSortController } from './types';
import { FilterButton } from './FilterButton';
import { SortButton } from './SortButton';

interface FilterBarProps {
  /**
   * Controller that provides filter and sort options
   */
  controller: FilterSortController | null;
  
  /**
   * Optional label for filters section
   */
  filtersLabel?: string;
  
  /**
   * Optional label for sorts section
   */
  sortsLabel?: string;
  
  /**
   * Whether to show labels
   */
  showLabels?: boolean;
  
  /**
   * Optional custom style
   */
  style?: any;

  /**
   * When true, render compact buttons (icon-only)
   */
  compactButtons?: boolean;
}

/**
 * Generic filter and sort bar component
 * Displays filter buttons and sort buttons in a horizontal scrollable container
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  controller,
  filtersLabel = 'Filters',
  sortsLabel = 'Sort',
  showLabels = false,
  style,
  compactButtons = false,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  if (!controller) {
    return null;
  }

  // Memoize options and active states to prevent unnecessary recalculations
  // Use version to trigger re-renders when controller state changes
  const version = controller.getVersion();
  const filterOptions = useMemo(() => controller.getFilterOptions(), [controller, version]);
  const sortOptions = useMemo(() => controller.getSortOptions(), [controller, version]);
  const activeFilterIds = useMemo(() => controller.getActiveFilterIds(), [controller, version]);
  const activeSortIds = useMemo(() => controller.getActiveSortIds(), [controller, version]);

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    section: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    filtersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 0,
      minWidth: 0,
    },
    sortsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    scrollView: {
      flexDirection: 'row',
      gap: 8,
    },
  }), [theme, screenWidth]);

  return (
    <View style={[styles.container, style]}>
      {/* Filters Section */}
      {filterOptions.length > 0 && (
        <View style={styles.filtersContainer}>
          {showLabels && <Text style={styles.label}>{filtersLabel}:</Text>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollView}
            style={{ flexGrow: 0 }}
          >
            {filterOptions.map((option) => (
              <FilterButton
                key={option.id}
                option={option}
                active={activeFilterIds.includes(option.id)}
                onPress={controller.onFilterSelect}
                compact={compactButtons}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sorts Section */}
      {sortOptions.length > 0 && (
        <View style={styles.sortsContainer}>
          {showLabels && <Text style={styles.label}>{sortsLabel}:</Text>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollView}
            style={{ flexGrow: 0 }}
          >
            {sortOptions.map((option) => (
              <SortButton
                key={option.id}
                option={option}
                active={option.active ?? activeSortIds.includes(option.id)}
                onPress={controller.onSortSelect}
                compact={compactButtons}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

