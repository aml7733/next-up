import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { UserShow } from '../types';
import { tmdbService } from '../services/tmdb';

export interface RecentActivity {
  id: string;
  userShow: UserShow;
  action: 'watched_episode' | 'started_show' | 'completed_show' | 'paused_show';
  episode?: {
    season: number;
    episode: number;
    name?: string;
  };
  timestamp: string;
}

interface RecentlyWatchedProps {
  activities: RecentActivity[];
  onShowPress?: (showId: number) => void;
  maxItems?: number;
}

export const RecentlyWatched: React.FC<RecentlyWatchedProps> = ({
  activities,
  onShowPress,
  maxItems = 5
}) => {
  const theme = useTheme();

  const getActivityText = (activity: RecentActivity) => {
    const show = activity.userShow.show;
    const showTitle = show?.title || 'Unknown Show';

    switch (activity.action) {
      case 'watched_episode':
        if (activity.episode) {
          return `Watched S${activity.episode.season}E${activity.episode.episode}${
            activity.episode.name ? ` "${activity.episode.name}"` : ''
          } of ${showTitle}`;
        }
        return `Watched an episode of ${showTitle}`;
      
      case 'started_show':
        return `Started watching ${showTitle}`;
      
      case 'completed_show':
        return `Completed ${showTitle}`;
      
      case 'paused_show':
        return `Paused ${showTitle}`;
      
      default:
        return `Updated ${showTitle}`;
    }
  };

  const getActivityIcon = (action: RecentActivity['action']) => {
    switch (action) {
      case 'watched_episode': return '▶️';
      case 'started_show': return '🎬';
      case 'completed_show': return '🎉';
      case 'paused_show': return '⏸️';
      default: return '📺';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMs = now.getTime() - activityTime.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return activityTime.toLocaleDateString();
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📈 Recent Activity
          </Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Your recent viewing activity will appear here.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📈 Recent Activity
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activitiesScroll}>
          {displayedActivities.map((activity, index) => {
            const show = activity.userShow.show;
            const posterUrl = show?.poster_path ? tmdbService.getImageUrl(show.poster_path, 'w200') : null;

            return (
              <View key={activity.id} style={styles.activityItem}>
                <Card 
                  style={[styles.activityCard, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => onShowPress?.(activity.userShow.show_id)}
                >
                  <Card.Content style={styles.activityContent}>
                    {/* Show Poster */}
                    <View style={styles.activityPoster}>
                      {posterUrl ? (
                        <Image
                          source={{ uri: posterUrl }}
                          style={styles.poster}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.poster, styles.posterPlaceholder, { backgroundColor: theme.colors.surface }]}>
                          <Text variant="bodySmall">📺</Text>
                        </View>
                      )}
                    </View>

                    {/* Activity Info */}
                    <View style={styles.activityInfo}>
                      <Chip 
                        mode="flat" 
                        compact
                        style={[styles.actionChip, { backgroundColor: theme.colors.primary }]}
                        textStyle={[styles.chipText, { color: theme.colors.onPrimary }]}
                      >
                        {getActivityIcon(activity.action)} {activity.action.replace('_', ' ')}
                      </Chip>

                      <Text 
                        variant="bodySmall" 
                        numberOfLines={2}
                        style={[styles.activityText, { color: theme.colors.onSurface }]}
                      >
                        {getActivityText(activity)}
                      </Text>

                      <Text 
                        variant="labelSmall" 
                        style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {getTimeAgo(activity.timestamp)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </View>
            );
          })}
        </ScrollView>

        {activities.length > maxItems && (
          <Text 
            variant="labelMedium" 
            style={[styles.moreText, { color: theme.colors.primary }]}
          >
            +{activities.length - maxItems} more activities
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  emptyCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  activitiesScroll: {
    marginBottom: 8,
  },
  activityItem: {
    marginRight: 12,
    width: 180,
  },
  activityCard: {
    elevation: 1,
  },
  activityContent: {
    padding: 8,
  },
  activityPoster: {
    alignItems: 'center',
    marginBottom: 8,
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 4,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    alignItems: 'center',
    gap: 4,
  },
  actionChip: {
    height: 20,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 12,
  },
  activityText: {
    textAlign: 'center',
    lineHeight: 14,
  },
  timeText: {
    textAlign: 'center',
  },
  moreText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default RecentlyWatched;
