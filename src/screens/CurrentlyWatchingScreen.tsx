import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, useTheme, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CurrentlyWatchingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { userShows, isLoading, loadUserShows, updateShowStatus } = useShowsStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'watching' | 'want_to_watch' | 'completed' | 'paused'>('all');

  useEffect(() => {
    // Load user shows when component mounts and user is available
    if (user?.id) {
      loadUserShows(user.id);
    }
  }, [user?.id, loadUserShows]);

  // Reload data when screen comes into focus (e.g., returning from ShowDetailsScreen)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUserShows(user.id);
      }
    }, [user?.id, loadUserShows])
  );

  const handleStatusUpdate = async (showId: number, newStatus: string) => {
    if (user?.id) {
      try {
        await updateShowStatus(user.id, showId, newStatus as any);
      } catch (error) {
        console.error('Failed to update show status:', error);
      }
    }
  };

  const handleShowPress = (showId: number) => {
    navigation.navigate('ShowDetails', { showId });
  };

  const handleFilterChange = (filter: 'all' | 'watching' | 'want_to_watch' | 'completed' | 'paused') => {
    setSelectedFilter(filter);
  };

  const shouldShowSection = (sectionType: 'watching' | 'want_to_watch' | 'completed' | 'paused') => {
    return selectedFilter === 'all' || selectedFilter === sectionType;
  };

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case 'watching': return 'Currently Watching';
      case 'want_to_watch': return 'Want to Watch';
      case 'completed': return 'Completed Shows';
      case 'paused': return 'Paused Shows';
      default: return 'My Shows';
    }
  };

  const hasShowsForCurrentFilter = () => {
    switch (selectedFilter) {
      case 'watching': return watchingShows.length > 0;
      case 'want_to_watch': return wantToWatchShows.length > 0;
      case 'completed': return completedShows.length > 0;
      case 'paused': return pausedShows.length > 0;
      default: return userShows.length > 0;
    }
  };

  const getEmptyFilterMessage = () => {
    switch (selectedFilter) {
      case 'watching': return 'No shows currently being watched. Start watching a show from your "Want to Watch" list!';
      case 'want_to_watch': return 'No shows in your watchlist. Search for shows to add them!';
      case 'completed': return 'No completed shows yet. Keep watching to build your completed collection!';
      case 'paused': return 'No paused shows. Any show you pause will appear here.';
      default: return 'Start tracking your favorite TV shows by searching for them in the Search tab.';
    }
  };

  const watchingShows = userShows.filter(show => show.status === 'watching');
  const completedShows = userShows.filter(show => show.status === 'completed');
  const pausedShows = userShows.filter(show => show.status === 'paused');
  const wantToWatchShows = userShows.filter(show => show.status === 'want_to_watch');

  // Calculate total count from all displayed categories
  const totalDisplayedShows = watchingShows.length + completedShows.length + pausedShows.length + wantToWatchShows.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        testID="currently-watching-scroll"
      >
        <Text variant="headlineMedium" style={styles.title} testID="currently-watching-title">
          {getFilterTitle()}
        </Text>
        
        {isLoading ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text variant="titleLarge" testID="loading-title">Loading...</Text>
              <Text variant="bodyMedium" style={styles.placeholderText} testID="loading-description">
                Getting your shows ready...
              </Text>
            </Card.Content>
          </Card>
        ) : userShows.length === 0 ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text variant="titleLarge" testID="no-shows-title">No shows yet</Text>
              <Text variant="bodyMedium" style={styles.placeholderText} testID="no-shows-description">
                Start tracking your favorite TV shows by searching for them in the Search tab.
              </Text>
            </Card.Content>
          </Card>
        ) : !hasShowsForCurrentFilter() ? (
          <Card style={styles.placeholderCard}>
            <Card.Content>
              <Text variant="titleLarge" testID="no-filtered-shows-title">No {selectedFilter.replace('_', ' ')} shows</Text>
              <Text variant="bodyMedium" style={styles.placeholderText} testID="no-filtered-shows-description">
                {getEmptyFilterMessage()}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            {watchingShows.length > 0 && shouldShowSection('watching') && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Currently Watching ({watchingShows.length})</Text>
                  {watchingShows.map(userShow => (
                    <TouchableOpacity 
                      key={userShow.id} 
                      style={styles.showItem}
                      onPress={() => handleShowPress(userShow.show_id)}
                      activeOpacity={0.7}
                      testID={`watching-show-${userShow.show_id}`}
                    >
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      <Text variant="bodySmall" style={styles.progressText}>
                        S{userShow.current_season}E{userShow.current_episode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Show want_to_watch shows */}
            {userShows.filter(show => show.status === 'want_to_watch').length > 0 && shouldShowSection('want_to_watch') && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Want to Watch ({userShows.filter(show => show.status === 'want_to_watch').length})</Text>
                  {userShows.filter(show => show.status === 'want_to_watch').map(userShow => (
                    <TouchableOpacity 
                      key={userShow.id} 
                      style={styles.showItemWithAction}
                      onPress={() => handleShowPress(userShow.show_id)}
                      activeOpacity={0.7}
                      testID={`want-to-watch-show-${userShow.show_id}`}
                    >
                      <View style={styles.showInfo}>
                        <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                        <Text variant="bodySmall" style={styles.progressText}>
                          Added {new Date(userShow.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Button 
                        mode="contained" 
                        compact 
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the TouchableOpacity
                          handleStatusUpdate(userShow.show_id, 'watching');
                        }}
                        style={styles.actionButton}
                      >
                        Start Watching
                      </Button>
                    </TouchableOpacity>
                  ))}
                </Card.Content>
              </Card>
            )}
            
            {completedShows.length > 0 && shouldShowSection('completed') && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Completed ({completedShows.length})</Text>
                  {completedShows.map(userShow => (
                    <TouchableOpacity 
                      key={userShow.id} 
                      style={styles.showItem}
                      onPress={() => handleShowPress(userShow.show_id)}
                      activeOpacity={0.7}
                      testID={`completed-show-${userShow.show_id}`}
                    >
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      {userShow.rating && (
                        <Text variant="bodySmall" style={styles.ratingText}>
                          ⭐ {userShow.rating}/10
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </Card.Content>
              </Card>
            )}

            {pausedShows.length > 0 && shouldShowSection('paused') && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Paused ({pausedShows.length})</Text>
                  {pausedShows.map(userShow => (
                    <TouchableOpacity 
                      key={userShow.id} 
                      style={styles.showItem}
                      onPress={() => handleShowPress(userShow.show_id)}
                      activeOpacity={0.7}
                      testID={`paused-show-${userShow.show_id}`}
                    >
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      <Text variant="bodySmall" style={styles.progressText}>
                        S{userShow.current_season}E{userShow.current_episode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}

        <View style={styles.statusRow} testID="status-chips">
          <Chip 
            mode={selectedFilter === 'all' ? 'flat' : 'outlined'} 
            style={styles.statusChip} 
            onPress={() => handleFilterChange('all')}
            testID="all-chip"
          >
            All ({totalDisplayedShows})
          </Chip>
          <Chip 
            mode={selectedFilter === 'watching' ? 'flat' : 'outlined'} 
            style={styles.statusChip} 
            testID="watching-chip"
            onPress={() => handleFilterChange('watching')}
            selected={selectedFilter === 'watching'}
          >
            Watching ({watchingShows.length})
          </Chip>
          <Chip 
            mode={selectedFilter === 'want_to_watch' ? 'flat' : 'outlined'} 
            style={styles.statusChip} 
            testID="want-to-watch-chip"
            onPress={() => handleFilterChange('want_to_watch')}
            selected={selectedFilter === 'want_to_watch'}
          >
            Want to Watch ({wantToWatchShows.length})
          </Chip>
          <Chip 
            mode={selectedFilter === 'completed' ? 'flat' : 'outlined'} 
            style={styles.statusChip} 
            testID="completed-chip"
            onPress={() => handleFilterChange('completed')}
            selected={selectedFilter === 'completed'}
          >
            Completed ({completedShows.length})
          </Chip>
          <Chip 
            mode={selectedFilter === 'paused' ? 'flat' : 'outlined'} 
            style={styles.statusChip} 
            testID="paused-chip"
            onPress={() => handleFilterChange('paused')}
            selected={selectedFilter === 'paused'}
          >
            Paused ({pausedShows.length})
          </Chip>
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
  showCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  showItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  showItemWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  showInfo: {
    flex: 1,
    marginRight: 12,
  },
  actionButton: {
    minWidth: 120,
  },
  progressText: {
    opacity: 0.7,
  },
  ratingText: {
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
