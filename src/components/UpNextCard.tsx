import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { Episode } from '../types';
import { tmdbService } from '../services/tmdb';

interface UpNextCardProps {
  episode: Episode | null;
  onMarkWatched: () => void;
  isLoading?: boolean;
}

export const UpNextCard: React.FC<UpNextCardProps> = ({
  episode,
  onMarkWatched,
  isLoading = false
}) => {
  const theme = useTheme();

  if (!episode) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📍 Up Next
        </Text>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={[styles.noEpisodeText, { color: theme.colors.onSurfaceVariant }]}>
              All caught up! 🎉
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const stillUrl = tmdbService.getImageUrl(episode.still_path, 'w300');
  const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA';

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        📍 Up Next
      </Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.episodeInfo}>
            {stillUrl && (
              <Image
                source={{ uri: stillUrl }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            )}
            
            <View style={styles.episodeDetails}>
              <Text variant="titleSmall" style={styles.episodeTitle} numberOfLines={2}>
                S{episode.season_number}E{episode.episode_number}: "{episode.name}"
              </Text>
              
              <Text variant="bodySmall" style={[styles.airDate, { color: theme.colors.onSurfaceVariant }]}>
                Airs: {airDate}
              </Text>
              
              {episode.overview && (
                <Text 
                  variant="bodySmall" 
                  style={[styles.overview, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {episode.overview}
                </Text>
              )}
              
              <Button
                mode="contained"
                onPress={onMarkWatched}
                style={styles.markWatchedButton}
                disabled={isLoading}
                loading={isLoading}
                compact
              >
                ▶️ Mark Watched
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  episodeInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 45,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  episodeDetails: {
    flex: 1,
    gap: 6,
  },
  episodeTitle: {
    fontWeight: '600',
    lineHeight: 18,
  },
  airDate: {
    fontSize: 12,
  },
  overview: {
    fontSize: 12,
    lineHeight: 16,
  },
  markWatchedButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  noEpisodeText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
