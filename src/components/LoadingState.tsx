import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  testID?: string;
}

export default function LoadingState({ 
  message = 'Loading...', 
  style,
  testID 
}: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View 
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary}
        style={styles.spinner}
        testID="activity-indicator"
      />
      <Text 
        variant="bodyMedium" 
        style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
  },
});
