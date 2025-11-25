import React from 'react';
import { Image, ImageProps, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';

export type PhotoSource = 
  | string // URL or local asset path
  | ImageSourcePropType // require() result
  | { uri: string }; // URI object

interface PhotoProps extends Omit<ExpoImageProps, 'source'> {
  source: PhotoSource;
  style?: StyleProp<ImageStyle>;
  /**
   * Whether to use expo-image (default) or react-native Image
   * expo-image is better for web and has better caching
   */
  useExpoImage?: boolean;
}

/**
 * Photo component that handles both local assets and remote URLs.
 * 
 * Usage:
 * - Remote URL: <Photo source="https://example.com/image.jpg" />
 * - Local asset: <Photo source={require('../assets/image.jpg')} />
 * - Local path: <Photo source="./assets/image.jpg" />
 */
export const Photo: React.FC<PhotoProps> = ({ 
  source, 
  useExpoImage = true,
  ...props 
}) => {
  // Normalize source to handle different input types
  const normalizedSource = React.useMemo(() => {
    // If it's already a proper source object (from require() or { uri: ... })
    // require() returns a number (asset ID) or an object with uri
    if (typeof source === 'object' && !Array.isArray(source) && source !== null) {
      return source;
    }
    
    // If it's a number, it's likely from require() - pass it through
    if (typeof source === 'number') {
      return source;
    }
    
    // If it's a string (URL or local path)
    if (typeof source === 'string') {
      // Check if it's a URL (starts with http:// or https://)
      if (source.startsWith('http://') || source.startsWith('https://')) {
        return { uri: source };
      }
      // Otherwise treat as local path/asset
      // For local paths, expo-image can handle them directly
      return { uri: source };
    }
    
    return source;
  }, [source]);

  if (useExpoImage) {
    return <ExpoImage source={normalizedSource} {...props} />;
  }

  return <Image source={normalizedSource as ImageSourcePropType} {...props} />;
};

export default Photo;

