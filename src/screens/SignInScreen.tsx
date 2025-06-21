import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme, 
  HelperText 
} from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

interface SignInScreenProps {
  onSwitchToSignUp: () => void;
}

export default function SignInScreen({ onSwitchToSignUp }: SignInScreenProps) {
  const theme = useTheme();
  const { signIn, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    setError('');
    const { error: signInError } = await signIn(username.trim());
    
    if (signInError) {
      setError(signInError);
    }
    // If successful, the auth store will update and navigation will handle the rest
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Welcome Back
        </Text>
        
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Sign in to continue tracking your shows
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (error) setError(''); // Clear error when user types
              }}
              mode="outlined"
              style={styles.input}
              error={!!error}
              disabled={isLoading}
              autoCapitalize="none"
              autoCorrect={false}
              testID="username-input"
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSignIn}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading || !username.trim()}
              testID="signin-button"
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={onSwitchToSignUp}
              style={styles.switchButton}
              disabled={isLoading}
              testID="switch-to-signup-button"
            >
              Don't have an account? Sign Up
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  switchButton: {
    marginTop: 8,
  },
});
