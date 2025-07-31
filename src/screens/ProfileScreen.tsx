import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useShowsStore } from '../store/showsStore';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { userShows, loadUserShows } = useShowsStore();

  useEffect(() => {
    // Load user shows for stats when component mounts and user is available
    if (user?.id) {
      loadUserShows(user.id);
    }
  }, [user?.id, loadUserShows]);

  // Calculate stats from user shows
  const watchingCount = userShows.filter(show => show.status === 'watching').length;
  const completedCount = userShows.filter(show => show.status === 'completed').length;
  
  // Calculate total episodes watched (this is an estimate based on current progress)
  const totalEpisodesWatched = userShows.reduce((total, userShow) => {
    if (userShow.status === 'completed') {
      // For completed shows, assume all episodes are watched
      // This is an approximation since we don't have exact episode counts
      return total + (userShow.current_season * 10); // Rough estimate
    } else if (userShow.status === 'watching') {
      // For currently watching shows, estimate based on current progress
      return total + ((userShow.current_season - 1) * 10 + userShow.current_episode);
    }
    return total;
  }, 0);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Profile
        </Text>

        {isAuthenticated && user ? (
          <Card style={styles.profileCard} testID="authenticated-profile-card">
            <Card.Content style={styles.profileContent}>
              <Avatar.Text 
                size={80} 
                label={user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'} 
                style={styles.avatar}
              />
              <Text variant="titleLarge" style={styles.username} testID="user-username">
                {user.username || 'Anonymous'}
              </Text>
              {user.email && (
                <Text variant="bodyLarge" style={styles.email} testID="user-email">
                  {user.email}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.memberSince} testID="member-since">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.profileCard} testID="unauthenticated-profile-card">
            <Card.Content>
              <Text variant="titleLarge" testID="welcome-title">Welcome to NextUp</Text>
              <Text variant="bodyMedium" style={styles.placeholderText} testID="welcome-message">
                Sign in to start tracking your favorite TV shows.
              </Text>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Stats
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{watchingCount}</Text>
                <Text variant="bodySmall">Shows Watching</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{totalEpisodesWatched}</Text>
                <Text variant="bodySmall">Episodes Watched</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{completedCount}</Text>
                <Text variant="bodySmall">Shows Completed</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.actions}>
          {isAuthenticated ? (
            <Button 
              mode="outlined" 
              onPress={handleSignOut}
              style={styles.actionButton}
              testID="sign-out-button"
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                testID="sign-in-button"
                onPress={() => {
                  // TODO: Navigate to sign in screen
                  console.log('Navigate to sign in');
                }}
              >
                Sign In
              </Button>
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                testID="sign-up-button"
                onPress={() => {
                  // TODO: Navigate to sign up screen
                  console.log('Navigate to sign up');
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 12,
  },
  email: {
    marginBottom: 4,
    opacity: 0.7,
  },
  username: {
    fontWeight: 'bold',
  },
  memberSince: {
    marginTop: 8,
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 8,
    opacity: 0.7,
  },
  statsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});
