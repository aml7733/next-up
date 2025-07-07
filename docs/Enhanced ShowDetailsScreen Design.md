# Enhanced ShowDetailsScreen Design

## Overview

This document outlines the design and implementation plan for enhancing the ShowDetailsScreen with comprehensive episode tracking capabilities. The current implementation provides basic show information and simple progress tracking, but lacks detailed episode management and visual progress indicators.

## TMDB API Capabilities Analysis

### Available Episode Data
The TMDB API provides rich episode data through the `/tv/{series_id}/season/{season_number}` endpoint:

```json
{
  "air_date": "2008-01-20",
  "episode_number": 1,
  "name": "Pilot", 
  "overview": "When an unassuming high school chemistry teacher discovers he has a rare form of lung cancer...",
  "still_path": "/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg",
  "vote_average": 8.474,
  "season_number": 1,
  "runtime": 59
}
```

### What We Can Build
- ✅ **Episode thumbnails** (`still_path`)
- ✅ **Episode titles and descriptions** (`name`, `overview`)
- ✅ **Air dates** (`air_date`)
- ✅ **Episode ratings** (`vote_average`)
- ✅ **Runtime** (`runtime`)
- ✅ **Season organization** (`season_number`, `episode_number`)

## Enhanced UI Mockup

### Visual Layout
```
┌─────────────────────────────────────┐
│ 🔙  [Backdrop Image]                │  ← Header remains same
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [Poster] Breaking Bad               │  ← Basic info remains
│          2008 • ⭐ 9.5              │
│          🟢 Currently Watching      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Overview                            │  ← Overview remains
│ High school chemistry teacher...    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐ 
│ 📺 Tracking                         │
│                                     │
│ Status: [Currently Watching ▼]     │  ← Status dropdown remains
│                                     │
│ ──── NEW SECTION ────               │
│                                     │
│ 🎯 Progress                         │
│ Season 1, Episode 7 of 7           │
│ ████████████████████░░░ 85%         │  ← Progress bar
│                                     │
│ 📍 Up Next                          │
│ ┌─────────────────────────────────┐ │
│ │ [📷] S2E1: "Seven Thirty-Seven" │ │  ← Next episode card
│ │      Airs: March 8, 2009         │ │
│ │      Walt and Jesse...          │ │
│ │      [▶️ Mark Watched]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📋 Episodes (Season 1)              │
│ ┌─────────────────────────────────┐ │ ← Season dropdown
│ │ Season 1 ▼                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✅ E1  Pilot                (59min) │ ← Episode list
│ ✅ E2  Cat's in the Bag... (49min)  │   ✅ = watched
│ ✅ E3  ...And the Bag's...  (49min) │   ⭕ = current
│ ✅ E4  Cancer Man           (49min)  │   ⚪ = unwatched
│ ✅ E5  Gray Matter          (49min)  │
│ ✅ E6  Crazy Handful...     (49min)  │
│ ⭕ E7  A No-Rough-Stuff...  (48min) │
│                                     │
│ ────────────────────────────────── │
│ 🗑️ Remove from Tracking           │  ← Remove button remains
└─────────────────────────────────────┘
```

## Component Breakdown

### 1. Progress Section
```
🎯 Progress
Season 1, Episode 7 of 7
████████████████████░░░ 85%
```

**Features:**
- Current season/episode display
- Visual progress bar (episodes watched / total episodes)
- Percentage completion
- Uses React Native Paper's ProgressBar component

### 2. Up Next Card
```
📍 Up Next
┌─────────────────────────────────┐
│ [📷] S2E1: "Seven Thirty-Seven" │  ← Episode thumbnail
│      Airs: March 8, 2009         │  ← Air date
│      Walt and Jesse...          │  ← Episode overview (truncated)
│      [▶️ Mark Watched]           │  ← Action button
└─────────────────────────────────┘
```

**Features:**
- Shows next episode to watch
- Episode thumbnail from TMDB
- Air date and description
- Quick "Mark Watched" action
- Handles season transitions (shows S2E1 after S1 finale)

### 3. Episodes List
```
📋 Episodes (Season 1)
┌─────────────────────────────────┐
│ Season 1 ▼                      │  ← Season selector dropdown
└─────────────────────────────────┘

✅ E1  Pilot                (59min)  ← Status icons:
✅ E2  Cat's in the Bag... (49min)     ✅ Watched
✅ E3  ...And the Bag's...  (49min)     ⭕ Current episode  
✅ E4  Cancer Man           (49min)     ⚪ Unwatched
✅ E5  Gray Matter          (49min)
✅ E6  Crazy Handful...     (49min)
⭕ E7  A No-Rough-Stuff...  (48min)
```

**Features:**
- Season dropdown selector
- Episode list with watch status
- Episode names and runtime
- Tap to mark watched/unwatched
- Visual indicators for watch status

## Interactive Features

### User Interactions
- **Progress bar**: Visual completion indicator
- **Episode items**: Tap to mark watched/unwatched
- **Season dropdown**: Switch between seasons
- **Up Next card**: Shows next episode to watch with details
- **Mark Watched button**: Quick action for next episode

### State Management
- **Episode watch status**: Tracked in local database
- **Progress calculation**: Dynamically calculated from watched episodes
- **Next episode logic**: Automatically determines next unwatched episode
- **Season data**: Cached from TMDB API calls

## Technical Implementation Plan

### Phase 1: Enhanced Progress Display (2-3 hours)
1. Add progress bar showing completion percentage
2. Better "Up Next" section with episode details
3. Improve progress text display

**Components to add:**
- `ProgressSection.tsx` - Shows progress bar and stats
- `UpNextCard.tsx` - Displays next episode to watch

### Phase 2: Episode Data Integration (4-5 hours)
1. Add TMDB episode fetching to `tmdbService`
2. Implement episode caching in database
3. Add episode loading states and error handling

**API methods to add:**
- `tmdbService.getSeasonEpisodes()` - Already exists
- `tmdbService.getShowSeasons()` - Get all seasons info
- Database methods for episode caching

### Phase 3: Episode List UI (6-8 hours)
1. Create episode list/grid component
2. Add season navigation
3. Individual episode marking functionality

**Components to add:**
- `EpisodesList.tsx` - Main episode list component
- `EpisodeItem.tsx` - Individual episode row
- `SeasonSelector.tsx` - Season dropdown

## Database Schema Requirements

### Current Schema Support
The existing database schema already supports episode tracking:

```sql
-- Episodes table (cached from TMDB)
episodes (
  id INTEGER PRIMARY KEY,
  tmdb_id INTEGER,
  show_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  name TEXT,
  overview TEXT,
  air_date TEXT,
  still_path TEXT,
  cached_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User episode progress
user_episodes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  show_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched BOOLEAN DEFAULT FALSE,
  watched_at TEXT
);
```

### Additional Methods Needed
- `getShowSeasons(showId)` - Get all seasons for a show
- `getSeasonEpisodes(showId, seasonNumber)` - Get episodes for a season
- `markEpisodeWatched(userId, showId, season, episode)` - Mark episode as watched
- `getWatchedEpisodes(userId, showId)` - Get user's watched episodes
- `calculateProgress(userId, showId)` - Calculate watch progress

## User Experience Improvements

### Before (Current State)
- Basic "Mark Next Episode Watched" button
- Simple text showing current season/episode
- No visual progress indication
- No episode details or thumbnails

### After (Enhanced State)
- Visual progress bar with percentage
- Rich episode details with thumbnails
- Season navigation and episode lists
- Clear "Up Next" guidance
- Individual episode management
- Episode air dates and descriptions

## Success Metrics

### Functionality Goals
- ✅ Users can see visual progress through a show
- ✅ Users can easily navigate between seasons
- ✅ Users can mark individual episodes as watched
- ✅ Users get clear guidance on what to watch next
- ✅ Episode data loads quickly from cache

### Technical Goals
- ✅ Episode data cached efficiently from TMDB
- ✅ Progress calculations are fast and accurate
- ✅ UI remains responsive with large episode lists
- ✅ Offline functionality maintained
- ✅ Memory usage stays reasonable

## Implementation Priority

### Critical Path
1. **Start with Phase 1** (Enhanced Progress Display) - Quick wins
2. **Move to Phase 2** (Episode Data Integration) - Backend functionality
3. **Complete with Phase 3** (Episode List UI) - Full feature set

### Risk Mitigation
- **API Rate Limits**: Cache episode data aggressively
- **Performance**: Lazy load episode lists, paginate if needed
- **UX Complexity**: Keep episode marking simple and intuitive
- **Data Consistency**: Ensure progress calculations are always accurate

This design provides a comprehensive episode tracking experience while maintaining the simplicity and performance of the current implementation.
