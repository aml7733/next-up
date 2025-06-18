# NextUp - TV Show Tracker

A React Native app built with Expo for tracking your favorite TV shows. Keep track of what you're watching, mark episodes as watched, and discover new shows.

## Features

- 📺 Track your currently watching TV shows
- 🔍 Search for shows using The Movie Database (TMDB)
- ✅ Mark episodes and seasons as watched
- 📊 View your watching statistics
- 🌙 Dark/Light theme support
- 📱 Cross-platform (iOS, Android, Web)

## Tech Stack

- **React Native** with **Expo** - Cross-platform mobile development
- **TypeScript** - Type safety and better DX
- **React Native Paper** - Material Design components
- **React Navigation** - Navigation between screens
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **Supabase** - Backend as a Service (auth, database)
- **TMDB API** - Movie and TV show data

## Getting Started

### Prerequisites

- Node.js (18+)
- Yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   cd nextup
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `EXPO_PUBLIC_TMDB_API_KEY` - Your TMDB API key

4. **Start the development server**
   ```bash
   yarn start
   ```

### Running on Devices

- **iOS Simulator**: `yarn ios`
- **Android Emulator**: `yarn android`
- **Web**: `yarn web`

## Development

### Available Scripts

- `yarn start` - Start Expo development server
- `yarn ios` - Run on iOS simulator
- `yarn android` - Run on Android emulator
- `yarn web` - Run on web browser
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint errors
- `yarn format` - Format code with Prettier
- `yarn type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/          # External API services (Supabase, TMDB)
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── hooks/             # Custom React hooks
```

### VS Code Tasks

Use Cmd/Ctrl + Shift + P and type "Tasks: Run Task" to access:

- Start Expo Dev Server
- Run on iOS Simulator
- Run on Android Emulator
- Type Check
- Lint
- Clean Cache

## API Setup

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Set up the required database tables (see `/docs/database-schema.sql`)

### TMDB API Setup

1. Create an account at [themoviedb.org](https://www.themoviedb.org)
2. Apply for an API key
3. Add the API key to your environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org) for show data
- [Supabase](https://supabase.com) for backend services
- [Expo](https://expo.dev) for the development platform
