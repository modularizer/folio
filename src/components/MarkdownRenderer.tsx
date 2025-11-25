import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Markdown renderer component using react-native-markdown-display.
 * 
 * This is a fully-featured CommonMark renderer that supports:
 * - Headers (H1-H6)
 * - Bold, italic, strikethrough
 * - Links and images
 * - Lists (ordered and unordered)
 * - Code blocks and inline code
 * - Blockquotes
 * - Tables
 * - And more CommonMark features
 * 
 * Usage:
 * <MarkdownRenderer content="# Hello\n\nThis is **bold** text." />
 */
interface MarkdownRendererProps {
  /**
   * Markdown content to render
   */
  content: string;
  
  /**
   * Custom styles for the container
   */
  style?: ViewStyle;
  
  /**
   * Whether to wrap in a ScrollView (default: true)
   */
  scrollable?: boolean;
  
  /**
   * Custom markdown styles (overrides default theme-based styles)
   */
  markdownStyles?: any;
  
  /**
   * Whether to merge custom styles with theme styles (default: true)
   */
  mergeStyles?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  style,
  scrollable = true,
  markdownStyles,
  mergeStyles = true,
}) => {
  const { theme } = useTheme();
  
  // Generate theme-based markdown styles
  const getThemeStyles = () => {
    const baseStyles = {
      body: {
        color: theme.colors.text,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: undefined, // Use system default
      },
      heading1: {
        color: theme.colors.text,
        fontSize: 32,
        fontWeight: 'bold' as const,
        marginTop: 24,
        marginBottom: 16,
      },
      heading2: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold' as const,
        marginTop: 20,
        marginBottom: 12,
      },
      heading3: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '600' as const,
        marginTop: 16,
        marginBottom: 8,
      },
      heading4: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '600' as const,
        marginTop: 12,
        marginBottom: 8,
      },
      heading5: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600' as const,
        marginTop: 12,
        marginBottom: 8,
      },
      heading6: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600' as const,
        marginTop: 12,
        marginBottom: 8,
      },
      paragraph: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        marginTop: 0,
        marginBottom: 12,
      },
      strong: {
        color: theme.colors.text,
        fontWeight: 'bold' as const,
      },
      em: {
        fontStyle: 'italic' as const,
      },
      link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline' as const,
      },
      list_item: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
      },
      bullet_list: {
        marginTop: 8,
        marginBottom: 8,
      },
      ordered_list: {
        marginTop: 8,
        marginBottom: 8,
      },
      code_inline: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        fontSize: 14,
        fontFamily: 'monospace',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
      },
      code_block: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        fontSize: 14,
        fontFamily: 'monospace',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 12,
      },
      fence: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        fontSize: 14,
        fontFamily: 'monospace',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 12,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        paddingLeft: 16,
        marginLeft: 0,
        marginTop: 12,
        marginBottom: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic' as const,
      },
      table: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 12,
      },
      thead: {
        backgroundColor: theme.colors.surface,
      },
      th: {
        color: theme.colors.text,
        fontWeight: 'bold' as const,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      td: {
        color: theme.colors.textSecondary,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      hr: {
        backgroundColor: theme.colors.border,
        height: 1,
        marginTop: 24,
        marginBottom: 24,
      },
      image: {
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 12,
      },
    };
    
    if (markdownStyles && mergeStyles) {
      // Deep merge custom styles with theme styles
      return deepMerge(baseStyles, markdownStyles);
    }
    
    return markdownStyles || baseStyles;
  };
  
  // Simple deep merge utility
  const deepMerge = (target: any, source: any): any => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  };
  
  const isObject = (item: any): boolean => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };
  
  const markdownContent = (
    <View style={[styles.container, style]}>
      <Markdown style={getThemeStyles()}>{content}</Markdown>
    </View>
  );
  
  if (scrollable) {
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {markdownContent}
      </ScrollView>
    );
  }
  
  return markdownContent;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
});

export default MarkdownRenderer;
