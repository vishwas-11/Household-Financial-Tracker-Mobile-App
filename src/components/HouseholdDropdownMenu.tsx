// src/components/HouseholdDropdownMenu.tsx
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
  Home,
  Building,
  CheckCircle2,
  Check,
  Copy,
  Plus,
  KeyRound,
  ShieldCheck,
  X,
  ChevronRight,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface HouseholdDropdownMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const HouseholdDropdownMenu: React.FC<HouseholdDropdownMenuProps> = ({
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

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'none' | 'join' | 'create'>('none');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createNameInput, setCreateNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleCopyCode = async (code: string, id: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSwitch = async (id: string) => {
    if (id === activeHouseholdId) {
      onClose();
      return;
    }
    setSwitchingId(id);
    try {
      const res = await switchHousehold(id);
      if (res.success) {
        onClose();
      } else {
        Alert.alert('Switch Error', res.error || 'Failed to switch household.');
      }
    } finally {
      setSwitchingId(null);
    }
  };

  const handleJoin = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Required', 'Please enter a household invite code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await joinHousehold(code);
      if (res.success) {
        setJoinCodeInput('');
        setActiveAction('none');
        onClose();
      } else {
        Alert.alert('Join Failed', res.error || 'Invalid invite code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    const name = createNameInput.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a household name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createHousehold(name);
      if (res.success) {
        setCreateNameInput('');
        setActiveAction('none');
        onClose();
      } else {
        Alert.alert('Create Failed', res.error || 'Failed to create household.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setActiveAction('none');
    setJoinCodeInput('');
    setCreateNameInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={resetAndClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={resetAndClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.popoverWrap, { top: insets.top + 56 }]}
        >
          <View style={styles.popoverCard}>
            {/* Popover Header */}
            <View style={styles.popoverHeader}>
              <View style={styles.headerLeft}>
                <Building size={14} color={Colors.brand} />
                <Text style={styles.headerTitle}>SWITCH HOUSEHOLD</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {userHouseholds?.length || 1}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={resetAndClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Households List */}
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {userHouseholds?.map((hh) => {
                const isActive = hh.id === activeHouseholdId;
                const isCopied = copiedId === hh.id;
                const isThisSwitching = switchingId === hh.id;

                return (
                  <TouchableOpacity
                    key={hh.id}
                    style={[styles.hhItem, isActive && styles.hhItemActive]}
                    onPress={() => handleSwitch(hh.id)}
                    disabled={isActive || isThisSwitching}
                    activeOpacity={0.7}
                  >
                    {/* Left Icon */}
                    <View
                      style={[
                        styles.itemIconWrap,
                        isActive && styles.itemIconWrapActive,
                      ]}
                    >
                      <Home
                        size={15}
                        color={isActive ? Colors.brand : Colors.textMuted}
                      />
                    </View>

                    {/* Middle Info */}
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text
                          style={[
                            styles.itemName,
                            isActive && styles.itemNameActive,
                          ]}
                          numberOfLines={1}
                        >
                          {hh.name}
                        </Text>
                        {hh.isOwner ? (
                          <View style={styles.ownerBadge}>
                            <ShieldCheck size={8} color={Colors.income} />
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

                      {/* Code & Inline Copy */}
                      <View style={styles.codeRow}>
                        <Text style={styles.codeLabel}>Code: </Text>
                        <Text style={styles.codeValue}>{hh.inviteCode}</Text>
                        <TouchableOpacity
                          style={styles.inlineCopyBtn}
                          onPress={() => handleCopyCode(hh.inviteCode, hh.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {isCopied ? (
                            <View style={styles.copiedInline}>
                              <Check size={10} color={Colors.income} />
                              <Text style={styles.copiedInlineText}>Copied</Text>
                            </View>
                          ) : (
                            <Copy size={10} color={Colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Right Action / Active Pill */}
                    <View style={styles.itemRight}>
                      {isActive ? (
                        <View style={styles.activePill}>
                          <CheckCircle2 size={11} color={Colors.income} />
                          <Text style={styles.activePillText}>ACTIVE</Text>
                        </View>
                      ) : isThisSwitching ? (
                        <ActivityIndicator size="small" color={Colors.brand} />
                      ) : (
                        <View style={styles.switchBtn}>
                          <Text style={styles.switchBtnText}>Switch</Text>
                          <ChevronRight size={11} color={Colors.brand} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Section: Quick Actions & Inline Expand */}
            <View style={styles.actionsDivider} />

            {activeAction === 'none' ? (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveAction('join')}
                  activeOpacity={0.7}
                >
                  <KeyRound size={12} color={Colors.brand} />
                  <Text style={styles.quickActionText}>Join with Code</Text>
                </TouchableOpacity>

                <View style={styles.quickActionSep} />

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveAction('create')}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color={Colors.brand} />
                  <Text style={styles.quickActionText}>Create New</Text>
                </TouchableOpacity>
              </View>
            ) : activeAction === 'join' ? (
              <View style={styles.inlineForm}>
                <View style={styles.inlineFormHeader}>
                  <Text style={styles.inlineFormTitle}>JOIN WITH INVITE CODE</Text>
                  <TouchableOpacity
                    onPress={() => setActiveAction('none')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.inlineCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inlineInputRow}>
                  <TextInput
                    value={joinCodeInput}
                    onChangeText={(v) => setJoinCodeInput(v.toUpperCase())}
                    placeholder="e.g. HF-ABC12"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.inlineInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.inlineSubmitBtn,
                      (!joinCodeInput.trim() || isSubmitting) && styles.inlineSubmitDisabled,
                    ]}
                    onPress={handleJoin}
                    disabled={!joinCodeInput.trim() || isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.inlineSubmitText}>Join</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inlineForm}>
                <View style={styles.inlineFormHeader}>
                  <Text style={styles.inlineFormTitle}>CREATE NEW HOUSEHOLD</Text>
                  <TouchableOpacity
                    onPress={() => setActiveAction('none')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.inlineCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inlineInputRow}>
                  <TextInput
                    value={createNameInput}
                    onChangeText={setCreateNameInput}
                    placeholder="e.g. Vacation Villa"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.inlineInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.inlineSubmitBtn,
                      (!createNameInput.trim() || isSubmitting) && styles.inlineSubmitDisabled,
                    ]}
                    onPress={handleCreate}
                    disabled={!createNameInput.trim() || isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.inlineSubmitText}>Create</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  popoverWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    maxWidth: 420,
    alignSelf: 'center',
    zIndex: 999,
  },
  popoverCard: {
    backgroundColor: '#11141D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 24,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    maxHeight: 250,
  },
  listContent: {
    gap: 8,
  },
  hhItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hhItemActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(94, 106, 210, 0.08)',
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemIconWrapActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brandBorder,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
    gap: 3,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    maxWidth: 160,
  },
  itemNameActive: {
    color: Colors.text,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
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
    paddingVertical: 1,
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
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  codeValue: {
    fontSize: 10.5,
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
    gap: 2,
  },
  copiedInlineText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  activePillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
    letterSpacing: 0.5,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand,
  },
  actionsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 10,
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  quickActionSep: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inlineForm: {
    paddingTop: 4,
    gap: 8,
  },
  inlineFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineFormTitle: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  inlineCancelText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  inlineInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  inlineSubmitBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSubmitDisabled: {
    opacity: 0.45,
  },
  inlineSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
