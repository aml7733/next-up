import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { unstable_batchedUpdates } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Chip, 
  useTheme, 
  IconButton, 
  Menu, 
  Divider,
  ProgressBar 
} from 'react-native-paper';
import { Image } from 'expo-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Show, UserShow, WatchStatus, Episode } from '../types';
import { tmdbService } from '../services/tmdb';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';
import { LoadingState, ProgressSection, UpNextCard } from '../components';
import { useShowDetails } from '../hooks/useShowDetails';
import { useEpisodeProgress } from '../hooks/useEpisodeProgress';

type Props = NativeStackScreenProps<RootStackParamList, 'ShowDetails'>;

const WATCH_STATUS_OPTIONS: { value: WatchStatus; label: string; color: string }[] = [
  { value: 'want_to_watch', label: 'Want to Watch', color: '#2196F3' },
  { value: 'watching', label: 'Currently Watching', color: '#4CAF50' },
  { value: 'completed', label: 'Completed', color: '#9C27B0' },
  { value: 'dropped', label: 'Dropped', color: '#FF5722' },
];

export default function ShowDetailsScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { showId } = route.params;
  const { user, isAuthenticated } = useAuthStore();
  const { userShows, addShow, updateShowStatus, updateShowProgress, removeShow, markEpisodeWatched, reconcileProgress } = useShowsStore();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { show, totalEpisodes, seasonCount, isLoading, error } = useShowDetails(showId);
  // Derive tracked show instead of separate state to avoid extra effect update cycle
  const userShow = useMemo<UserShow | null>(() => {
    if (!show) return null;
    return userShows.find(us => us.show_id === show.tmdb_id) || null;
  }, [userShows, show]);
  
  const { nextEpisode, watchedCount, reload: reloadEpisodeData } = useEpisodeProgress(show?.tmdb_id, userShow);

  const handleAddToTracking = async () => {
    if (!isAuthenticated || !user || !show) {
      Alert.alert('Authentication Required', 'Please sign in to track this show.');
      return;
    }

    setIsUpdating(true);
    try {
      await addShow(user.id, show, 'want_to_watch');
      Alert.alert('Success! 🎉', `${show.title} has been added to your tracking list!`);
    } catch (error) {
      console.error('Error adding show:', error);
      Alert.alert('Error', 'Failed to add show to tracking.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFromTracking = async () => {
    if (!user || !userShow || !show) return;

    Alert.alert(
      'Remove Show',
      `Are you sure you want to remove "${show.title}" from your tracking list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await removeShow(user.id, show.tmdb_id);
              Alert.alert('Removed', `${show.title} has been removed from your tracking list.`);
            } catch (error) {
              console.error('Error removing show:', error);
              Alert.alert('Error', 'Failed to remove show from tracking.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (!user || !userShow || !show) return;

    setMenuVisible(false);
    setIsUpdating(true);
    try {
      await updateShowStatus(user.id, show.tmdb_id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update show status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkEpisodeWatched = async (season: number, episode: number) => {
    if (!user || !show || !userShow) return;
    setIsUpdating(true);
    try {
      await markEpisodeWatched(user.id, show.tmdb_id, season, episode, new Date());
      await reconcileProgress(user.id, show.tmdb_id);
      // After reconcile, userShow in state has updated pointer & derived fields
      // Refresh displayed counts / next episode
      reloadEpisodeData();
      // Completion check (optional) – keep using tmdbService for now
      const isCompleted = await tmdbService.isShowCompleted(show.tmdb_id, season, episode + 1);
      if (isCompleted) {
        await updateShowStatus(user.id, show.tmdb_id, 'completed');
        Alert.alert('🎉 Show Completed!', `Congratulations! You've finished watching ${show.title}!`);
      }
    } catch (error) {
      console.error('Error marking episode watched:', error);
      Alert.alert('Error', 'Failed to mark episode watched.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentStatusOption = () => {
    if (!userShow) return null;
    return WATCH_STATUS_OPTIONS.find(option => option.value === userShow.status);
  };

  if (isLoading) {
    return <LoadingState message="Loading show details..." />;
  }

  if (!show) {
    if (error) {
      // Align with previous behavior for tests
      Alert.alert('Error', error);
    }
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Show not found</Text>
      </View>
    );
  }

  const backdropUrl = tmdbService.getImageUrl(show.backdrop_path, 'w780');
  const posterUrl = tmdbService.getImageUrl(show.poster_path, 'w342');
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown';
  const rating = show.vote_average ? Math.round(show.vote_average * 10) / 10 : 'N/A';
  const statusOption = getCurrentStatusOption();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with backdrop */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onSurface}
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.goBack()}
          />
          
          {backdropUrl && (
            <Image
              source={{ uri: backdropUrl }}
              style={styles.backdrop}
              contentFit="cover"
            />
          )}
          
          <View style={styles.headerOverlay} />
        </View>

        {/* Show Information */}
        <View style={styles.content}>
          <View style={styles.showInfo}>
            {/* Poster and basic info */}
            <View style={styles.basicInfo}>
              {posterUrl && (
                <Image
                  source={{ uri: posterUrl }}
                  style={styles.poster}
                  contentFit="cover"
                />
              )}
              
              <View style={styles.titleSection}>
                <Text variant="headlineMedium" style={styles.title}>
                  {show.title}
                </Text>
                
                <Text variant="bodyLarge" style={[styles.metadata, { color: theme.colors.onSurfaceVariant }]}>
                  {year} • ⭐ {rating}
                </Text>

                {/* Status chip if tracking */}
                {statusOption && (
                  <Chip
                    style={[styles.statusChip, { backgroundColor: statusOption.color + '20' }]}
                    textStyle={{ color: statusOption.color }}
                  >
                    {statusOption.label}
                  </Chip>
                )}
              </View>
            </View>

            {/* Overview */}
            {show.overview && (
              <Card style={styles.overviewCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Overview
                  </Text>
                  <Text variant="bodyMedium" style={styles.overview}>
                    {show.overview}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* Tracking Section */}
            <Card style={styles.trackingCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Tracking
                </Text>

                {!isAuthenticated ? (
                  /* Not authenticated - show sign in message */
                  <View style={styles.notTrackingSection}>
                    <Text variant="bodyMedium" style={[styles.notTrackingText, { color: theme.colors.onSurfaceVariant }]}>
                      Sign in to add this show to your tracking list and keep track of your progress.
                    </Text>
                  </View>
                ) : !userShow ? (
                  /* Authenticated but not tracking - show add button */
                  <View style={styles.notTrackingSection}>
                    <Text variant="bodyMedium" style={[styles.notTrackingText, { color: theme.colors.onSurfaceVariant }]}>
                      Add this show to your tracking list to keep track of your progress.
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleAddToTracking}
                      style={styles.addButton}
                      disabled={isUpdating}
                      loading={isUpdating}
                    >
                      Add to Tracking
                    </Button>
                  </View>
                ) : (
                  /* Tracking - show progress and controls */
                  <View style={styles.trackingSection}>
                    {/* Status selector */}
                    <View style={styles.statusRow}>
                      <Text variant="bodyMedium">Status:</Text>
                      <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                          <Button
                            mode="outlined"
                            onPress={() => setMenuVisible(true)}
                            style={styles.statusButton}
                            disabled={isUpdating}
                          >
                            {statusOption?.label || 'Unknown'}
                          </Button>
                        }
                      >
                        {WATCH_STATUS_OPTIONS.map((option) => (
                          <Menu.Item
                            key={option.value}
                            onPress={() => handleStatusChange(option.value)}
                            title={option.label}
                          />
                        ))}
                      </Menu>
                    </View>

                    {/* Enhanced Progress and Up Next sections for watching shows */}
                    {userShow.status === 'watching' && (
                      <View style={styles.enhancedProgressSection}>
                        <ProgressSection
                          currentSeason={userShow.current_season}
                          currentEpisode={userShow.current_episode}
                          totalEpisodes={totalEpisodes}
                          watchedEpisodes={watchedCount}
                        />
                        
                        <UpNextCard
                          episode={nextEpisode}
                          onMarkWatched={() => {
                            if (nextEpisode) {
                              handleMarkEpisodeWatched(nextEpisode.season_number, nextEpisode.episode_number);
                            } else {
                              handleMarkEpisodeWatched(userShow.current_season, userShow.current_episode + 1);
                            }
                          }}
                          isLoading={isUpdating}
                        />
                      </View>
                    )}

                    <Divider style={styles.divider} />

                    {/* Remove button */}
                    <Button
                      mode="text"
                      onPress={handleRemoveFromTracking}
                      style={styles.removeButton}
                      textColor={theme.colors.error}
                      disabled={isUpdating}
                    >
                      Remove from Tracking
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    height: 200,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    elevation: 4,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    padding: 16,
    marginTop: -30,
    zIndex: 5,
  },
  showInfo: {
    gap: 16,
  },
  basicInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  metadata: {
    fontSize: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  overviewCard: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    lineHeight: 22,
  },
  trackingCard: {
    marginTop: 8,
  },
  notTrackingSection: {
    gap: 12,
  },
  notTrackingText: {
    lineHeight: 20,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  trackingSection: {
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusButton: {
    minWidth: 150,
  },
  progressSection: {
    gap: 8,
  },
  enhancedProgressSection: {
    gap: 16,
  },
  progressTitle: {
    fontWeight: '500',
  },
  progressControls: {
    gap: 8,
  },
  progressButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 8,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
});
