# Media Tracker App - Implementation Plan

## Project Overview
A React Native mobile app to track TV shows, movies, and games with automated data fetching, rewatch scheduling, and rich visual interface. Solo development with AI assistance.

## Tech Stack Recommendations

### Frontend
- **React Native with Expo** (managed workflow)
  - Expo SDK 50+ for latest features
  - Expo Router for navigation
  - React Native Paper or NativeBase for UI components
  - Expo Image for optimized image loading
  - Expo Notifications for push notifications

### State Management
- **Zustand** - Simpler than Redux for this use case, good TypeScript support

### Backend & Database
- **Local-First Architecture with SQLite**
  - Expo SQLite for primary data storage
  - File-based authentication (or simple local auth)
  - JSON export/import for backup
  - No network dependency for core features
  - Optional sync service for multi-device support

### External APIs
- **TMDB (The Movie Database) API** - Free tier: 1,000 requests/day
- **TV Maze API** - Free, unlimited for non-commercial use
- **Future**: Shazam API for audio recognition

### Offline Storage
- **Expo SQLite** for primary data storage and offline functionality
- **React Query (TanStack Query)** for TMDB API cache management
- **JSON export/import** for data backup and portability

## Database Schema

### Users Table
```sql
users (
  id: uuid (pk),
  email: string,
  username: string,
  created_at: timestamp,
  preferences: jsonb
)
```

### Shows Table
```sql
shows (
  id: uuid (pk),
  tmdb_id: integer,
  title: string,
  poster_url: string,
  backdrop_url: string,
  overview: text,
  status: enum ('airing', 'between_seasons', 'ended', 'cancelled'),
  next_episode_date: date,
  total_episodes: integer,
  seasons: integer,
  created_at: timestamp,
  updated_at: timestamp
)
```

### User Shows (Tracking) Table
```sql
user_shows (
  id: uuid (pk),
  user_id: uuid (fk),
  show_id: uuid (fk),
  status: enum ('watching', 'want_to_watch', 'completed', 'dropped'),
  current_episode: integer,
  current_season: integer,
  rating: integer (1-10),
  notes: text,
  added_at: timestamp,
  updated_at: timestamp
)
```

### Rewatch Schedule Table
```sql
rewatch_schedule (
  id: uuid (pk),
  user_id: uuid (fk),
  show_id: uuid (fk),
  schedule_type: enum ('seasonal', 'holiday', 'custom'),
  schedule_date: date,
  recurring: boolean,
  notes: text,
  created_at: timestamp
)
```

## Feature Map & Development Phases

### MVP (Phase 1) - TV Shows Only
**Goal**: Basic show tracking with manual entry and TMDB integration

#### Core Features:
1. **User Authentication**
   - Sign up/Sign in with email
   - Basic profile setup

2. **Show Management**
   - Search and add shows via TMDB API
   - Manual show entry fallback
   - Show details view (poster, overview, episode info)

3. **Tracking Interface**
   - Currently watching list
   - Mark episodes as watched
   - Track current season/episode
   - Show next episode date

4. **Basic UI**
   - Tab navigation (Currently Watching, Search, Profile)
   - Show cards with posters
   - Simple episode tracking

#### Technical Implementation:
- Set up Expo project with TypeScript
- Configure Supabase database and auth
- Implement TMDB API integration
- Basic offline caching with SQLite
- Push notifications for new episodes

**Estimated Timeline**: 3-4 weeks
**Estimated API Costs**: $0 (free tiers)

### Phase 2 - Enhanced TV Features
**Goal**: Better UX and automated suggestions

#### Features:
1. **Automated Data Updates**
   - Daily sync of show data
   - Automatic episode date updates
   - Season status tracking

2. **Better Tracking UX**
   - Swipe gestures for episode marking
   - Progress indicators
   - Recently watched history

3. **Between Seasons Tracking**
   - Shows awaiting new seasons
   - Renewal/cancellation status
   - Season premiere notifications

4. **Onboarding Flow**
   - "How it works" tutorial
   - Suggested popular shows
   - Import from external sources (stretch)

**Estimated Timeline**: 2-3 weeks
**Estimated API Costs**: $5-10/month (increased usage)

### Phase 3 - Movies Integration
**Goal**: Add movie tracking with theater/streaming releases

#### Features:
1. **Movie Database**
   - Theater release tracking
   - Streaming platform availability
   - Digital release dates

2. **Movie Lists**
   - Want to watch
   - Watched/Rated
   - Rewatch scheduling

3. **Release Notifications**
   - Theater releases
   - Streaming availability
   - Digital/physical releases

**Estimated Timeline**: 2-3 weeks
**Estimated API Costs**: $10-15/month

### Phase 4 - Rewatch Calendar
**Goal**: Seasonal and scheduled rewatching

#### Features:
1. **Calendar Integration**
   - Seasonal suggestions (Christmas, Halloween, etc.)
   - Custom rewatch schedules
   - Background show rotation

2. **Smart Suggestions**
   - Holiday-themed content
   - Anniversary rewatches
   - Weather-based suggestions

3. **Calendar Views**
   - Monthly calendar view
   - Upcoming rewatch notifications
   - Schedule management

**Estimated Timeline**: 2-3 weeks

### Phase 5 - Games Integration
**Goal**: Track single-player games and releases

#### Features:
1. **Game Database**
   - Steam/Epic/Console releases
   - Single-player focus
   - Completion tracking

2. **Game Lists**
   - Currently playing
   - Backlog management
   - Completed games

**Estimated Timeline**: 3-4 weeks
**Estimated API Costs**: $15-25/month (additional gaming APIs)

### Phase 6 - Social Features
**Goal**: Share and discover with others

#### Features:
1. **Sharing**
   - Share watch lists
   - Recommendations
   - Reviews/ratings

2. **Discovery**
   - Friend activity
   - Popular content
   - Trending shows/movies

**Estimated Timeline**: 4-5 weeks

### Future Features
- **Audio Recognition**: Shazam-like TV/movie theme detection
- **Advanced Analytics**: Watching patterns, time spent
- **Integration**: Calendar apps, streaming services
- **AI Recommendations**: Machine learning suggestions

## Development Workflow

### Setup Phase
1. **Environment Setup**
   - Install Expo CLI and dependencies
   - Set up Supabase project
   - Configure TMDB API access
   - Set up Git repository

2. **Project Structure**
```
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
├── navigation/         # Navigation configuration
├── services/          # API calls and business logic
├── store/             # Zustand state management
├── utils/             # Helper functions
├── types/             # TypeScript definitions
└── constants/         # App constants
```

### Testing Strategy
- **Unit Tests**: Jest for utility functions
- **Integration Tests**: React Native Testing Library
- **E2E Tests**: Detox (Phase 2+)
- **Manual Testing**: Expo Go on Android device

### Deployment
- **Development**: Expo Go for testing
- **Production**: Expo Application Services (EAS) for app store builds
- **Backend**: Supabase hosting (included)

## Cost Breakdown

### Development Costs
- **TMDB API**: Free (1,000 requests/day, upgrade to $5/month if needed)
- **Supabase**: Free tier initially, $25/month when scaling
- **Expo EAS**: Free for personal projects, $29/month for team features
- **Apple Developer**: $99/year for App Store
- **Google Play**: $25 one-time fee

### Estimated Monthly Costs by Phase:
- **MVP**: $0-5/month
- **Phase 2-3**: $10-15/month
- **Phase 4-5**: $20-30/month
- **Production**: $50-75/month (with user base)

## Success Metrics

### MVP Success Criteria:
- App successfully tracks 10+ shows
- Daily active usage for 1+ weeks
- No critical bugs on Android
- Search and add functionality working
- Notification system functional

### Long-term Metrics:
- User retention (daily/weekly active users)
- Content database growth
- Feature adoption rates
- Performance metrics (load times, crash rates)

## Risk Mitigation

### Technical Risks:
- **API Rate Limits**: Implement caching and fallback strategies
- **Offline Functionality**: Robust local storage and sync
- **Performance**: Image optimization and lazy loading

### Product Risks:
- **User Adoption**: Focus on personal use case first
- **Feature Creep**: Stick to MVP scope initially
- **Maintenance**: Automated updates and monitoring

## Next Steps

1. **Week 1**: Environment setup and project initialization
2. **Week 2**: Basic authentication and database setup
3. **Week 3**: TMDB integration and show search
4. **Week 4**: Tracking interface and notifications
5. **Week 5**: Polish and testing for MVP release

## AI Development Notes

When working with Claude/Copilot:
- Reference this document for context and scope
- Focus on one feature at a time
- Request code reviews for complex logic
- Ask for testing strategies for each component
- Use TypeScript throughout for better AI assistance
- Request architectural guidance for new features

## Resources

- **Expo Documentation**: https://docs.expo.dev/
- **Supabase Documentation**: https://supabase.com/docs
- **TMDB API Documentation**: https://developers.themoviedb.org/3
- **React Native Paper**: https://reactnativepaper.com/
- **Zustand Documentation**: https://github.com/pmndrs/zustand