import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, useTheme, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';
import { RootStackParamList } from '../types';
import { 
  EnhancedShowCard, 
  RecentlyWatched, 
  BetweenSeasonsCard, 
  OnboardingModal 
} from '../components';
import type { RecentActivity } from '../components/RecentlyWatched';
import type { BetweenSeasonsShow } from '../components/BetweenSeasonsCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CurrentlyWatchingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuthStore();
  const { userShows, isLoading, loadUserShows, updateShowStatus, updateShowProgress } = useShowsStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'watching' | 'want_to_watch' | 'completed' | 'paused'>('all');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Mock recent activities - in a real app, this would come from a store
  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      userShow: userShows[0] || {} as any,
      action: 'watched_episode',
      episode: { season: 2, episode: 5, name: 'The Door' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
  ]);

  useEffect(() => {
    // Load user shows when component mounts and user is available
    if (user?.id) {
      loadUserShows(user.id);
    }
  }, [user?.id, loadUserShows]);

  // Show onboarding for new users
  useEffect(() => {
    if (isAuthenticated && userShows.length === 0 && !isLoading) {
      const hasSeenOnboarding = typeof localStorage !== 'undefined' 
        ? localStorage.getItem('hasSeenOnboarding') 
        : null;
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, userShows.length, isLoading]);

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

  const handleMarkNextEpisode = async (showId: number) => {
    if (!user?.id) return;
    
    const userShow = userShows.find(show => show.show_id === showId);
    if (!userShow) return;
    
    try {
      await updateShowProgress(
        user.id, 
        showId, 
        userShow.current_season, 
        userShow.current_episode + 1
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleShowPress = (showId: number) => {
    navigation.navigate('ShowDetails', { showId });
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  const handleAddPopularShow = async (showId: number) => {
    // This would integrate with the search/add functionality
    console.log('Adding popular show:', showId);
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

        {/* Phase 2: Recent Activity Section */}
        {userShows.length > 0 && recentActivities.length > 0 && (
          <RecentlyWatched
            activities={recentActivities}
            onShowPress={handleShowPress}
            maxItems={3}
          />
        )}

        {/* Phase 2: Between Seasons Section */}
        {userShows.length > 0 && (
          <BetweenSeasonsCard
            shows={[]}
            onShowPress={handleShowPress}
            onNotificationToggle={(showId, enabled) => {
              console.log('Toggle notification for show:', showId, enabled);
            }}
          />
        )}
        
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
            {/* Phase 2: Enhanced Show Cards for Currently Watching */}
            {watchingShows.length > 0 && shouldShowSection('watching') && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Currently Watching ({watchingShows.length})
                </Text>
                {watchingShows.map(userShow => (
                  <EnhancedShowCard
                    key={userShow.id}
                    userShow={userShow}
                    onPress={() => handleShowPress(userShow.show_id)}
                    onMarkNextEpisode={() => handleMarkNextEpisode(userShow.show_id)}
                    onQuickStatusChange={(status) => handleStatusUpdate(userShow.show_id, status)}
                    testID={`watching-show-${userShow.show_id}`}
                  />
                ))}
              </View>
            )}

            {/* Phase 2: Enhanced Show Cards for Want to Watch */}
            {wantToWatchShows.length > 0 && shouldShowSection('want_to_watch') && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Want to Watch ({wantToWatchShows.length})
                </Text>
                {wantToWatchShows.map(userShow => (
                  <EnhancedShowCard
                    key={userShow.id}
                    userShow={userShow}
                    onPress={() => handleShowPress(userShow.show_id)}
                    onQuickStatusChange={(status) => handleStatusUpdate(userShow.show_id, status)}
                    testID={`want-to-watch-show-${userShow.show_id}`}
                  />
                ))}
              </View>
            )}

            {/* Phase 2: Enhanced Show Cards for Completed */}
            {completedShows.length > 0 && shouldShowSection('completed') && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Completed ({completedShows.length})
                </Text>
                {completedShows.map(userShow => (
                  <EnhancedShowCard
                    key={userShow.id}
                    userShow={userShow}
                    onPress={() => handleShowPress(userShow.show_id)}
                    showProgress={false}
                    testID={`completed-show-${userShow.show_id}`}
                  />
                ))}
              </View>
            )}

            {/* Phase 2: Enhanced Show Cards for Paused */}
            {pausedShows.length > 0 && shouldShowSection('paused') && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Paused ({pausedShows.length})
                </Text>
                {pausedShows.map(userShow => (
                  <EnhancedShowCard
                    key={userShow.id}
                    userShow={userShow}
                    onPress={() => handleShowPress(userShow.show_id)}
                    onQuickStatusChange={(status) => handleStatusUpdate(userShow.show_id, status)}
                    testID={`paused-show-${userShow.show_id}`}
                  />
                ))}
              </View>
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
  section: {
    marginBottom: 24,
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
