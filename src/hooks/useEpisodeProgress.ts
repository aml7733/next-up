import { useCallback, useEffect, useState } from 'react';
import { Episode, UserShow } from '../types';
import { episodeService } from '../services/episodeService';

export function useEpisodeProgress(showId: number | undefined, userShow: UserShow | null | undefined) {
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);
  const [watchedCount, setWatchedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!showId || !userShow) return;
    setLoading(true);
    try {
      // Prefer derived watched_count
      if (typeof userShow.watched_count === 'number') {
        setWatchedCount(userShow.watched_count || 0);
      } else {
        setWatchedCount(Math.max(0, (userShow.current_episode || 1) - 1));
      }

      await episodeService.ensureSeasonCached(showId, userShow.current_season);
      await episodeService.ensureSeasonCached(showId, userShow.current_season + 1);
      const next = await episodeService.getNextEpisode(showId, userShow.current_season, userShow.current_episode, { skipUnaired: true });
      setNextEpisode(next);
    } finally {
      setLoading(false);
    }
  }, [showId, userShow]);

  useEffect(() => {
    load();
  }, [load]);

  return { nextEpisode, watchedCount, isLoading: loading, reload: load };
}
