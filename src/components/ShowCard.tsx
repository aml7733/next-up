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
  onRemoveFromTracking?: (show: Show) => void;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  userShow?: any; // UserShow type for progress display
  testID?: string;
}

export default function ShowCard({ 
  show, 
  onPress, 
  onAddToTracking, 
  onRemoveFromTracking,
  showAddButton = false,
  showRemoveButton = false,
  userShow,
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

  const handleRemoveFromTracking = () => {
    if (onRemoveFromTracking) {
      onRemoveFromTracking(show);
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

            {/* Progress display for user shows */}
            {userShow && (
              <Text 
                variant="bodySmall" 
                style={[styles.progress, { color: theme.colors.primary }]}
                testID={`${testID || `show-card-${show.id}`}-progress`}
              >
                S{userShow.current_season}E{userShow.current_episode} • {userShow.status}
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

            {/* Remove from Tracking Button */}
            {showRemoveButton && onRemoveFromTracking && (
              <Button
                mode="outlined"
                onPress={handleRemoveFromTracking}
                style={styles.removeButton}
                contentStyle={styles.removeButtonContent}
                testID={`${testID || `show-card-${show.id}`}-remove-button`}
              >
                Remove
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
  progress: {
    fontWeight: '500',
    marginBottom: 8,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  addButtonContent: {
    paddingHorizontal: 8,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  removeButtonContent: {
    paddingHorizontal: 8,
  },
});
