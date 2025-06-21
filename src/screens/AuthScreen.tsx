import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<AuthMode>('signup'); // Start with signup for new users

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {mode === 'signin' ? (
        <SignInScreen onSwitchToSignUp={() => setMode('signup')} />
      ) : (
        <SignUpScreen onSwitchToSignIn={() => setMode('signin')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
