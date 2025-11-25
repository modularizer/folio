import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface EmailButtonProps {
  /**
   * Email address
   */
  email: string;
  
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
 * Modular Email button component
 * 
 * Displays email icon. Clicking opens the default email client.
 * 
 * @example
 * <EmailButton email="user@example.com" />
 */
export const EmailButton: React.FC<EmailButtonProps> = ({
  email,
  style,
  size = 'medium',
  inTopRow = true,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const sizeConfig = {
    small: { icon: 14, fontSize: 11, padding: 5 },
    medium: { icon: 18, fontSize: 12, padding: 6 }, // Reduced font and sizes
    large: { icon: 24, fontSize: 16, padding: 10 },
  };

  const config = sizeConfig[size];

  const handlePress = () => {
    Linking.openURL(`mailto:${email}`).catch((err) => {
      console.error('Failed to open email client:', err);
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
      minWidth: 36, // Minimum width for icon button
      height: size === 'medium' ? 36 : undefined, // Match search bar height for medium
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="mail"
          size={config.icon}
          color={theme.colors.text}
        />
      </View>
    </TouchableOpacity>
  );
};

export default EmailButton;



