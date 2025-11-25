import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { TokenWarningModal } from './TokenWarningModal';

interface TokenWarningIconProps {
  /**
   * Current user token input value (for modal)
   */
  userTokenInput?: string;
  
  /**
   * Callback when user token input changes
   */
  onUserTokenInputChange?: (value: string) => void;
  
  /**
   * Current saved user token
   */
  userToken?: string;
  
  /**
   * Callback to save user token
   */
  onSaveUserToken?: (token: string) => void;
  
  /**
   * Custom container style
   */
  style?: any;
}

/**
 * Warning icon component that shows a modal with token setup instructions when clicked
 * 
 * Use this component anywhere auth errors might occur.
 */
export const TokenWarningIcon: React.FC<TokenWarningIconProps> = ({
  userTokenInput = '',
  onUserTokenInputChange,
  userToken,
  onSaveUserToken,
  style,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      padding: 4,
    },
    icon: {
      fontSize: 20,
    },
  });

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="warning"
          size={20}
          color={theme.colors.warning || '#ffa500'}
          style={styles.icon}
        />
      </TouchableOpacity>
      <TokenWarningModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userTokenInput={userTokenInput}
        onUserTokenInputChange={onUserTokenInputChange}
        userToken={userToken}
        onSaveUserToken={onSaveUserToken}
      />
    </>
  );
};

export default TokenWarningIcon;



