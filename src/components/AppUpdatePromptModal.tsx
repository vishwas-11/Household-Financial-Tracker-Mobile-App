// src/components/AppUpdatePromptModal.tsx
// Prominently notifies users whenever an app update or new APK is released upon launch
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, Download, RefreshCw, X } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { HouseholdFundsLogo } from './HouseholdFundsLogo';
import { APP_RELEASE } from '../constants/appVersion';

const UPDATE_DISMISSED_SESSION_KEY = 'app_update_dismissed_session';

export const AppUpdatePromptModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOtaReady, setIsOtaReady] = useState(false);

  const checkAppUpdates = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(UPDATE_DISMISSED_SESSION_KEY);
      const lastDismissTime = dismissed ? parseInt(dismissed, 10) : 0;
      const now = Date.now();
      const fourHours = 4 * 60 * 60 * 1000;

      // Check for live OTA updates via expo-updates
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const check = await Updates.checkForUpdateAsync();
          if (check.isAvailable) {
            const fetched = await Updates.fetchUpdateAsync();
            if (fetched.isNew) {
              setIsOtaReady(true);
              setIsVisible(true);
              return;
            }
          }
        } catch (err) {
          console.log('OTA check error:', err);
        }
      }

      // Check for New Native APK Release (versionCode: 2 with new app launcher icon)
      const lastInstalledVersionCode = await AsyncStorage.getItem('installed_apk_version_code');
      const currentCode = lastInstalledVersionCode ? parseInt(lastInstalledVersionCode, 10) : 1;

      if (currentCode < APP_RELEASE.buildNumber && (now - lastDismissTime > fourHours)) {
        setIsVisible(true);
      }
    } catch (e) {
      console.log('Check app updates error:', e);
    }
  };

  useEffect(() => {
    // Check on startup
    const timer = setTimeout(() => {
      checkAppUpdates();
    }, 1500);

    // Check when returning to foreground
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAppUpdates();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  const handleApplyOta = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.log('Reload error:', e);
    }
  };

  const handleDownloadApk = async () => {
    try {
      await AsyncStorage.setItem('installed_apk_version_code', String(APP_RELEASE.buildNumber));
      setIsVisible(false);
      await Linking.openURL(APP_RELEASE.apkDownloadUrl);
    } catch (e) {
      console.log('Open URL error:', e);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      await AsyncStorage.setItem(UPDATE_DISMISSED_SESSION_KEY, String(Date.now()));
    } catch (e) {
      // ignore
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Logo Badge */}
          <View style={styles.logoBadgeWrapper}>
            <View style={styles.logoBadge}>
              <HouseholdFundsLogo size={46} />
            </View>
          </View>

          {/* Version Pill */}
          <View style={styles.versionPill}>
            <Sparkles size={11} color="#38BDF8" />
            <Text style={styles.versionPillText}>
              v{APP_RELEASE.version} (Build {APP_RELEASE.buildNumber}) · NEW RELEASE
            </Text>
          </View>

          {/* Titles */}
          <Text style={styles.title}>{APP_RELEASE.title}</Text>
          <Text style={styles.subtitle}>{APP_RELEASE.subtitle}</Text>

          {/* Highlights Card */}
          <View style={styles.highlightsCard}>
            <Text style={styles.highlightsHeader}>WHAT'S NEW:</Text>
            {APP_RELEASE.highlights.map((item, idx) => (
              <View key={idx} style={styles.highlightRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {isOtaReady ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleApplyOta}
                activeOpacity={0.8}
              >
                <RefreshCw size={15} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Restart & Apply Live Update</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, isOtaReady && styles.secondaryActionBtn]}
              onPress={handleDownloadApk}
              activeOpacity={0.8}
            >
              <Download size={15} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Install New APK (Home Screen Icon)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.laterBtnText}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 99999,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoBadgeWrapper: {
    marginBottom: 12,
    marginTop: 6,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  versionPillText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  highlightsCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  highlightsHeader: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
    marginTop: 5,
  },
  highlightText: {
    flex: 1,
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryActionBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowOpacity: 0.1,
  },
  primaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  laterBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  laterBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
});
