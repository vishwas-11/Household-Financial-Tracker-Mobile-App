// src/components/AddRecurringModal.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Clock, Calendar, Sparkles } from 'lucide-react-native';
import { RecurringItem, TransactionType } from '../types';
import { Colors } from '../constants/colors';
import { TRANSACTION_CATEGORIES } from '../constants/initialData';
import { useApp } from '../context/AppContext';
import { MiniDatePicker, parseDateString } from './MiniDatePicker';
import { getTodayDateString } from '../lib/transactionCalculations';

interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  visible,
  onClose,
}) => {
  const { members, addRecurring } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const todayStr = useMemo(() => getTodayDateString(), []);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expenditure');
  const [amount, setAmount] = useState('');
  const [firstDate, setFirstDate] = useState(todayStr);
  const [frequency, setFrequency] = useState<'Monthly' | 'Bi-weekly' | 'Weekly' | 'Annual'>('Monthly');
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [assignedMemberId, setAssignedMemberId] = useState(members[0]?.id || 'A');

  // Parse chosen date
  const parsedDate = useMemo(() => parseDateString(firstDate), [firstDate]);

  // Compute live cycle preview and description
  const schedulePreview = useMemo(() => {
    const d = new Date(parsedDate.year, parsedDate.month, parsedDate.day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedDate = `${dayNames[d.getDay()]}, ${parsedDate.day} ${monthNames[parsedDate.month]} ${parsedDate.year}`;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDate = now.getDate();
    const isThisMonth = parsedDate.year === currentYear && parsedDate.month === currentMonth;
    const isUpcomingInMonth = isThisMonth && parsedDate.day > todayDate;
    const isDueToday = isThisMonth && parsedDate.day === todayDate;
    const isFutureMonth = parsedDate.year > currentYear || (parsedDate.year === currentYear && parsedDate.month > currentMonth);

    let cadenceDescription = '';
    if (frequency === 'Monthly') {
      cadenceDescription = `Repeats every month on day ${parsedDate.day}`;
    } else if (frequency === 'Weekly') {
      cadenceDescription = `Repeats every week on ${dayNames[d.getDay()]}`;
    } else if (frequency === 'Bi-weekly') {
      cadenceDescription = `Repeats every 2 weeks`;
    } else if (frequency === 'Annual') {
      cadenceDescription = `Repeats annually on ${monthNames[parsedDate.month]} ${parsedDate.day}`;
    }

    let cycleStatus = '';
    if (isUpcomingInMonth) {
      cycleStatus = `Included in this month's upcoming balance on your Dashboard.`;
    } else if (isDueToday) {
      cycleStatus = `Due today · Eligible for auto-deduction.`;
    } else if (isFutureMonth) {
      cycleStatus = `Starts in next financial cycle (${monthNames[parsedDate.month]} ${parsedDate.year}). Does not affect current month.`;
    } else {
      cycleStatus = `Past start date · Will roll to the upcoming scheduled cycle.`;
    }

    return {
      formattedDate,
      cadenceDescription,
      cycleStatus,
      isUpcomingInMonth,
    };
  }, [parsedDate, frequency]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const newItem: RecurringItem = {
      id: `rec-${Date.now()}`,
      title: title.trim(),
      amount: parsedAmount,
      frequency,
      nextDueDate: firstDate,
      category,
      type,
      autoPay: true,
      memberId: assignedMemberId,
    };

    await addRecurring(newItem);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setAmount('');
    setType('expenditure');
    setFrequency('Monthly');
    setFirstDate(todayStr);
    setCategory(TRANSACTION_CATEGORIES[0]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside backdrop to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.container,
              { height: Math.round(windowHeight * 0.88) },
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
                onPress={handleClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  onPress={() => setType('expenditure')}
                  style={[
                    styles.typeTab,
                    type === 'expenditure' && styles.typeTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      type === 'expenditure' && { color: Colors.expense, fontWeight: '700' },
                    ]}
                  >
                    Recurring Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('income')}
                  style={[
                    styles.typeTab,
                    type === 'income' && styles.typeTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      type === 'income' && { color: Colors.income, fontWeight: '700' },
                    ]}
                  >
                    Recurring Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SCHEDULE TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Netflix Subscription / House Rent"
                  placeholderTextColor={Colors.textMuted}
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
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />
              </View>

              {/* Interactive Calendar Date Picker with Year -> Month -> Date Flow */}
              <MiniDatePicker
                value={firstDate}
                onChange={setFirstDate}
                label="FIRST PAYMENT DATE"
                stepFlow={true}
                accentColor={type === 'income' ? Colors.income : Colors.brand}
              />

              {/* Payment Frequency */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAYMENT FREQUENCY</Text>
                <View style={styles.cadenceRow}>
                  {(['Monthly', 'Bi-weekly', 'Weekly', 'Annual'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setFrequency(freq)}
                      style={[
                        styles.cadenceTab,
                        frequency === freq && styles.cadenceTabActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.cadenceText,
                          frequency === freq && styles.cadenceTextActive,
                        ]}
                      >
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Schedule Summary & Financial Cycle Impact Card */}
              <View style={styles.cyclePreviewCard}>
                <View style={styles.cyclePreviewHeader}>
                  <Sparkles size={13} color="#818CF8" />
                  <Text style={styles.cyclePreviewTitle}>Schedule Summary & Forecast</Text>
                </View>

                <View style={styles.cycleRow}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={styles.cycleRowText}>
                    First Payment: <Text style={styles.boldWhite}>{schedulePreview.formattedDate}</Text>
                  </Text>
                </View>

                <View style={styles.cycleRow}>
                  <Calendar size={11} color="#94A3B8" />
                  <Text style={styles.cycleRowText}>
                    Frequency: <Text style={styles.boldWhite}>{schedulePreview.cadenceDescription}</Text>
                  </Text>
                </View>

                <View style={styles.cycleStatusBox}>
                  <Text style={styles.cycleStatusText}>
                    {schedulePreview.cycleStatus}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    overflow: 'hidden',
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
    paddingBottom: 30,
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
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  cyclePreviewCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  cyclePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cyclePreviewTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cycleRowText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  boldWhite: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  cycleStatusBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  cycleStatusText: {
    fontSize: 10.5,
    color: '#CBD5E1',
    lineHeight: 14,
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
