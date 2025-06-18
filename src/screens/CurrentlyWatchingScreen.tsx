import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, useTheme } from 'react-native-paper';

export default function CurrentlyWatchingScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        testID="currently-watching-scroll"
      >
        <Text variant="headlineMedium" style={styles.title} testID="currently-watching-title">
          Currently Watching
        </Text>
        
        <Card style={styles.placeholderCard}>
          <Card.Content>
            <Text variant="titleLarge" testID="no-shows-title">No shows yet</Text>
            <Text variant="bodyMedium" style={styles.placeholderText} testID="no-shows-description">
              Start tracking your favorite TV shows by searching for them in the Search tab.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.statusRow} testID="status-chips">
          <Chip mode="outlined" style={styles.statusChip} testID="watching-chip">Watching</Chip>
          <Chip mode="outlined" style={styles.statusChip} testID="completed-chip">Completed</Chip>
          <Chip mode="outlined" style={styles.statusChip} testID="paused-chip">Paused</Chip>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  placeholderCard: {
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    marginBottom: 8,
  },
});
