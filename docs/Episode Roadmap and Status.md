## Episode Tracking Roadmap & Current Status

Last updated: 2025-09-17

This document supersedes portions of:
- Enhanced ShowDetailsScreen Design.md
- Phase 3 Development Plan.md

Those files now act as historical design references. This is the authoritative, living roadmap for episode tracking + progress.

### Legend
- Done ✅  Implemented and in active use
- Partial 🟡  Some pieces exist but not wired end‑to‑end
- Missing ❌  Not started / placeholder only

---
### 1. Core Data Model (Priority: High)
| Item | Status | Notes |
|------|--------|-------|
| Episodes table population | 🟡 | Table exists; population only when ensureSeasonCached() is called. Not triggered from normal UI flows yet. |
| user_episodes usage | ❌ | markEpisodeWatched() exists but UI (ShowDetailsScreen) still updates pointer only via updateShowProgress. No rows written on watch. |
| Derived fields (watched_count, last_watched_at) on user_shows | ❌ | Columns not present. Computation done ad‑hoc via tmdbService.calculateWatchedEpisodes. |
| show_seasons meta cache | ❌ | Not implemented. Would prevent repeated season counting. |

### 2. Next Episode Logic (High)
| Item | Status | Notes |
|------|--------|-------|
| episodeService.getNextEpisode | ✅ | Implemented with cache -> optional refresh -> remote fallback. |
| Skip unaired episodes | ✅ | skipUnaired flag default true; compares air_date to now. |
| Season boundary advance | 🟡 | Works when cache has next season ep1; relies on ensureSeasonCached not always invoked. |
| New season detection flag | ❌ | No detection / flagging on data changes. |
| Stale metadata fallback | 🟡 | Remote fetch fallback exists, but no staleness policy/TTL. |

### 3. Progress Interaction (High)
| Item | Status | Notes |
|------|--------|-------|
| Mark Episode Watched (writes user_episodes + pointer reconciliation) | ❌ | Only pointer update via store; no user_episodes insert. |
| Recompute watched count locally | ❌ | Using TMDB helper; local derivation absent. |
| Bulk: mark season complete | ❌ | Not implemented. |
| Bulk: mark all previous | ❌ | Not implemented. |
| Undo last | ❌ | Not implemented. |
| Episode list UI (collapsible seasons) | ❌ | Not implemented. |

### 4. Activity & History (Medium)
| Item | Status | Notes |
|------|--------|-------|
| activity table | ❌ | Nonexistent. RecentlyWatched uses fabricated props. |
| Populate on events | ❌ | No event hooks. |
| Paginated query | ❌ | Not started. |
| RecentlyWatched powered by DB | ❌ | Component expects injected list. |

### 5. Sync Integration (Medium)
| Item | Status | Notes |
|------|--------|-------|
| includeEpisodes delta sync | ❌ | syncShowEpisodes only logs. |
| New season detection -> status flag | ❌ | Not implemented. |
| Merge remote vs local progress | ❌ | No reconciliation logic. |
| Lightweight episode metadata refresh schedule | ❌ | Single 24h schedule only. |

### 6. UI Enhancements (Medium)
| Item | Status | Notes |
|------|--------|-------|
| Enriched Up Next labels (airs in X days) | ❌ | Basic card only. |
| Visual progress (season vs show) | 🟡 | ProgressSection shows some stats; lacks season breakdown & percent from local. |
| Between seasons card | ✅ | Component exists (BetweenSeasonsCard). Integration breadth TBD. |
| Completion badge + upcoming toggle | ❌ | Not implemented. |

### 7. Edge Case Handling (Medium)
| Item | Status | Notes |
|------|--------|-------|
| Season 0 (specials) toggle | ❌ | Not handled. |
| Rewatch mode | ❌ | Not started. |
| Removed / missing episodes (pointer beyond end) | ❌ | No guard besides failing next lookup. |

### 8. Performance & Caching (Low → Important)
| Item | Status | Notes |
|------|--------|-------|
| Episode metadata TTL (e.g., 24h) | ❌ | No cached_at based invalidation used. |
| Lazy load seasons | ❌ | Full fetch pattern not yet wired. |
| Prefetch next season | ❌ | Absent. |

### 9. Settings / Preferences (Low)
| Item | Status | Notes |
|------|--------|-------|
| Auto-advance preference | ❌ | Not present in users.preferences. |
| Include specials preference | ❌ | Not present. |
| Notify on new season | ❌ | Not present. |

### 10. Observability / Debug (Low)
| Item | Status | Notes |
|------|--------|-------|
| Debug episode data screen | ❌ | Not implemented. |
| Integrity check (pointer vs watched) | ❌ | Not implemented. |

---
## Phase Execution Plan (Refined)

### Phase A – Foundation (High Priority)
1. Migration: add columns to user_shows (watched_count INTEGER DEFAULT 0, last_watched_at TEXT, has_new_season INTEGER DEFAULT 0) and create show_seasons + activity tables.
2. Wire markEpisodeWatched into ShowDetailsScreen progress updates (insert user_episodes row + recompute pointer if contiguous).
3. Replace tmdbService.calculateWatchedEpisodes call with local count (fallback remote if cache incomplete).
4. Introduce simple TTL (e.g., cached_at older than 24h => refresh season on demand).

### Phase B – Progress + UI
1. Episode list (collapsible per season, lazy load episodes). 
2. Bulk actions (season complete, mark previous, undo last via latest user_episodes entry). 
3. Enriched UpNext labels (relative air date, unaired state). 
4. RecentlyWatched powered by activity table.

### Phase C – Sync & Lifecycle
1. Episode delta sync (only fetch seasons with last_air_date change or missing). 
2. New season detection → set has_new_season flag & optionally flip status from completed→watching (feature-flagged). 
3. Reconciliation: if remote progress ahead & no local user_episodes gap, advance pointer; else preserve local. 
4. Separate short interval (e.g., 6h) episode metadata refresh vs 24h full sync.

### Phase D – Enhancements
1. Settings & preferences (auto-advance, include specials, notifications). 
2. Rewatch mode (new session context resetting pointer without losing prior history). 
3. Debug / integrity tooling & pointer repair routine.

---
## Immediate Next Actions (Suggested Sprint Slice)
1. Add migration infrastructure (increment DB_VERSION, maintain simple migrations array) and create migration for new columns + tables (user_shows add columns; show_seasons; activity).
2. Implement watched_count & last_watched_at maintenance in markEpisodeWatched (service layer) + pointer reconciliation logic.
3. Swap ShowDetailsScreen to use episodeService.getNextEpisode & local watched count.
4. Add minimal tests: episodeService pointer reconciliation, markEpisodeWatched -> watched_count update, nextEpisode across season boundary with unaired skip.

---
## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes on existing devices | Data loss if not migrated | Add versioned migrations; wrap in transaction. |
| Large initial season fetches | UI lag | Lazy load + progress indicator. |
| Inconsistent pointer vs watched episodes | Incorrect progress | Periodic integrity check + repair step. |

---
## Test Coverage Targets (Phase A)
| Scenario | Test Type |
|----------|-----------|
| markEpisodeWatched contiguous progression | Unit (episodeService) |
| markEpisodeWatched out-of-order (gap) no pointer advance | Unit |
| getNextEpisode season boundary with unaired skip | Unit |
| Migration adds columns default values | Integration (DB) |

---
## Open Questions
1. Should we store per-season watched counts for faster UI? (Likely yes in show_seasons or derived query view.)
2. How to handle special episodes (season 0) in progress percentage? (Configurable: include or exclude.)
3. Rewatch semantics: new pointer separate from original or maintain multiple sessions? (Design pending.)

---
## Approval Gate
On approval, implement Phase A steps in order above. Provide migration + updated ShowDetailsScreen integration in single PR.

---
## Changelog
2025-09-17: Initial consolidation & status mapping.
