import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface TokenWarningModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Callback when modal should be closed
   */
  onClose: () => void;
  
  /**
   * Current user token input value
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
}

/**
 * Modal component that displays GitHub token setup instructions
 * 
 * Reusable component that can be shown when auth errors occur.
 */
export const TokenWarningModal: React.FC<TokenWarningModalProps> = ({
  visible,
  onClose,
  userTokenInput = '',
  onUserTokenInputChange,
  userToken,
  onSaveUserToken,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 600,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      maxHeight: 400,
    },
    errorSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    linkButton: {
      paddingVertical: 4,
    },
    linkText: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    tokenInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      marginBottom: 8,
      paddingLeft: 32,
    },
    tokenInput: {
      width: 300,
      height: 40,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingLeft: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontSize: 14,
    },
    tokenButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tokenButtonText: {
      color: theme.colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    tokenClearButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tokenClearButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    tokenSavedText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GitHub Token Setup</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.errorSubtext}>
                <Text style={{ fontWeight: 'bold' }}>How to get a GitHub token:</Text>
                {'\n\n'}
                1. Go to{' '}
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL('https://github.com/settings/tokens/new?scopes=public_repo&description=Portfolio%20App').catch((err) => {
                      console.error('Failed to open GitHub settings:', err);
                    });
                  }}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>GitHub Token Settings</Text>
                </TouchableOpacity>
                {'\n'}
                2. Set expiration to "No expiration"
                {'\n'}
                3. Review the pre-filled name and scope, then click "Generate token"
                {'\n'}
                4. Copy the token (you won't see it again!)
                {'\n\n'}
                <Text style={{ fontStyle: 'italic' }}>
                  This increases your rate limit from 60 to 5,000 requests per hour.
                </Text>
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>For Developers (Site Owners):</Text>
                {'\n'}
                {'    '}Option 1: Create a .env file in your project root:
                {'\n'}
                {'    '}EXPO_PUBLIC_GITHUB_TOKEN=your_token_here
                {'\n\n'}
                {'    '}Option 2: Pass it directly in app/index.tsx:
                {'\n'}
                {'    '}githubToken={process.env.EXPO_PUBLIC_GITHUB_TOKEN}
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>For Users:</Text>
                {'\n'}
                {'    '}Enter your own GitHub token below to view this portfolio:
              </Text>
              {onUserTokenInputChange && onSaveUserToken && (
                <>
                  <View style={styles.tokenInputContainer}>
                    <TextInput
                      style={styles.tokenInput}
                      placeholder="Enter your GitHub token..."
                      placeholderTextColor={theme.colors.textSecondary}
                      value={userTokenInput}
                      onChangeText={onUserTokenInputChange}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.tokenButton}
                      onPress={() => {
                        if (userTokenInput.trim()) {
                          onSaveUserToken(userTokenInput.trim());
                        } else {
                          onSaveUserToken('');
                        }
                      }}
                    >
                      <Text style={styles.tokenButtonText}>
                        {userToken ? 'Update' : 'Save'} Token
                      </Text>
                    </TouchableOpacity>
                    {userToken && (
                      <TouchableOpacity
                        style={styles.tokenClearButton}
                        onPress={() => {
                          onSaveUserToken('');
                          onUserTokenInputChange('');
                        }}
                      >
                        <Text style={styles.tokenClearButtonText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {userToken && (
                    <Text style={styles.tokenSavedText}>
                      ✓ Token saved. Data will reload automatically.
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default TokenWarningModal;

