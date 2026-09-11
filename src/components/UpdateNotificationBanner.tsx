// src/components/UpdateNotificationBanner.tsx
// Anti-slop Obsidian / Dark Monolith bottom-sheet card for update notifications (Linear / Apple TestFlight style)
import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowUpRight, CheckCircle2, RotateCw, X } from 'lucide-react-native';
import { APP_RELEASE } from '../constants/appVersion';

const UPDATE_DISMISSED_KEY = 'app_update_dismissed_time';

export const UpdateNotificationBanner: React.FC = () => {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isApkAvailable, setIsApkAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const translateY = useRef(new Animated.Value(240)).current;

  const showCard = () => {
    setIsVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 24,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const hideCard = (onComplete?: () => void) => {
    Animated.timing(translateY, {
      toValue: 260,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    });
  };

  const checkForUpdates = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
      const lastDismissTime = dismissed ? parseInt(dismissed, 10) : 0;
      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000;

      // 1. Check live OTA update via expo-updates
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const check = await Updates.checkForUpdateAsync();
          if (check.isAvailable) {
            const fetched = await Updates.fetchUpdateAsync();
            if (fetched.isNew) {
              setIsUpdateReady(true);
              showCard();
              return;
            }
          }
        } catch (err) {
          console.log('OTA check error:', err);
        }
      }

      // 2. Check for Standalone APK release (Build 2 with new launcher icon)
      const installedVersionCode = await AsyncStorage.getItem('installed_apk_version_code');
      const currentCode = installedVersionCode ? parseInt(installedVersionCode, 10) : 1;

      if (currentCode < APP_RELEASE.buildNumber && (now - lastDismissTime > threeHours)) {
        setIsApkAvailable(true);
        showCard();
      }
    } catch (e) {
      console.log('Check app updates error:', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 1200);

    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  const handleRestart = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.log('Reload error:', e);
      setIsUpdating(false);
    }
  };

  const handleInstallApk = async () => {
    try {
      await AsyncStorage.setItem('installed_apk_version_code', String(APP_RELEASE.buildNumber));
      hideCard(() => {
        Linking.openURL(APP_RELEASE.apkDownloadUrl);
      });
    } catch (e) {
      console.log('Open URL error:', e);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, String(Date.now()));
    } catch (e) {
      // ignore
    }
    hideCard();
  };

  if (!isVisible && !isUpdateReady && !isApkAvailable) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.overlayWrapper,
        {
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.sheetCard}>
        {/* Drag indicator */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.versionTag}>
              RELEASE v{APP_RELEASE.version} ({APP_RELEASE.buildNumber})
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeHitArea}
            onPress={handleDismiss}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={15} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={styles.title}>
          {isUpdateReady ? 'Update ready to install' : 'New version available'}
        </Text>
        <Text style={styles.summary}>
          {isUpdateReady
            ? 'Updated with the deep navy app icon and refreshed cash flow analytics. Restart to apply immediately.'
            : 'A new release is ready with the native launcher icon and stability updates.'}
        </Text>

        {/* Actions Row */}
        <View style={styles.actionRow}>
          {isUpdateReady ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRestart}
              activeOpacity={0.85}
              disabled={isUpdating}
            >
              <RotateCw size={14} color="#0A0D14" strokeWidth={2.2} />
              <Text style={styles.primaryButtonText}>
                {isUpdating ? 'Restarting...' : 'Restart now'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleInstallApk}
              activeOpacity={0.85}
            >
              <ArrowUpRight size={14} color="#0A0D14" strokeWidth={2.2} />
              <Text style={styles.primaryButtonText}>Install APK</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 32 : 18,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 99999,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0A0D14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  versionTag: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  closeHitArea: {
    padding: 4,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  summary: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#94A3B8',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10.5,
    borderRadius: 11,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0D14',
    letterSpacing: -0.1,
  },
  secondaryButton: {
    paddingVertical: 10.5,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CBD5E1',
  },
});
