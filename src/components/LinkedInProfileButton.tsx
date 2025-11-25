import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinkedInLogo } from './LinkedInLogo';
import { Photo } from './Photo';

interface LinkedInProfileButtonProps {
  /**
   * LinkedIn profile URL
   */
  linkedinUrl: string;
  
  /**
   * LinkedIn username or display name
   */
  username: string;
  
  /**
   * Profile picture URL (avatar) - optional
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
  
  /**
   * Whether this button is in the top row (default: true)
   * When false, uses reduced height
   */
  inTopRow?: boolean;
}

/**
 * Modular LinkedIn profile button component
 * 
 * Displays LinkedIn logo, profile picture (if available), and username.
 * Clicking opens the LinkedIn profile.
 * 
 * @example
 * <LinkedInProfileButton
 *   linkedinUrl="https://linkedin.com/in/username"
 *   username="John Doe"
 *   avatarUrl="https://media.licdn.com/dms/image/..."
 * />
 */
export const LinkedInProfileButton: React.FC<LinkedInProfileButtonProps> = ({
  linkedinUrl,
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
    Linking.openURL(linkedinUrl).catch((err) => {
      console.error('Failed to open LinkedIn URL:', err);
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
        <LinkedInLogo size={config.logo} />
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

export default LinkedInProfileButton;

