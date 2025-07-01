import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import { Show } from '../types';
import { tmdbService } from '../services/tmdb';

interface ShowCardProps {
  show: Show;
  onPress?: (show: Show) => void;
  onAddToTracking?: (show: Show) => void;
  showAddButton?: boolean;
  testID?: string;
}

export default function ShowCard({ 
  show, 
  onPress, 
  onAddToTracking, 
  showAddButton = false,
  testID 
}: ShowCardProps) {
  const theme = useTheme();

  const posterUrl = tmdbService.getImageUrl(show.poster_path, 'w342');
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown';
  const rating = show.vote_average ? Math.round(show.vote_average * 10) / 10 : 'N/A';

  const handlePress = () => {
    if (onPress) {
      onPress(show);
    }
  };

  const handleAddToTracking = () => {
    if (onAddToTracking) {
      onAddToTracking(show);
    }
  };

  return (
    <Card 
      style={styles.card} 
      testID={testID || `show-card-${show.id}`}
    >
      <TouchableOpacity 
        onPress={handlePress}
        disabled={!onPress}
        testID={`${testID || `show-card-${show.id}`}-touchable`}
      >
        <View style={styles.content}>
          {/* Poster Image */}
          <View style={styles.posterContainer}>
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                style={styles.poster}
                contentFit="cover"
                testID={`${testID || `show-card-${show.id}`}-poster`}
              />
            ) : (
              <View style={[styles.poster, styles.placeholderPoster, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="bodySmall" style={{ textAlign: 'center' }}>
                  No Image
                </Text>
              </View>
            )}
          </View>

          {/* Show Info */}
          <View style={styles.info}>
            <Text 
              variant="titleMedium" 
              style={styles.title}
              numberOfLines={2}
              testID={`${testID || `show-card-${show.id}`}-title`}
            >
              {show.title}
            </Text>
            
            <Text 
              variant="bodySmall" 
              style={[styles.metadata, { color: theme.colors.onSurfaceVariant }]}
              testID={`${testID || `show-card-${show.id}`}-year`}
            >
              {year} • ⭐ {rating}
            </Text>

            {show.overview && (
              <Text 
                variant="bodySmall" 
                style={[styles.overview, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={3}
                testID={`${testID || `show-card-${show.id}`}-overview`}
              >
                {show.overview}
              </Text>
            )}

            {/* Add to Tracking Button */}
            {showAddButton && onAddToTracking && (
              <Button
                mode="contained"
                onPress={handleAddToTracking}
                style={styles.addButton}
                contentStyle={styles.addButtonContent}
                testID={`${testID || `show-card-${show.id}`}-add-button`}
              >
                Add to Tracking
              </Button>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  posterContainer: {
    marginRight: 12,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  placeholderPoster: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  metadata: {
    marginBottom: 8,
  },
  overview: {
    lineHeight: 16,
    marginBottom: 12,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  addButtonContent: {
    paddingHorizontal: 8,
  },
});
