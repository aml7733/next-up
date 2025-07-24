import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { Show } from '../types';
import { tmdbService } from '../services/tmdb';

interface TrendingSectionProps {
  title: string;
  shows: Show[];
  onShowPress: (showId: number) => void;
  isLoading?: boolean;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  title,
  shows,
  onShowPress,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.title}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.loadingCard, { backgroundColor: theme.colors.surfaceVariant }]} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (shows.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>No trending shows available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {shows.map((show, index) => (
          <TrendingShowCard
            key={show.id}
            show={show}
            onPress={() => onShowPress(show.tmdb_id)}
            rank={index + 1}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface TrendingShowCardProps {
  show: Show;
  onPress: () => void;
  rank: number;
}

const TrendingShowCard: React.FC<TrendingShowCardProps> = ({
  show,
  onPress,
  rank,
}) => {
  const theme = useTheme();
  const posterUrl = show.poster_path ? tmdbService.getImageUrl(show.poster_path, 'w300') : null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              style={styles.poster}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          ) : (
            <View style={[styles.poster, styles.placeholderImage, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          
          {/* Rank Badge */}
          <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.rankText, { color: theme.colors.onPrimary }]}>
              #{rank}
            </Text>
          </View>
        </View>

        <Card.Content style={styles.cardContent}>
          <Text variant="titleSmall" style={styles.showTitle} numberOfLines={2}>
            {show.title}
          </Text>
          
          <View style={styles.metadata}>
            {show.first_air_date && (
              <Text variant="bodySmall" style={styles.year}>
                {new Date(show.first_air_date).getFullYear()}
              </Text>
            )}
            
            {show.vote_average > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingIcon}>⭐</Text>
                <Text variant="bodySmall" style={styles.rating}>
                  {show.vote_average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {show.overview && (
            <Text 
              variant="bodySmall" 
              style={styles.overview} 
              numberOfLines={3}
            >
              {show.overview}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginRight: 12,
    width: 160,
  },
  card: {
    height: 320,
  },
  imageContainer: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    opacity: 0.6,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    paddingTop: 12,
  },
  showTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    minHeight: 36, // Ensure consistent height
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  year: {
    opacity: 0.7,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingIcon: {
    fontSize: 12,
  },
  rating: {
    opacity: 0.7,
  },
  overview: {
    opacity: 0.8,
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 20,
    marginHorizontal: 16,
  },
  loadingCard: {
    width: 160,
    height: 320,
    borderRadius: 12,
    marginRight: 12,
  },
});
