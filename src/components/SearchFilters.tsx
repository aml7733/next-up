import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, Button, TextInput, useTheme } from 'react-native-paper';
import { SearchFilters, GenreInfo } from '../services/discoveryService';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  genres: GenreInfo[];
  onClear: () => void;
}

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  genres,
  onClear,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleGenre = (genreId: number) => {
    const currentGenres = filters.genre || [];
    const updatedGenres = currentGenres.includes(genreId)
      ? currentGenres.filter(id => id !== genreId)
      : [...currentGenres, genreId];
    
    updateFilter('genre', updatedGenres.length > 0 ? updatedGenres : undefined);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && 
    (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <View style={styles.container}>
      {/* Filter Toggle Button */}
      <View style={styles.header}>
        <Button
          mode="outlined"
          onPress={() => setExpanded(!expanded)}
          icon={expanded ? 'chevron-up' : 'tune'}
          style={styles.toggleButton}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        
        {hasActiveFilters && (
          <Button
            mode="text"
            onPress={onClear}
            textColor={theme.colors.error}
          >
            Clear
          </Button>
        )}
      </View>

      {/* Expanded Filters */}
      {expanded && (
        <View style={styles.filtersContainer}>
          {/* Year Range */}
          <View style={styles.filterSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Year</Text>
            <View style={styles.yearInputs}>
              <TextInput
                mode="outlined"
                label="From"
                value={filters.yearFrom?.toString() || ''}
                onChangeText={(text) => {
                  const year = parseInt(text) || undefined;
                  updateFilter('yearFrom', year);
                }}
                keyboardType="numeric"
                style={styles.yearInput}
                placeholder="2000"
              />
              <TextInput
                mode="outlined"
                label="To"
                value={filters.yearTo?.toString() || ''}
                onChangeText={(text) => {
                  const year = parseInt(text) || undefined;
                  updateFilter('yearTo', year);
                }}
                keyboardType="numeric"
                style={styles.yearInput}
                placeholder="2024"
              />
            </View>
          </View>

          {/* Rating */}
          <View style={styles.filterSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Minimum Rating
            </Text>
            <View style={styles.ratingChips}>
              {[6, 7, 8, 9].map(rating => (
                <Chip
                  key={rating}
                  selected={filters.minRating === rating}
                  onPress={() => updateFilter('minRating', 
                    filters.minRating === rating ? undefined : rating
                  )}
                  style={styles.ratingChip}
                >
                  {rating}+
                </Chip>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.filterSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusChips}>
              {[
                { value: 'returning', label: 'Returning' },
                { value: 'ended', label: 'Ended' },
                { value: 'continuing', label: 'Continuing' },
                { value: 'planned', label: 'Planned' },
              ].map(status => (
                <Chip
                  key={status.value}
                  selected={filters.status === status.value}
                  onPress={() => updateFilter('status', 
                    filters.status === status.value ? undefined : status.value as any
                  )}
                  style={styles.statusChip}
                >
                  {status.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Genres */}
          <View style={styles.filterSection}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreChips}>
              {genres.map(genre => (
                <Chip
                  key={genre.id}
                  selected={filters.genre?.includes(genre.id) || false}
                  onPress={() => toggleGenre(genre.id)}
                  style={styles.genreChip}
                >
                  {genre.name}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    marginRight: 8,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  yearInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  yearInput: {
    flex: 1,
  },
  ratingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    marginBottom: 4,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    marginBottom: 4,
  },
  genreChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    marginBottom: 4,
  },
});
