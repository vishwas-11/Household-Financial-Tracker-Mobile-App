// src/screens/auth/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, KeyRound, PlusCircle, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Users } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { HouseholdFundsLogo } from '../../components/HouseholdFundsLogo';
import { useApp } from '../../context/AppContext';

export const OnboardingScreen: React.FC = () => {
  const { createHousehold, joinHousehold, user, logout } = useApp();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    const res = await createHousehold(householdName);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to create household.');
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await joinHousehold(inviteCode);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to join household.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <HouseholdFundsLogo size={28} />
            </View>
            <Text style={styles.appTitle}>Household Setup</Text>
            <Text style={styles.appSubtitle}>
              Start a fresh family ledger or connect using an invite code
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={Colors.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Mode Switcher Tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                onPress={() => {
                  setMode('create');
                  setError(null);
                }}
                style={[styles.modeTab, mode === 'create' && styles.modeTabActive]}
                activeOpacity={0.7}
              >
                <PlusCircle size={14} color={mode === 'create' ? Colors.text : Colors.textMuted} />
                <Text style={[styles.modeTabText, mode === 'create' && styles.modeTabTextActive]}>
                  Create New
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode('join');
                  setError(null);
                }}
                style={[styles.modeTab, mode === 'join' && styles.modeTabActive]}
                activeOpacity={0.7}
              >
                <KeyRound size={14} color={mode === 'join' ? Colors.text : Colors.textMuted} />
                <Text style={[styles.modeTabText, mode === 'join' && styles.modeTabTextActive]}>
                  Join with Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode 1: Create */}
            {mode === 'create' ? (
              <View style={styles.modeContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HOUSEHOLD DISPLAY NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Home size={16} color={Colors.textSubdued} style={styles.inputIcon} />
                    <TextInput
                      value={householdName}
                      onChangeText={setHouseholdName}
                      placeholder="e.g. Sharma Family or Verma Household"
                      placeholderTextColor={Colors.textSubdued}
                      style={styles.input}
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    This will appear across family summaries and shared balance sheets.
                  </Text>
                </View>

                {/* Auto code info box */}
                <View style={styles.infoBox}>
                  <View style={styles.infoBoxHeader}>
                    <Sparkles size={14} color={Colors.brand} />
                    <Text style={styles.infoBoxTitle}>Automatic Family Invite Code</Text>
                  </View>
                  <Text style={styles.infoBoxDesc}>
                    Upon creation, an 8-character invite code (e.g. HF-XXXXX) will be generated.
                    You can share it with family members anytime from Settings.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Create & Enter Dashboard</Text>
                      <ArrowRight size={16} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Mode 2: Join */
              <View style={styles.modeContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HOUSEHOLD INVITE CODE</Text>
                  <View style={styles.inputWrapper}>
                    <KeyRound size={16} color={Colors.textSubdued} style={styles.inputIcon} />
                    <TextInput
                      value={inviteCode}
                      onChangeText={(t) => setInviteCode(t.toUpperCase())}
                      placeholder="e.g. HF-7K9P2"
                      placeholderTextColor={Colors.textSubdued}
                      autoCapitalize="characters"
                      style={[styles.input, { fontFamily: 'monospace', fontWeight: '700' }]}
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    Obtain this 8-character code from the household owner or member settings.
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.infoBoxHeader}>
                    <Users size={14} color={Colors.income} />
                    <Text style={[styles.infoBoxTitle, { color: Colors.income }]}>
                      Joining as Contributor
                    </Text>
                  </View>
                  <Text style={styles.infoBoxDesc}>
                    You will sync to the shared family ledger to record expenditures, view real-time
                    cash flow, and review recurring bills.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Join Household & Sync</Text>
                      <ArrowRight size={16} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account & Sign out */}
          <View style={styles.accountRow}>
            <Text style={styles.accountText}>
              Signed in as <Text style={{ color: Colors.text, fontWeight: '600' }}>{user?.email || 'User'}</Text>
            </Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
              <Text style={styles.logoutBtnText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* Security Tag */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={Colors.income} />
            <Text style={styles.securityText}>Multi-account ledger with encrypted Supabase storage</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  appSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.expenseSubdued,
    borderColor: Colors.expenseBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.expense,
    flex: 1,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modeTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  modeContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.textSubdued,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand,
  },
  infoBoxDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  accountText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  logoutBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.expense,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSubdued,
  },
});


