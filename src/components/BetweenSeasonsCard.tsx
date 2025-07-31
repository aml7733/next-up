import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, useTheme, IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { UserShow } from '../types';
import { tmdbService } from '../services/tmdb';

export interface BetweenSeasonsShow extends UserShow {
  show: UserShow['show'] & {
    next_season_date?: string;
    renewal_status?: 'renewed' | 'cancelled' | 'ended' | 'unknown';
    seasons_count?: number;
    last_aired_season?: number;
  };
}

interface BetweenSeasonsCardProps {
  shows: BetweenSeasonsShow[];
  onShowPress?: (showId: number) => void;
  onNotificationToggle?: (showId: number, enabled: boolean) => void;
}

export const BetweenSeasonsCard: React.FC<BetweenSeasonsCardProps> = ({
  shows,
  onShowPress,
  onNotificationToggle
}) => {
  const theme = useTheme();

  const getStatusColor = (status: BetweenSeasonsShow['show']['renewal_status']) => {
    switch (status) {
      case 'renewed': return theme.colors.primary;
      case 'cancelled': return theme.colors.error;
      case 'ended': return theme.colors.outline;
      default: return theme.colors.secondary;
    }
  };

  const getStatusIcon = (status: BetweenSeasonsShow['show']['renewal_status']) => {
    switch (status) {
      case 'renewed': return '✅';
      case 'cancelled': return '❌';
      case 'ended': return '🏁';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: BetweenSeasonsShow['show']['renewal_status']) => {
    switch (status) {
      case 'renewed': return 'Renewed';
      case 'cancelled': return 'Cancelled';
      case 'ended': return 'Ended';
      default: return 'Unknown';
    }
  };

  const formatNextSeasonDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    const now = new Date();
    
    if (date < now) return 'Past Due';
    
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      return `${diffDays} days`;
    } else if (diffDays <= 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    }
  };

  if (shows.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ⏳ Between Seasons
          </Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Shows waiting for new seasons will appear here.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          ⏳ Between Seasons ({shows.length})
        </Text>
        
        {shows.map((userShow) => {
          const show = userShow.show;
          const posterUrl = show?.poster_path ? tmdbService.getImageUrl(show.poster_path, 'w200') : null;
          const renewalStatus = show.renewal_status || 'unknown';

          return (
            <TouchableOpacity 
              key={userShow.id}
              style={styles.showItem}
              onPress={() => onShowPress?.(userShow.show_id)}
              activeOpacity={0.7}
            >
              <View style={styles.showContent}>
                {/* Show Poster */}
                <View style={styles.posterContainer}>
                  {posterUrl ? (
                    <Image
                      source={{ uri: posterUrl }}
                      style={styles.poster}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.poster, styles.posterPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text variant="bodySmall">📺</Text>
                    </View>
                  )}
                </View>

                {/* Show Info */}
                <View style={styles.showInfo}>
                  <Text variant="titleSmall" numberOfLines={1} style={styles.title}>
                    {show?.title || 'Unknown Show'}
                  </Text>

                  <View style={styles.statusRow}>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[styles.statusChip, { borderColor: getStatusColor(renewalStatus) }]}
                      textStyle={[styles.chipText, { color: getStatusColor(renewalStatus) }]}
                    >
                      {getStatusIcon(renewalStatus)} {getStatusLabel(renewalStatus)}
                    </Chip>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text variant="bodySmall" style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                      Last watched: S{userShow.current_season}E{userShow.current_episode}
                    </Text>
                    
                    {show.next_season_date && renewalStatus === 'renewed' && (
                      <Text variant="bodySmall" style={[styles.nextSeasonText, { color: theme.colors.primary }]}>
                        Next season: {formatNextSeasonDate(show.next_season_date)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Notification Toggle */}
                <View style={styles.actions}>
                  {renewalStatus === 'renewed' && (
                    <IconButton
                      icon="bell-outline"
                      size={20}
                      iconColor={theme.colors.primary}
                      onPress={() => onNotificationToggle?.(userShow.show_id, true)}
                      style={styles.notificationButton}
                    />
                  )}
                  
                  {renewalStatus === 'cancelled' && (
                    <Button
                      mode="text"
                      compact
                      onPress={() => onShowPress?.(userShow.show_id)}
                      textColor={theme.colors.error}
                      style={styles.actionButton}
                    >
                      Details
                    </Button>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  showItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  showContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  posterContainer: {
    marginRight: 12,
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
  showInfo: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  detailsRow: {
    gap: 2,
  },
  detailText: {
    fontSize: 12,
  },
  nextSeasonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
    gap: 4,
  },
  notificationButton: {
    margin: 0,
  },
  actionButton: {
    margin: 0,
  },
});

export default BetweenSeasonsCard;
