/**
 * Username Input Screen
 * 
 * Shown when no GitHub username is provided.
 * Allows user to enter a username and navigate to their profile.
 */
import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from '@/utils/router';

export function UsernameInput() {
  const [username, setUsername] = useState('');
  const { navigate } = useRouter();

  const handleSubmit = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      // Navigate to /@username
      console.log('[UsernameInput] Navigating to:', `/@${trimmedUsername}`);
      navigate(`/@${trimmedUsername}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Folio</Text>
        <Text style={styles.subtitle}>Enter a GitHub username to view their portfolio</Text>
        
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
          placeholder="username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          blurOnSubmit={false}
        />
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            !username.trim() && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!username.trim()}
        >
          <Text style={[
            styles.buttonText,
            !username.trim() && styles.buttonTextDisabled
          ]}>
            View Portfolio
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    outlineStyle: 'none',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#e0e0e0',
  },
  buttonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  buttonTextDisabled: {
    color: '#666',
  },
});

