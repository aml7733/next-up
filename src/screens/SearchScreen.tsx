import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

import { Show } from '../types';
import { tmdbService } from '../services/tmdb';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';
import { ShowCard, EmptyState, LoadingState } from '../components';

export default function SearchScreen() {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const { addShow } = useShowsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search shows query
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError,
    isError: hasSearchError 
  } = useQuery({
    queryKey: ['searchShows', debouncedQuery],
    queryFn: () => tmdbService.searchShows(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Popular shows query (for when no search is active)
  const { 
    data: popularShows, 
    isLoading: isLoadingPopular, 
    error: popularError 
  } = useQuery({
    queryKey: ['popularShows'],
    queryFn: () => tmdbService.getPopularShows(),
    enabled: !debouncedQuery,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleShowPress = (show: Show) => {
    // Navigate to show details screen
    console.log('Navigate to show details:', show.title);
    // TODO: Add navigation once navigation stack is set up
    // navigation.navigate('ShowDetails', { showId: show.tmdb_id });
  };

  const handleAddToTracking = async (show: Show) => {
    if (!isAuthenticated || !user) {
      Alert.alert('Authentication Required', 'Please sign in to add shows to your tracking list.');
      return;
    }

    try {
      console.log('Adding show to tracking:', show.title);
      await addShow(user.id, show, 'want_to_watch');
      Alert.alert('Success! 🎉', `${show.title} has been added to your tracking list!`);
    } catch (error) {
      console.error('Error adding show to tracking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to add show to tracking.\n\n${errorMessage}`);
    }
  };

  const renderContent = () => {
    // Show search results
    if (debouncedQuery) {
      if (isSearching) {
        return <LoadingState message="Searching shows..." testID="search-loading" />;
      }

      if (hasSearchError) {
        return (
          <EmptyState
            title="Search Error"
            description="Failed to search shows. Please check your connection and try again."
            actionText="Retry"
            onActionPress={() => handleSearch(searchQuery)}
            testID="search-error"
          />
        );
      }

      if (!searchResults?.results.length) {
        return (
          <EmptyState
            title="No Results"
            description={`No shows found for "${debouncedQuery}". Try a different search term.`}
            testID="search-no-results"
          />
        );
      }

      return (
        <View>
          <Text variant="titleMedium" style={styles.resultsTitle} testID="search-results-title">
            Search results for "{debouncedQuery}" ({searchResults.results.length})
          </Text>
          {searchResults.results.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onPress={handleShowPress}
              onAddToTracking={isAuthenticated ? handleAddToTracking : undefined}
              showAddButton={isAuthenticated}
              testID={`search-result-${show.id}`}
            />
          ))}
        </View>
      );
    }

    // Show popular shows when no search is active
    if (isLoadingPopular) {
      return <LoadingState message="Loading popular shows..." testID="popular-loading" />;
    }

    if (popularError) {
      return (
        <EmptyState
          title="Connection Error"
          description="Failed to load popular shows. Please check your connection and try again."
          testID="popular-error"
        />
      );
    }

    return (
      <>
        <Text variant="headlineMedium" style={styles.title} testID="discover-title">
          Discover Shows
        </Text>
        
        {popularShows?.results && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle} testID="popular-shows-title">
              Popular Shows
            </Text>
            {popularShows.results.slice(0, 10).map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onPress={handleShowPress}
                onAddToTracking={isAuthenticated ? handleAddToTracking : undefined}
                showAddButton={isAuthenticated}
                testID={`popular-show-${show.id}`}
              />
            ))}
          </>
        )}
      </>
    );
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
          testID="search-input"
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        testID="search-scroll"
      >
        {renderContent()}
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
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
