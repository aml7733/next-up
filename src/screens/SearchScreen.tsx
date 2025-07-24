import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Show, RootStackParamList } from '../types';
import { tmdbService } from '../services/tmdb';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';
import { ShowCard, EmptyState, LoadingState } from '../components';
import { SearchFiltersComponent } from '../components/SearchFilters';
import { TrendingSection } from '../components/TrendingSection';
import { discoveryService, SearchFilters } from '../services/discoveryService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuthStore();
  const { addShow } = useShowsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  // Initialize discovery service
  useEffect(() => {
    discoveryService.initialize();
  }, []);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Enhanced search with filters
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError,
    isError: hasSearchError 
  } = useQuery({
    queryKey: ['searchShows', debouncedQuery, filters],
    queryFn: () => discoveryService.searchShows(debouncedQuery, { filters }),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Trending shows query
  const { 
    data: trendingShows, 
    isLoading: isLoadingTrending, 
    error: trendingError 
  } = useQuery({
    queryKey: ['trendingShows'],
    queryFn: () => discoveryService.getTrendingShows(),
    enabled: !debouncedQuery,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Genres query for filters
  const { 
    data: genres = [], 
  } = useQuery({
    queryKey: ['genres'],
    queryFn: () => discoveryService.getGenres(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleShowPress = (show: Show) => {
    // Navigate to show details screen
    console.log('Navigate to show details:', show.title);
    navigation.navigate('ShowDetails', { showId: show.tmdb_id });
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
            onActionPress={() => setSearchQuery(searchQuery)}
            testID="search-error"
          />
        );
      }

      if (!searchResults?.shows.length) {
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
            Search results for "{debouncedQuery}" ({searchResults.shows.length})
          </Text>
          {searchResults.shows.map((show: Show) => (
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

    // Show trending and discovery when no search is active
    if (isLoadingTrending) {
      return <LoadingState message="Loading trending shows..." testID="trending-loading" />;
    }

    return (
      <>
        <Text variant="headlineMedium" style={styles.title} testID="discover-title">
          Discover Shows
        </Text>
        
        {trendingShows && (
          <>
            <TrendingSection
              title="📈 Trending This Week"
              shows={trendingShows.weekly}
              onShowPress={(showId) => navigation.navigate('ShowDetails', { showId })}
              isLoading={isLoadingTrending}
            />
            
            <TrendingSection
              title="🔥 Trending Today"
              shows={trendingShows.daily}
              onShowPress={(showId) => navigation.navigate('ShowDetails', { showId })}
              isLoading={isLoadingTrending}
            />
          </>
        )}

        {trendingError && (
          <EmptyState
            title="Connection Error"
            description="Failed to load trending shows. Please check your connection and try again."
            testID="trending-error"
          />
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
          onSubmitEditing={() => setDebouncedQuery(searchQuery)}
          style={styles.searchbar}
          testID="search-input"
        />
        
        {/* Search filters toggle */}
        {debouncedQuery && (
          <SearchFiltersComponent
            filters={filters}
            genres={genres}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        )}
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
