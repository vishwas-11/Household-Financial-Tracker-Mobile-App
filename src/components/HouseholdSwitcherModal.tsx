// src/components/HouseholdSwitcherModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Home,
  CheckCircle2,
  Plus,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Building,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../constants/colors';
import { HouseholdInfo } from '../types';
import { useApp } from '../context/AppContext';

interface HouseholdSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HouseholdSwitcherModal: React.FC<HouseholdSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {
    userHouseholds,
    activeHouseholdId,
    switchHousehold,
    joinHousehold,
    createHousehold,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'join' | 'create'>('list');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newNameInput, setNewNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSwitch = async (id: string) => {
    if (id === activeHouseholdId) {
      onClose();
      return;
    }
    setIsLoading(true);
    try {
      const res = await switchHousehold(id);
      if (res.success) {
        onClose();
      } else {
        Alert.alert('Switch Error', res.error || 'Failed to switch household.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Required', 'Please enter a valid household invite code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await joinHousehold(code);
      if (res.success) {
        setInviteCodeInput('');
        setActiveTab('list');
        onClose();
      } else {
        Alert.alert('Join Failed', res.error || 'Invalid invite code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = newNameInput.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a household name.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await createHousehold(name);
      if (res.success) {
        setNewNameInput('');
        setActiveTab('list');
        onClose();
      } else {
        Alert.alert('Creation Failed', res.error || 'Failed to create household.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 24) + 28 },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconBadge}>
                  <Building size={16} color={Colors.brand} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Switch Household</Text>
                  <Text style={styles.headerSubtitle}>
                    Manage shared finances across families & ledgers
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Action Navigation Tabs */}
            <View style={styles.tabStrip}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
                onPress={() => setActiveTab('list')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'list' && styles.tabBtnTextActive,
                  ]}
                >
                  My Households ({userHouseholds?.length || 1})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'join' && styles.tabBtnActive]}
                onPress={() => setActiveTab('join')}
                activeOpacity={0.7}
              >
                <KeyRound size={11} color={activeTab === 'join' ? Colors.white : Colors.textMuted} />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'join' && styles.tabBtnTextActive,
                  ]}
                >
                  Join Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
                onPress={() => setActiveTab('create')}
                activeOpacity={0.7}
              >
                <Plus size={11} color={activeTab === 'create' ? Colors.white : Colors.textMuted} />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'create' && styles.tabBtnTextActive,
                  ]}
                >
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab: Household List */}
            {activeTab === 'list' && (
              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.listWrap}>
                  {userHouseholds?.map((hh) => {
                    const isActive = hh.id === activeHouseholdId;
                    const isCopied = copiedId === hh.id;

                    return (
                      <TouchableOpacity
                        key={hh.id}
                        style={[styles.hhCard, isActive && styles.hhCardActive]}
                        onPress={() => handleSwitch(hh.id)}
                        activeOpacity={0.75}
                        disabled={isLoading}
                      >
                        <View style={styles.hhCardRow}>
                          <View
                            style={[
                              styles.hhIconBadge,
                              isActive && styles.hhIconBadgeActive,
                            ]}
                          >
                            <Home
                              size={16}
                              color={isActive ? Colors.brand : Colors.textMuted}
                            />
                          </View>

                          <View style={styles.hhTextWrap}>
                            <View style={styles.hhNameRow}>
                              <Text
                                style={[styles.hhName, isActive && styles.hhNameActive]}
                                numberOfLines={1}
                              >
                                {hh.name}
                              </Text>
                              {hh.isOwner ? (
                                <View style={styles.ownerBadge}>
                                  <ShieldCheck size={9} color={Colors.income} />
                                  <Text style={styles.ownerBadgeText}>OWNER</Text>
                                </View>
                              ) : (
                                <View style={styles.memberBadge}>
                                  <Text style={styles.memberBadgeText}>
                                    {hh.role?.toUpperCase() || 'MEMBER'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.codeRow}>
                              <Text style={styles.codeLabel}>Code: </Text>
                              <Text style={styles.codeValue}>{hh.inviteCode}</Text>
                              <TouchableOpacity
                                style={styles.inlineCopyBtn}
                                onPress={() => handleCopyCode(hh.inviteCode, hh.id)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                {isCopied ? (
                                  <View style={styles.copiedInline}>
                                    <Check size={10} color={Colors.income} />
                                    <Text style={styles.copiedInlineText}>Copied</Text>
                                  </View>
                                ) : (
                                  <Copy size={11} color={Colors.textMuted} />
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.hhCardRight}>
                            {isActive ? (
                              <View style={styles.activePill}>
                                <CheckCircle2 size={12} color={Colors.income} />
                                <Text style={styles.activePillText}>ACTIVE</Text>
                              </View>
                            ) : (
                              <View style={styles.switchBtn}>
                                <Text style={styles.switchBtnText}>Switch</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Tab: Join Existing Household */}
            {activeTab === 'join' && (
              <View style={styles.formWrap}>
                <View style={styles.formBox}>
                  <Text style={styles.formLabel}>HOUSEHOLD INVITE CODE</Text>
                  <Text style={styles.formSub}>
                    Enter the unique 7-character invite code (e.g. HF-7X29) shared by the family owner.
                  </Text>
                  <TextInput
                    value={inviteCodeInput}
                    onChangeText={(t) => setInviteCodeInput(t.toUpperCase())}
                    placeholder="e.g. HF-9ABC"
                    placeholderTextColor={Colors.textSubdued}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.textInput}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      !inviteCodeInput.trim() && styles.submitBtnDisabled,
                    ]}
                    onPress={handleJoin}
                    disabled={isLoading || !inviteCodeInput.trim()}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <KeyRound size={14} color={Colors.white} />
                        <Text style={styles.submitBtnText}>Join Household</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Tab: Create New Household */}
            {activeTab === 'create' && (
              <View style={styles.formWrap}>
                <View style={styles.formBox}>
                  <Text style={styles.formLabel}>NEW HOUSEHOLD NAME</Text>
                  <Text style={styles.formSub}>
                    Create an independent verified ledger for another property, family fund, or personal budget.
                  </Text>
                  <TextInput
                    value={newNameInput}
                    onChangeText={setNewNameInput}
                    placeholder="e.g. Vacation Villa / Parents Fund"
                    placeholderTextColor={Colors.textSubdued}
                    style={styles.textInput}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      !newNameInput.trim() && styles.submitBtnDisabled,
                    ]}
                    onPress={handleCreate}
                    disabled={isLoading || !newNameInput.trim()}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Plus size={14} color={Colors.white} />
                        <Text style={styles.submitBtnText}>Create & Switch</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#0E1118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    maxHeight: '85%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: 3,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.brand,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: 340,
  },
  listWrap: {
    gap: 10,
    paddingBottom: 24,
  },
  hhCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hhCardActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(94, 106, 210, 0.08)',
  },
  hhCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hhIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hhIconBadgeActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brandBorder,
  },
  hhTextWrap: {
    flex: 1,
    gap: 3,
    marginRight: 10,
  },
  hhNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hhName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    maxWidth: 160,
  },
  hhNameActive: {
    color: Colors.text,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
  },
  memberBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  memberBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.textMuted,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  codeLabel: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  codeValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  inlineCopyBtn: {
    marginLeft: 6,
    padding: 2,
  },
  copiedInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  copiedInlineText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
  },
  hhCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
    letterSpacing: 0.5,
  },
  switchBtn: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  switchBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.brand,
  },
  formWrap: {
    paddingVertical: 6,
  },
  formBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  formSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
