// src/components/GettingStartedCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Sparkles,
  X,
  CheckCircle2,
  Circle,
  Plus,
  Repeat,
  UserPlus,
  Compass,
  Edit3,
  Check,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface GettingStartedCardProps {
  onOpenAddTransaction: (preselectedType?: 'income' | 'expenditure') => void;
  onOpenAddRecurring?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToRecurring?: () => void;
}

export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  onOpenAddTransaction,
  onOpenAddRecurring,
  onNavigateToMembers,
  onNavigateToRecurring,
}) => {
  const {
    householdName,
    inviteCode,
    transactions,
    members,
    recurringItems,
    updateHouseholdName,
    hasDismissedOnboarding,
    dismissOnboarding,
  } = useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(householdName);
  const [copiedCode, setCopiedCode] = useState(false);

  // If dismissed and has transactions, hide
  if (hasDismissedOnboarding && transactions.length > 0) {
    return null;
  }

  const hasIncome = transactions.some((t) => t.type === 'income');

  // Step 1: Named Household (considered done if not 'My Household' or edited)
  const isStep1Done = householdName !== 'My Household' && householdName.trim().length > 0;
  // Step 2: First Income Transaction
  const isStep2Done = hasIncome;
  // Step 3: Recurring Bill
  const isStep3Done = recurringItems.length > 0;
  // Step 4: Invited Member
  const isStep4Done = members.length > 1;

  const completedCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const handleSaveHouseholdName = async () => {
    if (tempName.trim()) {
      await updateHouseholdName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleCopyInvite = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <View style={styles.card}>
      {/* Glow Accent */}
      <View style={styles.glow} />

      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Sparkles size={16} color={Colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.tagRow}>
              <Text style={styles.eyebrow}>GETTING STARTED</Text>
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>{completedCount}/4 Completed</Text>
              </View>
            </View>
            <Text style={styles.title}>Welcome to Your Household Ledger</Text>
            <Text style={styles.subtitle}>
              Follow these setup steps to activate your live performance analytics.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={dismissOnboarding}
          style={styles.dismissBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${Math.max(5, progressPercent)}%` }]} />
      </View>

      {/* 4 Interactive Checklist Steps */}
      <View style={styles.stepsContainer}>
        
        {/* Step 1: Name Household */}
        <View style={[styles.stepItem, isStep1Done && styles.stepItemDone]}>
          <View style={styles.stepHeader}>
            {isStep1Done ? (
              <CheckCircle2 size={18} color={Colors.income} />
            ) : (
              <Circle size={18} color={Colors.textMuted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, isStep1Done && styles.stepTitleDone]}>
                1. Name Your Household
              </Text>
              <Text style={styles.stepDesc}>
                Current: <Text style={{ color: Colors.text, fontWeight: '600' }}>{householdName}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setTempName(householdName);
                setIsEditingName(true);
              }}
              style={styles.stepActionBtn}
              activeOpacity={0.7}
            >
              <Edit3 size={12} color={Colors.brand} />
              <Text style={styles.stepActionText}>{isStep1Done ? 'Edit' : 'Rename'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: Record First Income (Salary / Opening Balance) */}
        <View style={[styles.stepItem, isStep2Done && styles.stepItemDone]}>
          <View style={styles.stepHeader}>
            {isStep2Done ? (
              <CheckCircle2 size={18} color={Colors.income} />
            ) : (
              <Circle size={18} color={Colors.textMuted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, isStep2Done && styles.stepTitleDone]}>
                2. Log Your Opening Income or Salary First
              </Text>
              <Text style={styles.stepDesc}>
                {isStep2Done
                  ? `Opening income active. Balance: â‚¹${(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)).toLocaleString('en-IN')}`
                  : 'Important: Record your salary, deposit, or cash balance first so your balance does not start in negative.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onOpenAddTransaction('income')}
              style={[styles.stepActionBtn, !isStep2Done && styles.stepActionPrimary]}
              activeOpacity={0.7}
            >
              <Plus size={12} color={!isStep2Done ? Colors.white : Colors.brand} />
              <Text style={[styles.stepActionText, !isStep2Done && { color: Colors.white }]}>
                {isStep2Done ? 'Add More' : 'Add Income First'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 3: Add Recurring Obligation */}
        <View style={[styles.stepItem, isStep3Done && styles.stepItemDone]}>
          <View style={styles.stepHeader}>
            {isStep3Done ? (
              <CheckCircle2 size={18} color={Colors.income} />
            ) : (
              <Circle size={18} color={Colors.textMuted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, isStep3Done && styles.stepTitleDone]}>
                3. Schedule Fixed Recurring Bills
              </Text>
              <Text style={styles.stepDesc}>
                {isStep3Done
                  ? `${recurringItems.length} recurring commitment(s) active.`
                  : 'Track monthly rent, electricity, Wi-Fi, or EMIs.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (onOpenAddRecurring) onOpenAddRecurring();
                else if (onNavigateToRecurring) onNavigateToRecurring();
              }}
              style={styles.stepActionBtn}
              activeOpacity={0.7}
            >
              <Repeat size={12} color={Colors.brand} />
              <Text style={styles.stepActionText}>{isStep3Done ? 'Manage' : 'Schedule'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 4: Invite Family Member */}
        <View style={[styles.stepItem, isStep4Done && styles.stepItemDone]}>
          <View style={styles.stepHeader}>
            {isStep4Done ? (
              <CheckCircle2 size={18} color={Colors.income} />
            ) : (
              <Circle size={18} color={Colors.textMuted} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, isStep4Done && styles.stepTitleDone]}>
                4. Invite Co-Owner or Family Members
              </Text>
              <Text style={styles.stepDesc}>
                Invite code: <Text style={{ fontFamily: 'monospace', color: Colors.brand, fontWeight: '700' }}>{inviteCode}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyInvite}
              style={styles.stepActionBtn}
              activeOpacity={0.7}
            >
              {copiedCode ? (
                <>
                  <Check size={12} color={Colors.income} />
                  <Text style={[styles.stepActionText, { color: Colors.income }]}>Copied</Text>
                </>
              ) : (
                <>
                  <UserPlus size={12} color={Colors.brand} />
                  <Text style={styles.stepActionText}>Copy Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Navigation Tips & Balance Advice Footer */}
      <View style={styles.navTipFooter}>
        <Compass size={16} color={Colors.brand} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.navTipText}>
            <Text style={{ fontWeight: '700', color: Colors.text }}>Important Rule:</Text> Always record your monthly salary, savings deposit, or opening funds first. This ensures your household balance does not start in negative and activates your savings health score.
          </Text>
          <Text style={[styles.navTipText, { marginTop: 4 }]}>
            <Text style={{ fontWeight: '700', color: Colors.text }}>Navigation Tip:</Text> Use the bottom navigation bar to switch between <Text style={{ color: Colors.brand }}>Dashboard</Text> (overview), <Text style={{ color: Colors.brand }}>Ledger</Text> (all receipts), <Text style={{ color: Colors.brand }}>Recurring</Text> (bills), and <Text style={{ color: Colors.brand }}>Members</Text> (family).
          </Text>
        </View>
      </View>

      {/* Quick Skip Link */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={dismissOnboarding} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip guide for now</Text>
        </TouchableOpacity>
      </View>

      {/* Rename Household Modal */}
      <Modal visible={isEditingName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Household</Text>
            <Text style={styles.modalSubtitle}>
              Personalize the ledger display for you and your family.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="e.g. Verma Family, 402 Palm Heights"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsEditingName(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveHouseholdName}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(94, 106, 210, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  eyebrow: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  progressPill: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  dismissBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 2,
  },
  stepsContainer: {
    gap: 8,
  },
  stepItem: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 10,
  },
  stepItemDone: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  stepTitleDone: {
    color: Colors.textSecondary,
  },
  stepDesc: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 1,
  },
  stepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stepActionPrimary: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  stepActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand,
  },
  navTipFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(94, 106, 210, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.18)',
    borderRadius: 16,
    padding: 10,
    marginTop: 12,
  },
  navTipText: {
    fontSize: 10.5,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  skipRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  skipText: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
  },
  modalCancelText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.brand,
  },
  modalSaveText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
});

