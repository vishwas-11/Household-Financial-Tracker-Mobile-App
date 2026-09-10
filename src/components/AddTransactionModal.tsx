// src/components/AddTransactionModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Clock, Camera, Image as ImageIcon, Trash2, Check, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { Transaction, TransactionType } from '../types';
import { isTransactionUpcoming } from '../lib/transactionCalculations';
import { Colors } from '../constants/colors';
import { TRANSACTION_CATEGORIES } from '../constants/initialData';
import { useApp } from '../context/AppContext';
import { uploadReceiptImage } from '../lib/storage';
import { MiniDatePicker } from './MiniDatePicker';
import { CURRENCY_SYMBOL } from '../lib/currency';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialDate?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  initialType,
  initialDate,
}) => {
  const { members, user, addTransaction, transactions } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const totalIncomeCount = transactions.filter((t) => t.type === 'income').length;
  const defaultToIncome = initialType ? initialType === 'income' : totalIncomeCount === 0;

  const [type, setType] = useState<TransactionType>(
    initialType || (defaultToIncome ? 'income' : 'expenditure')
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultToIncome ? 'Salary' : TRANSACTION_CATEGORIES[0]);
  const [memberId, setMemberId] = useState(members[0]?.id || 'A');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // When modal opens, sync type, category, and date if specified
  useEffect(() => {
    if (visible) {
      const targetType = initialType || (totalIncomeCount === 0 ? 'income' : 'expenditure');
      setType(targetType);
      if (targetType === 'income') {
        setCategory('Salary');
      } else {
        setCategory(TRANSACTION_CATEGORIES[0]);
      }
      if (initialDate) {
        setDate(initialDate);
      }
    }
  }, [visible, initialType, initialDate, totalIncomeCount]);

  useEffect(() => {
    if (members.length > 0 && !members.some((m) => m.id === memberId)) {
      setMemberId(members[0].id);
    }
  }, [members, memberId]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setNotes('');
    setReceiptUri(null);
    setIsUploading(false);
  };

  const handlePickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos of receipts.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery access is required to attach receipt photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const executeSave = async () => {
    const parsedAmount = parseFloat(amount);
    setIsUploading(true);

    let finalReceiptUrl: string | undefined = undefined;

    if (receiptUri) {
      const uploadRes = await uploadReceiptImage(receiptUri, user?.householdId || 'default-household');
      if (uploadRes.url) {
        finalReceiptUrl = uploadRes.url;
      } else {
        console.warn('[AddTransactionModal] Receipt upload failed:', uploadRes.error);
        Alert.alert(
          'Receipt Upload Notice',
          `The transaction will be saved, but the receipt image could not be uploaded to cloud storage (${uploadRes.error || 'Check network connection'}).`
        );
      }
    }

    const member = members.find((m) => m.id === memberId);
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: displayDate,
      fullDate: date,
      description: description.trim(),
      category,
      type,
      amount: parsedAmount,
      memberId,
      memberName: member ? member.name : 'Household',
      notes: notes.trim() || undefined,
      receiptUrl: finalReceiptUrl,
    };

    await addTransaction(newTx);
    setIsUploading(false);
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter a description for this record.');
      return;
    }

    // Safety check: Alert user if logging expense before income
    if (type === 'expenditure' && totalIncomeCount === 0) {
      Alert.alert(
        'Negative Balance Warning',
        'You have not recorded any income yet. Adding an expenditure first will cause your household funds balance to drop into a negative deficit.\n\nWould you like to record your opening income or salary first?',
        [
          {
            text: 'Record Income First',
            onPress: () => {
              setType('income');
              setCategory('Salary');
            },
            style: 'default',
          },
          {
            text: 'Save Expense Anyway',
            onPress: () => {
              executeSave();
            },
            style: 'destructive',
          },
        ]
      );
      return;
    }

    await executeSave();
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
        {/* Tap outside backdrop to close */}
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
              { height: Math.round(windowHeight * 0.88) },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Record Transaction</Text>
                <Text style={styles.headerSubtitle}>Add verified entry to household funds</Text>
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
              {/* Income-First Guidance Banner */}
              {totalIncomeCount === 0 && (
                type === 'income' ? (
                  <View style={styles.incomeFirstHint}>
                    <View style={styles.hintIconCircle}>
                      <TrendingUp size={14} color={Colors.income} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.incomeFirstHintTitle}>Step 1: Set Up Opening Income First</Text>
                      <Text style={styles.incomeFirstHintText}>
                        Recording your salary, deposits, or opening cash balance first establishes positive funds so your household balance does not start in negative.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.incomeFirstHint, styles.expenseWarningHint]}>
                    <View style={[styles.hintIconCircle, styles.warningIconCircle]}>
                      <AlertTriangle size={14} color={Colors.expense} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.incomeFirstHintTitle, { color: Colors.expense }]}>
                        Negative Balance Warning
                      </Text>
                      <Text style={styles.incomeFirstHintText}>
                        You have 0 income recorded yet. Adding this expense first will cause your household balance to drop into negative.
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setType('income');
                          setCategory('Salary');
                        }}
                        style={styles.switchIncomeBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.switchIncomeText}>Switch to Income First →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )}

              {/* Type Selector Tabs */}
              <View style={styles.typeSelector}>
                {(
                  [
                    { id: 'income', label: 'Income' },
                    { id: 'expenditure', label: 'Expenditure' },
                    { id: 'savings', label: 'Savings' },
                  ] as const
                ).map((item) => {
                  const isSelected = type === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setType(item.id);
                        if (item.id === 'income' && category === TRANSACTION_CATEGORIES[0]) {
                          setCategory('Salary');
                        }
                      }}
                      style={[styles.typeTab, isSelected && styles.typeTabActive]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          isSelected && {
                            color:
                              item.id === 'income'
                                ? Colors.income
                                : item.id === 'savings'
                                ? Colors.brand
                                : Colors.expense,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount ({CURRENCY_SYMBOL}) *</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>{CURRENCY_SYMBOL}</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={true}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    type === 'income'
                      ? 'e.g. Monthly Salary, Freelance Payout, Dividend'
                      : 'e.g. Grocery store run, Wi-Fi bill, Electricity'
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Category Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {(type === 'income'
                    ? ['Salary', 'Investment', 'Business', 'Bonus', 'Rental', 'Other']
                    : TRANSACTION_CATEGORIES
                  ).map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Member Attributed Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Recorded By (Member)</Text>
                <View style={styles.memberPickerRow}>
                  {members.map((m) => {
                    const isSelected = memberId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setMemberId(m.id)}
                        style={[
                          styles.memberChip,
                          isSelected && styles.memberChipActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.memberAvatar,
                            { backgroundColor: m.colorBg || Colors.brand },
                          ]}
                        >
                          <Text style={styles.memberAvatarText}>
                            {m.avatarLetter || m.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.memberChipText,
                            isSelected && styles.memberChipTextActive,
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Interactive Mini Calendar Date Picker */}
              <MiniDatePicker
                value={date}
                onChange={setDate}
                label="TRANSACTION DATE"
                accentColor={
                  type === 'income'
                    ? Colors.income
                    : type === 'savings'
                    ? Colors.brand
                    : Colors.expense
                }
              />

              {/* Informational callout if date is in the future */}
              {isTransactionUpcoming(date) && (
                <View style={styles.upcomingNoteCard}>
                  <Clock size={13} color="#A5B4FC" />
                  <Text style={styles.upcomingNoteText}>
                    Scheduled Transaction: Because this date is in the future, this transaction will be recorded as upcoming and will not alter today's Current Holding until the selected date.
                  </Text>
                </View>
              )}

              {/* Notes Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Notes / Reference (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Additional context, invoice reference, payment mode..."
                  placeholderTextColor={Colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Receipt Attachment Section */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Receipt or Bill (Optional)</Text>
                {receiptUri ? (
                  <View style={styles.receiptPreviewContainer}>
                    <Image
                      source={{ uri: receiptUri }}
                      style={styles.receiptPreviewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setReceiptUri(null)}
                      style={styles.removeReceiptBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color={Colors.expense} />
                      <Text style={styles.removeReceiptText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.receiptUploadRow}>
                    <TouchableOpacity
                      onPress={() => handlePickImage(true)}
                      style={styles.uploadOptionBtn}
                      activeOpacity={0.7}
                    >
                      <Camera size={16} color={Colors.textSecondary} />
                      <Text style={styles.uploadOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePickImage(false)}
                      style={styles.uploadOptionBtn}
                      activeOpacity={0.7}
                    >
                      <ImageIcon size={16} color={Colors.textSecondary} />
                      <Text style={styles.uploadOptionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Bottom Save Action */}
            <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveBtn,
                  type === 'income' && { backgroundColor: Colors.income },
                  type === 'expenditure' && { backgroundColor: Colors.expense },
                ]}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Check size={16} color={Colors.white} />
                    <Text style={styles.saveBtnText}>
                      {type === 'income'
                        ? 'Record Income Entry'
                        : type === 'savings'
                        ? 'Record Savings Entry'
                        : 'Record Expense Entry'}
                    </Text>
                  </>
                )}
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  incomeFirstHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.incomeSubdued,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  expenseWarningHint: {
    backgroundColor: Colors.expenseSubdued,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  hintIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  warningIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  incomeFirstHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.income,
    marginBottom: 2,
  },
  incomeFirstHintText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  switchIncomeBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  switchIncomeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand,
    textDecorationLine: 'underline',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },
  typeTabActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 12,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  memberPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberChipActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  memberAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  memberChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  memberChipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  upcomingNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.32)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  upcomingNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#C7D2FE',
    lineHeight: 16,
  },
  receiptUploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
  },
  receiptPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  removeReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.expenseSubdued,
    borderRadius: 6,
  },
  removeReceiptText: {
    fontSize: 11,
    color: Colors.expense,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

