import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export default function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  style 
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {icon && (
            <View style={styles.iconContainer}>
              {icon}
            </View>
          )}
          
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>
          
          <Text 
            variant="bodyMedium" 
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {description}
          </Text>
          
          {action && (
            <View style={styles.actionContainer}>
              {action}
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
    elevation: 0,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  actionContainer: {
    width: '100%',
  },
});
