import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ImageBackground } from 'expo-image';
import { BackgroundSource } from '@/types/theme';

interface BackgroundWrapperProps {
  background?: BackgroundSource;
  children: ReactNode;
  style?: ViewStyle;
  overlayOpacity?: number;
}

/**
 * BackgroundWrapper component that handles different background types:
 * - String (URL or path): Renders as ImageBackground
 * - ReactElement: Renders the element directly
 * - undefined: No background
 */
export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  background,
  children,
  style,
  overlayOpacity = 0.7,
}) => {
  // If no background, just render children
  if (!background) {
    return <View style={style}>{children}</View>;
  }

  // If it's a React element, render it directly
  if (React.isValidElement(background)) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.backgroundElement}>{background}</View>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // If it's a string (URL or path), render as ImageBackground
  if (typeof background === 'string') {
    return (
      <View style={[styles.container, style]}>
        <ImageBackground
          source={{ uri: background }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}>
            {children}
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Fallback: just render children
  return <View style={style}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  backgroundElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default BackgroundWrapper;

