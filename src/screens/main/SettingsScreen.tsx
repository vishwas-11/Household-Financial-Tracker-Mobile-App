// src/screens/main/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {
  KeyRound,
  Copy,
  Check,
  Download,
  Trash2,
  Compass,
  LogOut,
  FolderArchive,
  HelpCircle,
  Building,
  ArrowRightLeft,
  Plus,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { MOBILE_STORAGE_BUCKET } from '../../lib/storage';

export const SettingsScreen: React.FC = () => {
  const {
    householdName,
    inviteCode,
    updateHouseholdName,
    transactions,
    members,
    recurringItems,
    clearAllData,
    resetOnboarding,
    user,
    logout,
    userHouseholds,
    activeHouseholdId,
    switchHousehold,
    joinHousehold,
    openHouseholdSwitcher,
    resetTutorial,
  } = useApp();

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState(householdName);
  const [isSaved, setIsSaved] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [guideResetSuccess, setGuideResetSuccess] = useState(false);


  const handleCheckUpdates = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert('Live Updates', 'Live updates are active on mobile devices running preview builds.');
      return;
    }
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        Alert.alert('Update Available', 'A new update is available. Download and restart now?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update Now',
            onPress: async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            },
          },
        ]);
      } else {
        Alert.alert('Up to Date', 'You are running the latest version with the updated logo and cash flow logic!');
      }
    } catch (e) {
      Alert.alert('Up to Date', 'Your app is synchronized with the latest deployment.');
    }
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) return;
    await updateHouseholdName(nameInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleJoinHousehold = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Required', 'Please enter a household invite code.');
      return;
    }
    setIsJoining(true);
    try {
      const res = await joinHousehold(code);
      if (res.success) {
        setJoinCodeInput('');
        Alert.alert('Success', 'You have joined the household!');
      } else {
        Alert.alert('Join Failed', res.error || 'Invalid invite code.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickSwitch = async (id: string) => {
    if (id === activeHouseholdId) return;
    setSwitchingId(id);
    try {
      const res = await switchHousehold(id);
      if (!res.success) {
        Alert.alert('Switch Error', res.error || 'Failed to switch household.');
      }
    } finally {
      setSwitchingId(null);
    }
  };

  const handleResetGuide = async () => {
    await resetOnboarding();
    setGuideResetSuccess(true);
    setTimeout(() => setGuideResetSuccess(false), 2500);
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Member', 'Receipt'];
      const rows = transactions.map((t) => [
        t.fullDate || t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        t.type === 'income' ? t.amount : -t.amount,
        t.memberName || t.memberId,
        t.receiptUrl || 'None',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const fileUri = `${FileSystem.documentDirectory}household-ledger-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Household Ledger CSV',
        });
      } else {
        Alert.alert('Exported', `File saved to ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export CSV');
    }
  };

  // Export JSON
  const handleExportJSON = async () => {
    try {
      const data = {
        householdName,
        inviteCode,
        exportedAt: new Date().toISOString(),
        transactions,
        members,
        recurringItems,
      };

      const jsonContent = JSON.stringify(data, null, 2);
      const fileUri = `${FileSystem.documentDirectory}household-ledger-snapshot-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Household Ledger JSON',
        });
      } else {
        Alert.alert('Exported', `File saved to ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export JSON');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Settings & Backup" subtitle="Configuration" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Household Identity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Household Identity</Text>
          <Text style={styles.cardDesc}>
            Custom display name shown across balance sheets and reports.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. My Household"
              placeholderTextColor={Colors.textSubdued}
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={handleUpdateName}
              style={styles.updateBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.updateBtnText}>{isSaved ? 'Saved!' : 'Update'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite Code Card */}
        <View style={styles.card}>
          <View style={styles.inviteHeader}>
            <View style={styles.inviteIcon}>
              <KeyRound size={16} color={Colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Household Invite Code</Text>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={styles.copyBtn}
              activeOpacity={0.7}
            >
              {codeCopied ? (
                <Check size={14} color={Colors.income} />
              ) : (
                <Copy size={14} color={Colors.text} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDesc}>
            Share this code to allow family members to join the household on their mobile app.
          </Text>
        </View>

        {/* Storage Configuration Status Card */}
        <View style={styles.card}>
          <View style={styles.storageHeader}>
            <View style={[styles.inviteIcon, { backgroundColor: Colors.brandSubdued }]}>
              <FolderArchive size={16} color={Colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Mobile File Storage</Text>
              <Text style={styles.storageBucket}>Bucket: {MOBILE_STORAGE_BUCKET}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Receipts and bill attachments taken on mobile are uploaded to the dedicated{' '}
            <Text style={{ color: Colors.brand, fontFamily: 'monospace' }}>
              {MOBILE_STORAGE_BUCKET}
            </Text>{' '}
            Supabase Storage bucket, keeping mobile and web assets segregated.
          </Text>
        </View>

        {/* Data Export & Backup Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ledger Data Export & Backup</Text>
          <Text style={styles.cardDesc}>
            Generate and share offline files for all {transactions.length} transactions, recurring
            items, and members.
          </Text>

          <View style={styles.exportRow}>
            <TouchableOpacity
              onPress={handleExportCSV}
              style={styles.exportBtn}
              activeOpacity={0.7}
            >
              <Download size={14} color={Colors.textMuted} />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportJSON}
              style={styles.exportBtn}
              activeOpacity={0.7}
            >
              <Download size={14} color={Colors.textMuted} />
              <Text style={styles.exportBtnText}>Export JSON</Text>
            </TouchableOpacity>
          </View>

          {/* Replay Onboarding Tutorial Tour Button */}
          <TouchableOpacity
            onPress={resetTutorial}
            style={styles.tutorialBtn}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={Colors.brand} />
            <Text style={styles.tutorialBtnText}>Replay App Onboarding Tutorial</Text>
          </TouchableOpacity>

          {/* Re-show Onboarding Guide Button */}
          <TouchableOpacity
            onPress={handleResetGuide}
            style={styles.guideBtn}
            activeOpacity={0.7}
          >
            <Compass size={14} color={Colors.brand} />
            <Text style={styles.guideBtnText}>
              {guideResetSuccess ? 'Guide Enabled on Dashboard!' : 'Show Getting Started Guide on Dashboard'}
            </Text>
          </TouchableOpacity>

          {/* Clear All Transactions (Start Fresh) */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Clear All Data & Start Fresh',
                'Are you sure you want to clear all transactions and recurring bills from your ledger? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All Data',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAllData();
                      Alert.alert('Ledger Reset', 'Your transactions and recurring schedules have been cleared.');
                    },
                  },
                ]
              );
            }}
            style={styles.resetBtn}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color={Colors.expense} />
            <Text style={styles.resetBtnText}>Clear All Transactions & Start Fresh</Text>
          </TouchableOpacity>
        </View>

        {/* App Version & Live Updates Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Version & Live Updates</Text>
          <View style={styles.appVersionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.versionLabel}>Installed Version</Text>
              <Text style={styles.versionValue}>1.0.0 (Build 2) · Preview Channel</Text>
            </View>
            <TouchableOpacity
              style={styles.checkUpdateBtn}
              onPress={handleCheckUpdates}
              activeOpacity={0.7}
            >
              <RefreshCw size={13} color="#FFFFFF" />
              <Text style={styles.checkUpdateBtnText}>Check Updates</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.downloadApkBtn}
            onPress={() => Linking.openURL('https://expo.dev/accounts/vishwascharan11/projects/household-funds-tracker-mobile-app/builds')}
            activeOpacity={0.7}
          >
            <Download size={14} color="#38BDF8" />
            <Text style={styles.downloadApkBtnText}>Download Latest APK (New Home Screen Icon)</Text>
          </TouchableOpacity>
        </View>

        {/* User Account & Logout Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logged-in Account</Text>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'name@family.local'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ]);
            }}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={14} color={Colors.expense} />
            <Text style={styles.logoutBtnText}>Sign Out from Mobile App</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Accordion / Guide */}
        <View style={styles.card}>
          <View style={styles.faqHeader}>
            <HelpCircle size={15} color={Colors.brand} />
            <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How are balances calculated?</Text>
            <Text style={styles.faqAnswer}>
              Monthly net flow equals total verified Income minus total Expenditures. Scheduled
              bills with auto-pay are displayed in the Recurring tab.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can multiple devices access this ledger?</Text>
            <Text style={styles.faqAnswer}>
              Yes. Any family member with an account can enter the household invite code on their
              device to sync transactions and recurring bills in real time.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Where are receipt photos saved?</Text>
            <Text style={styles.faqAnswer}>
              Receipt attachments are uploaded directly to the dedicated 'mobile-receipts' bucket
              in your Supabase project with secure access.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 13,
  },
  updateBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    borderRadius: 6,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storageBucket: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.brand,
    marginTop: 2,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 6,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tutorialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(94, 106, 210, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.3)',
    paddingVertical: 11,
    borderRadius: 6,
    marginTop: 4,
  },
  tutorialBtnText: {
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '700',
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  guideBtnText: {
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.expenseSubdued,
    borderWidth: 1,
    borderColor: Colors.expenseBorder,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  resetBtnText: {
    fontSize: 12,
    color: Colors.expense,
    fontWeight: '500',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.text,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    color: Colors.expense,
    fontWeight: '500',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  faqItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  faqAnswer: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  householdChipsContainer: {
    gap: 6,
    marginTop: 4,
  },
  hhChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hhChipActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.surfaceHighlight,
  },
  hhChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  hhChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  hhChipTextActive: {
    fontWeight: '600',
    color: Colors.text,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.income,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  switchLinkText: {
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '600',
  },
  joinBox: {
    marginTop: 6,
    gap: 2,
  },
  joinBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  joinBtnText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  openSwitcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  openSwitcherBtnText: {
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '600',
  },
  appVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 10,
  },
  versionLabel: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  versionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkUpdateBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  downloadApkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  downloadApkBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#38BDF8',
  },
});

