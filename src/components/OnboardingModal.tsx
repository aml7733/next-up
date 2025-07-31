import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, IconButton, Portal, Modal } from 'react-native-paper';
import { Image } from 'expo-image';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  illustration?: string;
}

interface PopularShow {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
}

interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
  onAddPopularShow?: (showId: number) => void;
  popularShows?: PopularShow[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NextUp!',
    description: 'Track your favorite TV shows, mark episodes as watched, and never lose track of where you left off.',
    icon: '👋',
  },
  {
    id: 'search',
    title: 'Discover Shows',
    description: 'Search thousands of TV shows from The Movie Database. Add them to your tracking list with a single tap.',
    icon: '🔍',
  },
  {
    id: 'track',
    title: 'Track Progress',
    description: 'Mark episodes as watched, see your progress through seasons, and get reminders for new episodes.',
    icon: '📊',
  },
  {
    id: 'organize',
    title: 'Stay Organized',
    description: 'Organize shows by status: Currently Watching, Want to Watch, Completed, or Paused.',
    icon: '📝',
  },
];

const SUGGESTED_SHOWS: PopularShow[] = [
  {
    id: 1399,
    title: 'Game of Thrones',
    poster_path: '/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
    overview: 'Seven noble families fight for control of the mythical land of Westeros.',
    vote_average: 8.4,
  },
  {
    id: 1396,
    title: 'Breaking Bad',
    poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    overview: 'A high school chemistry teacher turned meth producer.',
    vote_average: 9.5,
  },
  {
    id: 1418,
    title: 'The Big Bang Theory',
    poster_path: '/ooBGRQBdbGzBxAVfExiO8r7kloA.jpg',
    overview: 'Four scientists and their neighbor Penny navigate life and love.',
    vote_average: 8.2,
  },
  {
    id: 1402,
    title: 'The Walking Dead',
    poster_path: '/rqeYMLryjcawh2JeRpCVUDXYM5b.jpg',
    overview: 'Survivors of a zombie apocalypse struggle to stay alive.',
    vote_average: 8.1,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onDismiss,
  onComplete,
  onAddPopularShow,
  popularShows = SUGGESTED_SHOWS
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedShows, setSelectedShows] = useState<Set<number>>(new Set());

  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show popular shows selection
      setCurrentStep(ONBOARDING_STEPS.length);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShowToggle = (showId: number) => {
    const newSelected = new Set(selectedShows);
    if (newSelected.has(showId)) {
      newSelected.delete(showId);
    } else {
      newSelected.add(showId);
    }
    setSelectedShows(newSelected);
  };

  const handleFinish = () => {
    // Add selected shows
    selectedShows.forEach(showId => {
      onAddPopularShow?.(showId);
    });
    onComplete();
  };

  const renderStep = (step: OnboardingStep) => (
    <View style={styles.stepContainer}>
      <Text variant="displayMedium" style={styles.stepIcon}>
        {step.icon}
      </Text>
      <Text variant="headlineSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
        {step.title}
      </Text>
      <Text variant="bodyLarge" style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}>
        {step.description}
      </Text>
    </View>
  );

  const renderPopularShows = () => (
    <View style={styles.popularShowsContainer}>
      <Text variant="headlineSmall" style={[styles.popularTitle, { color: theme.colors.onSurface }]}>
        🌟 Get Started with Popular Shows
      </Text>
      <Text variant="bodyMedium" style={[styles.popularDescription, { color: theme.colors.onSurfaceVariant }]}>
        Select some popular shows to add to your tracking list:
      </Text>
      
      <ScrollView style={styles.showsList} showsVerticalScrollIndicator={false}>
        {popularShows.map((show) => (
          <Card 
            key={show.id}
            style={[
              styles.showCard,
              { 
                backgroundColor: selectedShows.has(show.id) 
                  ? theme.colors.primaryContainer 
                  : theme.colors.surface 
              }
            ]}
            onPress={() => handleShowToggle(show.id)}
          >
            <Card.Content style={styles.showCardContent}>
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w200${show.poster_path}` }}
                style={styles.showPoster}
                contentFit="cover"
              />
              <View style={styles.showInfo}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.showTitle}>
                  {show.title}
                </Text>
                <Text variant="bodySmall" style={[styles.showRating, { color: theme.colors.primary }]}>
                  ⭐ {show.vote_average}/10
                </Text>
                <Text 
                  variant="bodySmall" 
                  numberOfLines={2} 
                  style={[styles.showOverview, { color: theme.colors.onSurfaceVariant }]}
                >
                  {show.overview}
                </Text>
              </View>
              <View style={styles.selectionIndicator}>
                {selectedShows.has(show.id) && (
                  <IconButton
                    icon="check-circle"
                    size={24}
                    iconColor={theme.colors.primary}
                  />
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isPopularShowsStep = currentStep === ONBOARDING_STEPS.length;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${((currentStep + 1) / (ONBOARDING_STEPS.length + 1)) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text variant="bodySmall" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
              {currentStep + 1} of {ONBOARDING_STEPS.length + 1}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isPopularShowsStep 
              ? renderPopularShows()
              : renderStep(ONBOARDING_STEPS[currentStep])
            }
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <Button
              mode="text"
              onPress={handlePreviousStep}
              disabled={currentStep === 0}
              style={styles.navButton}
            >
              Previous
            </Button>

            {isPopularShowsStep ? (
              <Button
                mode="contained"
                onPress={handleFinish}
                style={styles.navButton}
              >
                Finish ({selectedShows.size} selected)
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleNextStep}
                style={styles.navButton}
              >
                {isLastStep ? 'Continue' : 'Next'}
              </Button>
            )}
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  closeButton: {
    margin: 0,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepIcon: {
    marginBottom: 20,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  popularShowsContainer: {
    paddingVertical: 20,
  },
  popularTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  popularDescription: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  showsList: {
    maxHeight: 300,
  },
  showCard: {
    marginBottom: 12,
    elevation: 1,
  },
  showCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  showPoster: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  showInfo: {
    flex: 1,
    gap: 2,
  },
  showTitle: {
    fontWeight: '600',
  },
  showRating: {
    fontWeight: '500',
  },
  showOverview: {
    lineHeight: 16,
  },
  selectionIndicator: {
    width: 40,
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default OnboardingModal;
