// src/navigation/RootNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/colors';
import { HouseholdFundsLogo } from '../components/HouseholdFundsLogo';
import { HouseholdSwitcherModal } from '../components/HouseholdSwitcherModal';
import { Onboarding } from '../components/ui/Onboarding';
import { ONBOARDING_STEPS } from '../constants/onboardingSteps';

export const RootNavigator: React.FC = () => {
  const {
    user,
    isLoading,
    isHouseholdSwitcherOpen,
    closeHouseholdSwitcher,
    isTutorialVisible,
    completeTutorial,
  } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoBadge}>
          <HouseholdFundsLogo size={58} />
        </View>
        <Text style={styles.loadingTitle}>Household Funds</Text>
        <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        {!user ? (
          <AuthNavigator key="auth-login" initialRouteName="Login" />
        ) : !user.householdId ? (
          <AuthNavigator key="auth-onboarding" initialRouteName="Onboarding" />
        ) : (
          <AppNavigator />
        )}
      </NavigationContainer>

      {user && (
        <HouseholdSwitcherModal
          visible={isHouseholdSwitcherOpen}
          onClose={closeHouseholdSwitcher}
        />
      )}

      {user && (
        <Onboarding
          visible={isTutorialVisible}
          steps={ONBOARDING_STEPS}
          onComplete={completeTutorial}
          onSkip={completeTutorial}
          primaryButtonText="Get Started"
          skipButtonText="Skip Tour"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  loadingTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
