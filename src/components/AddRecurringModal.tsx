// src/components/AddRecurringModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Calendar, Clock, Repeat } from 'lucide-react-native';
import { RecurringItem, TransactionType } from '../types';
import { Colors } from '../constants/colors';
import { TRANSACTION_CATEGORIES } from '../constants/initialData';
import { useApp } from '../context/AppContext';

interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

const PRESET_DAYS = [1, 5, 10, 15, 16, 20, 25, 28, 30, 31];

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  visible,
  onClose,
}) => {
  const { members, addRecurring } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expenditure');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'Monthly' | 'Bi-weekly' | 'Weekly' | 'Annual'>('Monthly');
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [assignedMemberId, setAssignedMemberId] = useState(members[0]?.id || 'A');
  const [dueDay, setDueDay] = useState<number>(1);

  // Compute next due date preview and cycle info
  const cyclePreview = useMemo(() => {
    let nextDate: Date;
    let isThisMonth: boolean;

    if (dueDay >= todayDate) {
      nextDate = new Date(currentYear, currentMonth, dueDay);
      isThisMonth = true;
    } else {
      nextDate = new Date(currentYear, currentMonth + 1, dueDay);
      isThisMonth = false;
    }

    const formattedDate = nextDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      formattedDate,
      isThisMonth,
      dueDayLabel: `${dueDay}${getOrdinalSuffix(dueDay)}`,
    };
  }, [dueDay, todayDate, currentYear, currentMonth]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const nextDueDate = `${dueDay}${getOrdinalSuffix(dueDay)} of month`;

    const newItem: RecurringItem = {
      id: `rec-${Date.now()}`,
      title: title.trim(),
      amount: parsedAmount,
      frequency,
      nextDueDate,
      category,
      type,
      autoPay: true,
      memberId: assignedMemberId,
    };

    await addRecurring(newItem);
    setTitle('');
    setAmount('');
    onClose();
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
              styles.container,
              { height: Math.round(windowHeight * 0.85) },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>New Recurring Schedule</Text>
                <Text style={styles.headerSubtitle}>
                  Automate recurring bills or income streams
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Type selector */}
              <View style={styles.typeSelector}>
                {(['expenditure', 'income'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[styles.typeTab, type === t && styles.typeTabActive]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        type === t && {
                          color: t === 'income' ? Colors.income : Colors.text,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {t === 'expenditure'
                        ? 'Expenditure (Bill / Sub)'
                        : 'Income (Salary / Deposit)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SCHEDULE TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Netflix Subscription / House Rent"
                  placeholderTextColor={Colors.textSubdued}
                  style={styles.textInput}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSubdued}
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />
              </View>

              {/* Frequency Tabs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FREQUENCY</Text>
                <View style={styles.cadenceRow}>
                  {(['Monthly', 'Bi-weekly', 'Weekly', 'Annual'] as const).map(
                    (f) => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setFrequency(f)}
                        style={[
                          styles.cadenceTab,
                          frequency === f && styles.cadenceTabActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cadenceText,
                            frequency === f && styles.cadenceTextActive,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {/* Interactive Due Date & Day Selection */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>RECURRING PAYMENT DAY</Text>
                  <Text style={styles.selectedDayBadge}>
                    Day {dueDay} ({cyclePreview.dueDayLabel})
                  </Text>
                </View>

                {/* Quick Presets */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetsStrip}
                >
                  {PRESET_DAYS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDueDay(d)}
                      style={[
                        styles.dayPresetBtn,
                        dueDay === d && styles.dayPresetBtnActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayPresetText,
                          dueDay === d && styles.dayPresetTextActive,
                        ]}
                      >
                        {d === 31 ? 'End of mo.' : `${d}${getOrdinalSuffix(d)}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Days 1 to 31 Scrollable Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysScrollStrip}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const isSelected = dueDay === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setDueDay(d)}
                        style={[
                          styles.dayPill,
                          isSelected && styles.dayPillActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayPillText,
                            isSelected && styles.dayPillTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Cycle Status & Forecast Indicator */}
                <View style={styles.cyclePreviewCard}>
                  <View style={styles.cyclePreviewHeader}>
                    <Clock size={12} color="#A5B4FC" />
                    <Text style={styles.cyclePreviewTitle}>
                      Repeats on the {cyclePreview.dueDayLabel} of every month
                    </Text>
                  </View>
                  <Text style={styles.cyclePreviewSub}>
                    Next scheduled cycle: <Text style={styles.cyclePreviewDate}>{cyclePreview.formattedDate}</Text>
                    {cyclePreview.isThisMonth
                      ? ' · Included in this month\'s Dashboard upcoming balance.'
                      : ' · Starts next month\'s financial cycle.'}
                  </Text>
                </View>
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CATEGORY</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        category === cat && styles.chipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === cat && styles.chipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.submitBtn}
                activeOpacity={0.8}
              >
                <Check size={16} color={Colors.white} />
                <Text style={styles.submitBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  typeTabActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectedDayBadge: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 13,
  },
  cadenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cadenceTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cadenceTabActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  cadenceText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  cadenceTextActive: {
    color: Colors.brand,
    fontWeight: '600',
  },
  presetsStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  dayPresetBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dayPresetBtnActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  dayPresetText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  dayPresetTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  daysScrollStrip: {
    gap: 6,
    paddingVertical: 4,
  },
  dayPill: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  dayPillTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  cyclePreviewCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 8,
    padding: 9,
    gap: 3,
    marginTop: 4,
  },
  cyclePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cyclePreviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  cyclePreviewSub: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
  },
  cyclePreviewDate: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.brand,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});
