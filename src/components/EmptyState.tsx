import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export default function EmptyState({ 
  title = 'No items found',
  message,
  description = 'There are no items to display at the moment.',
  icon = 'inbox-outline',
  actionText,
  onActionPress,
  style,
  testID
}: EmptyStateProps) {
  const theme = useTheme();
  const displayMessage = message || description;

  return (
    <View 
      style={[styles.container, style]}
      testID={testID || "empty-state"}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${displayMessage}`}
    >
      <Card style={styles.card} testID="empty-container">
        <Card.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={icon as any} 
              size={64} 
              color={theme.colors.onSurfaceVariant}
              testID="empty-state-icon"
            />
          </View>
          
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>
          
          <Text 
            variant="bodyMedium" 
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {displayMessage}
          </Text>
          
          {actionText && onActionPress && (
            <View style={styles.actionContainer}>
              <Button 
                mode="contained" 
                onPress={onActionPress}
                style={styles.actionButton}
                testID="empty-state-action-button"
              >
                {actionText}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    minWidth: 120,
  },
});
