import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Searchbar, Card, useTheme } from 'react-native-paper';

export default function SearchScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement TMDB search
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search for TV shows..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          style={styles.searchbar}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {searchQuery ? (
          <Text variant="titleMedium" style={styles.resultsTitle}>
            Search results for "{searchQuery}"
          </Text>
        ) : (
          <>
            <Text variant="headlineMedium" style={styles.title}>
              Discover Shows
            </Text>
            
            <Card style={styles.placeholderCard}>
              <Card.Content>
                <Text variant="titleLarge">Popular Shows</Text>
                <Text variant="bodyMedium" style={styles.placeholderText}>
                  Search for your favorite TV shows or browse popular ones.
                </Text>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 0,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  resultsTitle: {
    marginBottom: 16,
  },
  placeholderCard: {
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    opacity: 0.7,
  },
});
