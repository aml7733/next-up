import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, isAuthenticated, signOut } = useAuthStore();

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
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              <Avatar.Text 
                size={80} 
                label={user.email?.charAt(0).toUpperCase() || 'U'} 
                style={styles.avatar}
              />
              <Text variant="titleLarge" style={styles.email}>
                {user.email}
              </Text>
              {user.username && (
                <Text variant="bodyLarge" style={styles.username}>
                  @{user.username}
                </Text>
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.profileCard}>
            <Card.Content>
              <Text variant="titleLarge">Welcome to NextUp</Text>
              <Text variant="bodyMedium" style={styles.placeholderText}>
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
                <Text variant="headlineSmall">0</Text>
                <Text variant="bodySmall">Shows Watching</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">0</Text>
                <Text variant="bodySmall">Episodes Watched</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">0</Text>
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
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Button 
                mode="contained" 
                style={styles.actionButton}
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
  },
  username: {
    opacity: 0.7,
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
