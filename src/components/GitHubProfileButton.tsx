import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { GitHubLogo } from './GitHubLogo';
import { Photo } from './Photo';

interface GitHubProfileButtonProps {
  /**
   * GitHub profile URL
   */
  githubUrl: string;
  
  /**
   * GitHub username
   */
  username: string;
  
  /**
   * Profile picture URL (avatar)
   */
  avatarUrl?: string;
  
  /**
   * Optional custom style
   */
  style?: any;
  
  /**
   * Size of the button (default: 'medium')
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Modular GitHub profile button component
 * 
 * Displays GitHub logo, profile picture, and username.
 * Clicking opens the GitHub profile.
 * 
 * @example
 * <GitHubProfileButton
 *   githubUrl="https://github.com/username"
 *   username="username"
 *   avatarUrl="https://avatars.githubusercontent.com/u/123"
 * />
 */
export const GitHubProfileButton: React.FC<GitHubProfileButtonProps> = ({
  githubUrl,
  username,
  avatarUrl,
  style,
  size = 'medium',
  inTopRow = true,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const sizeConfig = {
    small: { logo: 14, avatar: 18, fontSize: 11, padding: 5, gap: 5 },
    medium: { logo: 18, avatar: 20, fontSize: 12, padding: 6, gap: 6 }, // Reduced font and sizes
    large: { logo: 24, avatar: 32, fontSize: 16, padding: 10, gap: 10 },
  };

  const config = sizeConfig[size];

  const handlePress = () => {
    Linking.openURL(githubUrl).catch((err) => {
      console.error('Failed to open GitHub URL:', err);
    });
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: config.padding,
      paddingVertical: inTopRow ? config.padding : config.padding * 0.75, // Reduced height when not in top row
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: config.gap,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      maxWidth: '100%', // Prevent overflow
      overflow: 'hidden', // Clip overflow
      flexShrink: 1, // Allow shrinking if needed
    },
    logoContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarContainer: {
      width: config.avatar,
      height: config.avatar,
      borderRadius: config.avatar / 2,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    username: {
      fontSize: config.fontSize,
      fontWeight: '600',
      color: theme.colors.text,
      flexShrink: 1, // Allow text to shrink
      maxWidth: '100%', // Prevent overflow
      overflow: 'hidden', // Clip overflow
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.logoContainer}>
        <GitHubLogo size={config.logo} />
      </View>
      {avatarUrl && (
        <View style={styles.avatarContainer}>
          <Photo source={avatarUrl} style={styles.avatar} />
        </View>
      )}
      <Text style={styles.username}>{username}</Text>
    </TouchableOpacity>
  );
};

export default GitHubProfileButton;

