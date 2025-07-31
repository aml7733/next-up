import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, useTheme, IconButton, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { UserShow } from '../types';
import { tmdbService } from '../services/tmdb';

interface EnhancedShowCardProps {
  userShow: UserShow;
  onPress: () => void;
  onMarkNextEpisode?: () => void;
  onQuickStatusChange?: (status: 'watching' | 'completed' | 'paused') => void;
  showProgress?: boolean;
  testID?: string;
}

export const EnhancedShowCard: React.FC<EnhancedShowCardProps> = ({
  userShow,
  onPress,
  onMarkNextEpisode,
  onQuickStatusChange,
  showProgress = true,
  testID
}) => {
  const theme = useTheme();
  const show = userShow.show;
  const posterUrl = show?.poster_path ? tmdbService.getImageUrl(show.poster_path, 'w200') : null;

  const getProgressText = () => {
    if (userShow.status === 'completed') {
      return 'Completed';
    } else if (userShow.status === 'want_to_watch') {
      return `Added ${new Date(userShow.created_at).toLocaleDateString()}`;
    } else {
      return `S${userShow.current_season}E${userShow.current_episode}`;
    }
  };

  const getStatusColor = () => {
    switch (userShow.status) {
      case 'watching': return theme.colors.primary;
      case 'completed': return theme.colors.tertiary;
      case 'paused': return theme.colors.error;
      case 'want_to_watch': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const getStatusLabel = () => {
    switch (userShow.status) {
      case 'watching': return 'Watching';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      case 'want_to_watch': return 'Want to Watch';
      default: return userShow.status;
    }
  };

  const renderQuickActions = () => {
    const actions = [];

    if (userShow.status === 'watching' && onMarkNextEpisode) {
      actions.push(
        <IconButton
          key="mark-watched"
          icon="play-circle"
          size={20}
          iconColor={theme.colors.primary}
          onPress={onMarkNextEpisode}
          testID={`mark-watched-${userShow.show_id}`}
          style={styles.quickAction}
        />
      );
    }

    if (userShow.status === 'want_to_watch' && onQuickStatusChange) {
      actions.push(
        <Button
          key="start-watching"
          mode="contained"
          compact
          onPress={() => onQuickStatusChange('watching')}
          testID={`start-watching-${userShow.show_id}`}
          style={styles.quickAction}
        >
          Start
        </Button>
      );
    }

    if (userShow.status === 'paused' && onQuickStatusChange) {
      actions.push(
        <Button
          key="resume-watching"
          mode="outlined"
          compact
          onPress={() => onQuickStatusChange('watching')}
          testID={`resume-watching-${userShow.show_id}`}
          style={styles.quickAction}
        >
          Resume
        </Button>
      );
    }

    return actions;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} testID={testID}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.cardContent}>
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
            <View style={styles.header}>
              <Text variant="titleMedium" numberOfLines={1} style={styles.title}>
                {show?.title || 'Unknown Show'}
              </Text>
              
              <Chip 
                mode="outlined" 
                compact
                textStyle={styles.statusText}
                style={[styles.statusChip, { borderColor: getStatusColor() }]}
              >
                {getStatusLabel()}
              </Chip>
            </View>
            
            {showProgress && (
              <Text 
                variant="bodySmall" 
                style={[styles.progressText, { color: getStatusColor() }]}
              >
                {getProgressText()}
              </Text>
            )}

            {show?.overview && (
              <Text 
                variant="bodySmall" 
                numberOfLines={2} 
                style={[styles.overview, { color: theme.colors.onSurfaceVariant }]}
              >
                {show.overview}
              </Text>
            )}

            {/* Quick Actions Row */}
            <View style={styles.actionsRow}>
              {renderQuickActions()}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  posterContainer: {
    marginRight: 12,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  showInfo: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
  },
  progressText: {
    fontWeight: '500',
  },
  overview: {
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quickAction: {
    marginVertical: 0,
  },
});

export default EnhancedShowCard;
