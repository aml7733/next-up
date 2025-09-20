import { useEffect, useState, useCallback } from 'react';
import { Show } from '../types';
import { tmdbService } from '../services/tmdb';

export function useShowDetails(showId: number) {
  const [show, setShow] = useState<Show | null>(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [seasonCount, setSeasonCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [showDetails, counts] = await Promise.all([
        tmdbService.getShowDetails(showId),
        tmdbService.getTotalEpisodeCount(showId),
      ]);
      setShow(showDetails);
      setTotalEpisodes(counts.totalEpisodes);
      setSeasonCount(counts.seasonCount);
    } catch (e) {
      console.error('Error loading show details:', e);
      setError('Failed to load show details');
    } finally {
      setIsLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    load();
  }, [load]);

  return { show, totalEpisodes, seasonCount, isLoading, error, reload: load };
}
