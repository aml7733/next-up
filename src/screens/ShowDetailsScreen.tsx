import React from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Text, Card, Button, Chip, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ShowDetails'>;

export default function ShowDetailsScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { showId } = route.params;

  // TODO: Fetch show details using showId
  const mockShow = {
    id: showId,
    title: 'Sample Show',
    overview: 'This is a sample show overview. In the actual implementation, this will be fetched from TMDB.',
    poster_path: null,
    backdrop_path: null,
    first_air_date: '2024-01-01',
    vote_average: 8.5,
    genre_ids: [1, 2, 3],
  };

  const handleAddToList = () => {
    // TODO: Implement add to user shows
    console.log('Add show to list:', showId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        {mockShow.backdrop_path && (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w500${mockShow.backdrop_path}` }}
            style={styles.backdrop}
          />
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            {mockShow.poster_path && (
              <Image 
                source={{ uri: `https://image.tmdb.org/t/p/w300${mockShow.poster_path}` }}
                style={styles.poster}
              />
            )}
            
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.title}>
                {mockShow.title}
              </Text>
              
              <Text variant="bodyMedium" style={styles.year}>
                {new Date(mockShow.first_air_date).getFullYear()}
              </Text>
              
              <View style={styles.rating}>
                <Text variant="titleMedium">
                  ⭐ {mockShow.vote_average.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button 
              mode="contained" 
              onPress={handleAddToList}
              style={styles.actionButton}
            >
              Add to My List
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
            >
              Mark as Watched
            </Button>
          </View>

          <Card style={styles.overviewCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Overview
              </Text>
              <Text variant="bodyMedium">
                {mockShow.overview}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Genres
              </Text>
              <View style={styles.genreContainer}>
                <Chip mode="outlined" style={styles.genreChip}>Drama</Chip>
                <Chip mode="outlined" style={styles.genreChip}>Comedy</Chip>
                <Chip mode="outlined" style={styles.genreChip}>Action</Chip>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: -50, // Overlap with backdrop
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  year: {
    opacity: 0.7,
    marginBottom: 8,
  },
  rating: {
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  overviewCard: {
    marginBottom: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    marginBottom: 4,
  },
});
