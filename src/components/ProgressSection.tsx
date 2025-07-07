import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';

interface ProgressSectionProps {
  currentSeason: number;
  currentEpisode: number;
  totalEpisodes?: number;
  watchedEpisodes?: number;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  currentSeason,
  currentEpisode,
  totalEpisodes,
  watchedEpisodes
}) => {
  const theme = useTheme();

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!totalEpisodes || totalEpisodes === 0) return 0;
    if (!watchedEpisodes) return 0;
    return Math.min(watchedEpisodes / totalEpisodes, 1);
  };

  const progress = calculateProgress();
  const progressPercentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        🎯 Progress
      </Text>
      
      <Text variant="bodyLarge" style={[styles.progressText, { color: theme.colors.onSurface }]}>
        Season {currentSeason}, Episode {currentEpisode}
        {totalEpisodes && ` of ${totalEpisodes}`}
      </Text>
      
      {totalEpisodes && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          <Text variant="bodyMedium" style={[styles.percentageText, { color: theme.colors.onSurfaceVariant }]}>
            {progressPercentage}% complete
          </Text>
        </View>
      )}
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
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    alignSelf: 'flex-end',
    fontSize: 12,
  },
});
