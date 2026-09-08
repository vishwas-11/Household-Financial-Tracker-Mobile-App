// src/navigation/RootNavigator.tsx
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/colors';
import { HouseholdFundsLogo } from '../components/HouseholdFundsLogo';

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoBadge}>
          <HouseholdFundsLogo size={28} color={Colors.white} />
        </View>
        <ActivityIndicator size="small" color={Colors.brand} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator initialRouteName="Login" />
      ) : !user.householdId ? (
        <AuthNavigator initialRouteName="Onboarding" />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
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
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
