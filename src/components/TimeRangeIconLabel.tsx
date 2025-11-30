import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconLabel } from './IconLabel';

interface TimeRangeIconLabelProps {
  /**
   * Start date (ISO date string)
   */
  startDate: string;
  
  /**
   * End date (ISO date string)
   */
  endDate: string;
  
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
 * Time Range Icon Label Component
 * 
 * Displays a date range (start - end) with a clock icon, using the same
 * formatting logic as project cards (days ago format for recent dates).
 * 
 * @example
 * <TimeRangeIconLabel startDate="2020-01-01" endDate="2024-12-01" />
 */
export const TimeRangeIconLabel: React.FC<TimeRangeIconLabelProps> = ({
  startDate,
  endDate,
  iconSize = 14,
  fontSize,
  textColor,
  style,
}) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string): { text: string; daysAgo: number; isDaysAgo: boolean; date: Date } => {
    const date = new Date(dateString);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    const showDaysAgo = daysAgo <= 21; // Show "days ago" if within 3 weeks
    
    let text: string;
    if (showDaysAgo) {
      if (daysAgo === 0) {
        text = 'Today';
      } else if (daysAgo === 1) {
        text = 'Yesterday';
      } else if (daysAgo < 30) {
        text = `${daysAgo} days ago`;
      } else if (daysAgo < 365) {
        text = `${Math.floor(daysAgo / 30)} months ago`;
      } else {
        text = `${Math.floor(daysAgo / 365)} years ago`;
      }
    } else {
      text = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return { text, daysAgo, isDaysAgo: showDaysAgo, date };
  };

  const startDateInfo = formatDate(startDate);
  const endDateInfo = formatDate(endDate);

  let displayText: string;
  if (startDateInfo.text === endDateInfo.text) {
    // Same date, just show once
    displayText = startDateInfo.text;
  } else if (startDateInfo.isDaysAgo && endDateInfo.isDaysAgo) {
    // Both in "days ago" format - show as "older - newer days ago"
    const older = Math.max(startDateInfo.daysAgo, endDateInfo.daysAgo);
    const newer = Math.min(startDateInfo.daysAgo, endDateInfo.daysAgo);
    if (older === newer) {
      displayText = startDateInfo.text;
    } else {
      // Format the days ago text properly
      const olderText = older === 1 ? 'Yesterday' : `${older} days ago`;
      const newerText = newer === 1 ? 'Yesterday' : newer === 0 ? 'Today' : `${newer} days ago`;
      displayText = `${olderText} - ${newerText}`;
    }
  } else if (!startDateInfo.isDaysAgo && !endDateInfo.isDaysAgo) {
    // Both are full dates - check if same month/year to consolidate
    const first = startDateInfo.date;
    const last = endDateInfo.date;
    if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
      // Same month and year - show "Nov 10 - 17, 2025"
      const month = first.toLocaleDateString('en-US', { month: 'short' });
      const year = first.getFullYear();
      const firstDay = first.getDate();
      const lastDay = last.getDate();
      displayText = `${month} ${firstDay} - ${lastDay}, ${year}`;
    } else {
      // Different months/years - show both
      displayText = `${startDateInfo.text} - ${endDateInfo.text}`;
    }
  } else {
    // Mixed format - show both with dash
    displayText = `${startDateInfo.text} - ${endDateInfo.text}`;
  }

  return (
    <IconLabel
      icon="time"
      label={displayText}
      iconSize={iconSize}
      fontSize={fontSize}
      textColor={textColor}
      style={style}
    />
  );
};

export default TimeRangeIconLabel;


