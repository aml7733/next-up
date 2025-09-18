## Episode Tracking Roadmap & Current Status

Last updated: 2025-09-18 (post Phase A episode progression tests)

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
| Episodes table population | 🟡 | Table + cacheSeasonEpisodes in place; population occurs only when explicitly invoked (not yet auto-triggered by UI fetch). |
| user_episodes usage | 🟡 | markEpisodeWatched() writes rows; UI not yet calling it (pointer updates bypass user_episodes). |
| Derived fields (watched_count, last_watched_at) on user_shows | ✅ | Maintained via reconcileProgress after markEpisodeWatched. |
| show_seasons meta cache | 🟡 | Table created (migration); no write logic yet. |

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
| Mark Episode Watched (writes user_episodes + pointer reconciliation) | ✅ | store.markEpisodeWatched implemented with DB writes + reconcileProgress pointer advancement. |
| Recompute watched count locally | ✅ | reconcileProgress counts user_episodes and updates derived fields. UI consumption pending but data path complete. |
| Bulk: mark season complete | ❌ | Not implemented. |
| Bulk: mark all previous | ❌ | Not implemented. |
| Undo last | ❌ | Not implemented. |
| Episode list UI (collapsible seasons) | ❌ | Not implemented. |

### 4. Activity & History (Medium)
| Item | Status | Notes |
|------|--------|-------|
| activity table | 🟡 | Table created; no writes yet. |
| Populate on events | ❌ | Event hooks not implemented. |
| Paginated query | ❌ | Not started. |
| RecentlyWatched powered by DB | ❌ | Component expects injected list. |

### 5. Sync Integration (Medium)
| Item | Status | Notes |
|------|--------|-------|
| includeEpisodes delta sync | ❌ | syncShowEpisodes logs episodes; no differential logic. |
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
Status: Core DB helpers + store wiring complete ✅; next: UI integration & TTL/seasons metadata.

1. (Done) Add columns to user_shows (watched_count, last_watched_at, has_new_season) + create show_seasons & activity tables + user_episodes table (migration v2).
2. (Done) Wire markEpisodeWatched into store (DB write + derived fields + gap-aware pointer).
3. (Pending) UI layer: invoke markEpisodeWatched from ShowDetailsScreen (button / swipe / auto-advance interaction).
4. (Pending) Replace any remote watched count usage with derived watched_count (fallback logic still to audit/remove).
5. (Next) Introduce simple TTL (cached_at >24h) => on-demand season refresh before next-episode calculation.
6. (Next) Begin writing show_seasons rows when caching seasons; maintain episode_count & last_air_date.
7. (Deferred) Activity logging on watch event.

### Phase B – Progress + UI
1. Episode list component:
	- (B1.1) Season fetch on expand (ensureSeasonCached + TTL check)
	- (B1.2) Collapsible UI scaffold
	- (B1.3) Episode row: watched state, tap to toggle (markEpisodeWatched / future unwatch)
	- (B1.4) Perf: virtualized list per expanded season
2. Bulk actions:
	- (B2.1) Mark season complete (iterate remaining episodes -> batch insert user_episodes)
	- (B2.2) Mark all previous (compute all episodes < selected contiguous gap, insert)
	- (B2.3) Undo last (delete latest user_episodes row + reconcileProgress)
3. UpNext enrichment:
	- (B3.1) Relative air date label (in X days / tomorrow / today / aired X days ago)
	- (B3.2) Unaired badge styling
	- (B3.3) Loading shimmer while resolving next episode
4. RecentlyWatched feed:
	- (B4.1) Activity logging on watch
	- (B4.2) Query last N activity rows (JOIN shows)
	- (B4.3) UI list & navigation to episode context (future EpisodeDetails)

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
## Immediate Next Actions (Refocused After Logging Work)
1. (Done) Store markEpisodeWatched + reconciliation (pointer, derived fields).
2. (Done) Unit tests: contiguous progression, gap handling, gap fill, derived fields update.
3. (Pending) UI integration: ShowDetailsScreen trigger(s) for markEpisodeWatched.
4. (Pending) Replace remote watched count usage (audit codepaths referencing tmdb counts).
5. (Next) TTL check (episodeService.ensureSeasonCached with cached_at +24h refresh trigger).
6. (Next) Persist show_seasons on cacheSeasonEpisodes (episode_count, last_air_date).
7. (Planned) Unit tests: TTL refresh, nextEpisode season boundary with newly refreshed data.
8. (Planned) Activity logging skeleton (write activity row on watch) + adapter for RecentlyWatched.

Stretch (if time): skeleton activity logging on markEpisodeWatched (write activity row) feeding a query adapter for RecentlyWatched.

---
## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes on existing devices | Data loss if not migrated | Add versioned migrations; wrap in transaction. |
| Large initial season fetches | UI lag | Lazy load + progress indicator. |
| Inconsistent pointer vs watched episodes | Incorrect progress | Periodic integrity check + repair step. |

---
## Observability Note
Selective logger introduced (logger.errorExpected vs logger.error) to keep negative-path test noise suppressed while surfacing unexpected issues. As we wire markEpisodeWatched and reconciliation logic, instrument with logger.info (low volume) only where it aids debugging; avoid verbose per-episode logs in production builds.

---
## Test Coverage Targets (Phase A)
| Scenario | Test Type |
|----------|-----------|
| markEpisodeWatched contiguous progression | Unit (store) ✅ |
| markEpisodeWatched out-of-order (gap) no pointer advance | Unit (store) ✅ |
| markEpisodeWatched gap fill advances pointer | Unit (store) ✅ |
| Derived fields updated (watched_count, last_watched_at) | Unit (store) ✅ |
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
2025-09-18: Updated statuses post-migration implementation; added refined Phase A next steps.
2025-09-18: Marked markEpisodeWatched + reconcileProgress complete; added new unit tests & adjusted immediate next actions.
