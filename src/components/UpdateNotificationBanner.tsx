// src/components/UpdateNotificationBanner.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import * as Updates from 'expo-updates';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react-native';
import { Colors } from '../constants/colors';

const LATEST_APK_URL = 'https://expo.dev/accounts/vishwascharan11/projects/household-funds-tracker-mobile-app/builds';

export const UpdateNotificationBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const slideAnim = useState(new Animated.Value(-100))[0];

  const checkForUpdates = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setUpdateAvailable(true);
        setIsUpdating(true);
        // Automatically fetch update in background
        const fetched = await Updates.fetchUpdateAsync();
        if (fetched.isNew) {
          setUpdateReady(true);
          setIsUpdating(false);
          showBanner();
        }
      }
    } catch (error) {
      console.log('Update check error:', error);
      setIsUpdating(false);
    }
  };

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  };

  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.log('Reload error:', e);
    }
  };

  useEffect(() => {
    // Check on mount
    checkForUpdates();

    // Check when returning from background
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  if (dismissed || (!updateAvailable && !updateReady)) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.badgeIcon}>
          <Sparkles size={16} color="#38BDF8" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {updateReady ? 'New Update Ready!' : 'Downloading Update...'}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {updateReady
              ? 'Updated with the new Deep Navy logo & cash flow improvements. Tap to apply.'
              : 'Fetching the latest version in the background...'}
          </Text>
        </View>

        {updateReady ? (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleRestart}
            activeOpacity={0.8}
          >
            <RefreshCw size={13} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Restart</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={hideBanner}
          activeOpacity={0.7}
        >
          <X size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 12,
    right: 12,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  description: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
});
