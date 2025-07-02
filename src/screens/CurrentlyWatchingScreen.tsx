import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, useTheme, Button } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';

export default function CurrentlyWatchingScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { userShows, isLoading, loadUserShows, updateShowStatus } = useShowsStore();

  useEffect(() => {
    // Load user shows when component mounts and user is available
    if (user?.id) {
      loadUserShows(user.id);
    }
  }, [user?.id, loadUserShows]);

  const handleStatusUpdate = async (showId: number, newStatus: string) => {
    if (user?.id) {
      try {
        await updateShowStatus(user.id, showId, newStatus as any);
      } catch (error) {
        console.error('Failed to update show status:', error);
      }
    }
  };

  const watchingShows = userShows.filter(show => show.status === 'watching');
  const completedShows = userShows.filter(show => show.status === 'completed');
  const pausedShows = userShows.filter(show => show.status === 'paused');
  const wantToWatchShows = userShows.filter(show => show.status === 'want_to_watch');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        testID="currently-watching-scroll"
      >
        <Text variant="headlineMedium" style={styles.title} testID="currently-watching-title">
          Currently Watching
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
        ) : (
          <>
            {watchingShows.length > 0 && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Currently Watching ({watchingShows.length})</Text>
                  {watchingShows.map(userShow => (
                    <View key={userShow.id} style={styles.showItem}>
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      <Text variant="bodySmall" style={styles.progressText}>
                        S{userShow.current_season}E{userShow.current_episode}
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Show want_to_watch shows */}
            {userShows.filter(show => show.status === 'want_to_watch').length > 0 && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Want to Watch ({userShows.filter(show => show.status === 'want_to_watch').length})</Text>
                  {userShows.filter(show => show.status === 'want_to_watch').map(userShow => (
                    <View key={userShow.id} style={styles.showItemWithAction}>
                      <View style={styles.showInfo}>
                        <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                        <Text variant="bodySmall" style={styles.progressText}>
                          Added {new Date(userShow.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Button 
                        mode="contained" 
                        compact 
                        onPress={() => handleStatusUpdate(userShow.show_id, 'watching')}
                        style={styles.actionButton}
                      >
                        Start Watching
                      </Button>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
            
            {completedShows.length > 0 && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Completed ({completedShows.length})</Text>
                  {completedShows.map(userShow => (
                    <View key={userShow.id} style={styles.showItem}>
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      {userShow.rating && (
                        <Text variant="bodySmall" style={styles.ratingText}>
                          ⭐ {userShow.rating}/10
                        </Text>
                      )}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {pausedShows.length > 0 && (
              <Card style={styles.showCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Paused ({pausedShows.length})</Text>
                  {pausedShows.map(userShow => (
                    <View key={userShow.id} style={styles.showItem}>
                      <Text variant="bodyLarge">{userShow.show?.title || 'Unknown Show'}</Text>
                      <Text variant="bodySmall" style={styles.progressText}>
                        S{userShow.current_season}E{userShow.current_episode}
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}

        <View style={styles.statusRow} testID="status-chips">
          <Chip mode="outlined" style={styles.statusChip} testID="watching-chip">
            Watching ({watchingShows.length})
          </Chip>
          <Chip mode="outlined" style={styles.statusChip} testID="want-to-watch-chip">
            Want to Watch ({wantToWatchShows.length})
          </Chip>
          <Chip mode="outlined" style={styles.statusChip} testID="completed-chip">
            Completed ({completedShows.length})
          </Chip>
          <Chip mode="outlined" style={styles.statusChip} testID="paused-chip">
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
