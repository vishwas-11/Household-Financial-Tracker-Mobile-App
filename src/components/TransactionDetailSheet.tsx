// src/components/TransactionDetailSheet.tsx
import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Clock, ShoppingCart, Zap, CreditCard, Coffee, Home, Briefcase, FileText,
  Trash2, Paperclip, Calendar, User, Hash, ExternalLink, Maximize2,
  Repeat, CheckCircle2, Copy, Check, AlertCircle, Tag, ChevronRight, CheckCheck,
} from 'lucide-react-native';
import { Transaction } from '../types';
import { isTransactionUpcoming } from '../lib/transactionCalculations';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';
import { TRANSACTION_CATEGORIES } from '../constants/initialData';
import { useApp } from '../context/AppContext';

interface TransactionDetailSheetProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onViewReceipt?: (url: string) => void;
  onTransactionUpdated?: (updated: Transaction) => void;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  visible,
  transaction,
  onClose,
  onDelete,
  onViewReceipt,
  onTransactionUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const { updateTransaction } = useApp();
  const [copiedId, setCopiedId] = useState(false);

  // Image state - DO NOT use onLoadStart (causes infinite loop on react-native-web)
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const lastTxIdRef = useRef<string | null>(null);

  // Category edit state
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (transaction?.id !== lastTxIdRef.current) {
      lastTxIdRef.current = transaction?.id ?? null;
      setImageError(false);
      setImageLoading(!!transaction?.receiptUrl);
      setSaveSuccess(false);
    }
  }, [transaction?.id, transaction?.receiptUrl]);

  if (!visible || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const isSavings = transaction.type === 'savings';
  const isUpcoming = isTransactionUpcoming(transaction.fullDate);

  const getCategoryIcon = (category: string, size = 16) => {
    const cat = category.toLowerCase();
    if (cat.includes('grocer') || cat.includes('food') || cat.includes('market')) return <ShoppingCart size={size} color={Colors.brand} />;
    if (cat.includes('util') || cat.includes('electric') || cat.includes('water')) return <Zap size={size} color={Colors.warning} />;
    if (cat.includes('salary') || cat.includes('deposit') || cat.includes('income') || cat.includes('freelance')) return <CreditCard size={size} color={Colors.income} />;
    if (cat.includes('dining') || cat.includes('coffee') || cat.includes('restaurant')) return <Coffee size={size} color={Colors.expense} />;
    if (cat.includes('house') || cat.includes('mortgage') || cat.includes('rent')) return <Home size={size} color="#38bdf8" />;
    if (cat.includes('work') || cat.includes('consult')) return <Briefcase size={size} color={Colors.brand} />;
    return <FileText size={size} color={Colors.textMuted} />;
  };

  const handleCopyId = () => { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); };

  const handleDeletePress = () => {
    Alert.alert('Delete Entry', `Are you sure you want to permanently delete "${transaction.description}"? This action cannot be undone.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { onClose(); if (onDelete) onDelete(transaction.id); } }]);
  };

  const handleOpenExternal = async () => {
    if (transaction.receiptUrl) {
      try {
        const canOpen = await Linking.canOpenURL(transaction.receiptUrl);
        if (canOpen) await Linking.openURL(transaction.receiptUrl);
        else Alert.alert('Unable to open link', 'The attachment URL could not be opened on this device.');
      } catch { Alert.alert('Error', 'Failed to open attachment link.'); }
    }
  };

  const handleCategorySelect = async (newCategory: string) => {
    if (newCategory === transaction.category) { setIsCategoryPickerVisible(false); return; }
    setSavingCategory(true);
    try {
      const result = await updateTransaction(transaction.id, { category: newCategory });
      if (result.success) {
        setSaveSuccess(true);
        setIsCategoryPickerVisible(false);
        if (onTransactionUpdated) onTransactionUpdated({ ...transaction, category: newCategory });
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        Alert.alert('Update Failed', result.error || 'Could not save the new category. Please try again.');
      }
    } finally { setSavingCategory(false); }
  };

  const formattedFullDate = (() => {
    try {
      if (transaction.fullDate) {
        const d = new Date(transaction.fullDate);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      return transaction.date || 'Undated';
    } catch { return transaction.date || 'Undated'; }
  })();

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose} />
          <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.dragHandleContainer}><View style={styles.dragHandle} /></View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.categoryBadgeRow}>
                <View style={styles.categoryIconCircle}>{getCategoryIcon(transaction.category, 15)}</View>
                <Text style={styles.categoryHeaderTitle}>{transaction.category}</Text>
                <View style={[styles.typeBadge, isIncome ? styles.typeBadgeIncome : isSavings ? styles.typeBadgeSavings : styles.typeBadgeExpense]}>
                  <Text style={[styles.typeBadgeText, isIncome ? styles.typeTextIncome : isSavings ? styles.typeTextSavings : styles.typeTextExpense]}>
                    {isIncome ? 'Income' : isSavings ? 'Savings' : 'Expenditure'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetBodyContent} showsVerticalScrollIndicator={false}>

              {/* Hero */}
              <View style={styles.heroOuterShell}>
                <View style={styles.heroInnerCard}>
                  <Text style={styles.heroLabel}>TRANSACTION VALUE</Text>
                  <Text style={[styles.heroAmount, isIncome ? styles.heroAmountIncome : isSavings ? styles.heroAmountSavings : styles.heroAmountExpense]}>
                    {isIncome ? `+${formatCurrency(transaction.amount)}` : `-${formatCurrency(transaction.amount)}`}
                  </Text>
                  <Text style={styles.heroDescription} numberOfLines={2}>{transaction.description}</Text>
                  {transaction.isRecurring && (
                    <View style={styles.recurringTag}><Repeat size={12} color={Colors.brand} /><Text style={styles.recurringTagText}>Scheduled Recurring Transfer</Text></View>
                  )}
                  {isUpcoming && (
                    <View style={styles.scheduledBanner}>
                      <View style={styles.scheduledBannerHeader}>
                        <Clock size={13} color="#A5B4FC" />
                        <Text style={styles.scheduledBannerTitle}>Upcoming Scheduled Entry</Text>
                      </View>
                      <Text style={styles.scheduledBannerSub}>
                        This transaction is scheduled for {formattedFullDate}. It is not included in today's Current Holding and will automatically become realized on that date.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Category edit row */}
              <View style={styles.sectionHeaderWrap}><Text style={styles.sectionEyebrow}>CATEGORY</Text></View>
              <View style={styles.categoryEditShell}>
                <View style={styles.categoryEditInner}>
                  <View style={styles.categoryEditLeft}>
                    <View style={styles.categoryEditIconWrap}>{getCategoryIcon(transaction.category, 17)}</View>
                    <View>
                      <Text style={styles.categoryEditValue}>{transaction.category}</Text>
                      {saveSuccess && (
                        <View style={styles.categorySavedRow}>
                          <CheckCheck size={11} color={Colors.income} />
                          <Text style={styles.categorySavedText}>Category updated</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.categoryEditBtn} onPress={() => setIsCategoryPickerVisible(true)} activeOpacity={0.75} disabled={savingCategory}>
                    {savingCategory ? <ActivityIndicator size="small" color={Colors.brand} /> : (<><Tag size={12} color={Colors.brand} /><Text style={styles.categoryEditBtnText}>Change</Text><ChevronRight size={12} color={Colors.brand} /></>)}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bento grid */}
              <View style={styles.sectionHeaderWrap}><Text style={styles.sectionEyebrow}>RECORD SPECIFICATIONS</Text></View>
              <View style={styles.bentoShell}>
                <View style={styles.bentoGrid}>
                  <View style={styles.bentoRow}>
                    <View style={styles.bentoCell}>
                      <View style={styles.bentoCellHeader}><Calendar size={13} color={Colors.textMuted} /><Text style={styles.bentoCellLabel}>Date & Time</Text></View>
                      <Text style={styles.bentoCellValue}>{formattedFullDate}</Text>
                      <Text style={styles.bentoCellSub}>{transaction.fullDate || transaction.date}</Text>
                    </View>
                    <View style={styles.bentoDividerVertical} />
                    <View style={styles.bentoCell}>
                      <View style={styles.bentoCellHeader}><User size={13} color={Colors.textMuted} /><Text style={styles.bentoCellLabel}>Recorded By</Text></View>
                      <Text style={styles.bentoCellValue}>{transaction.memberName || 'Household Member'}</Text>
                      <Text style={styles.bentoCellSub}>Member ID: {transaction.memberId ? transaction.memberId.slice(0, 8) : 'Shared'}</Text>
                    </View>
                  </View>
                  <View style={styles.bentoDividerHorizontal} />
                  <View style={styles.bentoRow}>
                    <TouchableOpacity style={styles.bentoCell} onPress={handleCopyId} activeOpacity={0.7}>
                      <View style={styles.bentoCellHeader}><Hash size={13} color={Colors.textMuted} /><Text style={styles.bentoCellLabel}>Transaction Ref</Text>{copiedId ? <Check size={11} color={Colors.income} /> : <Copy size={11} color={Colors.textSubdued} />}</View>
                      <Text style={styles.bentoCellValueMono} numberOfLines={1}>{transaction.id.startsWith('T-') ? transaction.id : `T-${transaction.id.slice(0, 8)}`}</Text>
                      <Text style={styles.bentoCellSub}>{copiedId ? 'Copied to clipboard' : 'Tap to copy ID'}</Text>
                    </TouchableOpacity>
                    <View style={styles.bentoDividerVertical} />
                    <View style={styles.bentoCell}>
                      <View style={styles.bentoCellHeader}><CheckCircle2 size={13} color={Colors.textMuted} /><Text style={styles.bentoCellLabel}>Ledger Journal</Text></View>
                      <Text style={styles.bentoCellValue}>Schedule D</Text>
                      <Text style={styles.bentoCellSub}>Reconciled Journal Entry</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.sectionHeaderWrap}><Text style={styles.sectionEyebrow}>MEMO & PURPOSE NOTES</Text></View>
              <View style={styles.noteShell}>
                <View style={styles.noteInnerCard}>
                  <Text style={styles.noteText}>{transaction.notes && transaction.notes.trim().length > 0 ? transaction.notes : 'No additional notes or memo recorded for this ledger transaction.'}</Text>
                </View>
              </View>

              {/* Receipts */}
              <View style={styles.sectionHeaderWrap}><Text style={styles.sectionEyebrow}>ATTACHED DOCUMENTS & RECEIPTS</Text></View>
              {transaction.receiptUrl ? (
                <View style={styles.mediaOuterShell}>
                  <View style={styles.mediaInnerCard}>
                    <View style={styles.mediaTopBar}>
                      <View style={styles.mediaInfoRow}><Paperclip size={14} color={Colors.brand} /><Text style={styles.mediaFileName} numberOfLines={1}>Verified Proof of Payment</Text></View>
                      <View style={styles.storagePill}><Text style={styles.storagePillText}>SUPABASE SECURE STORAGE</Text></View>
                    </View>
                    <TouchableOpacity style={styles.thumbnailWrapper} onPress={() => onViewReceipt && onViewReceipt(transaction.receiptUrl!)} activeOpacity={0.85}>
                      {!imageError ? (
                        <>
                          <Image source={{ uri: transaction.receiptUrl }} style={styles.thumbnailImage} resizeMode="cover"
                            onLoad={() => setImageLoading(false)}
                            onError={() => { setImageLoading(false); setImageError(true); }}
                          />
                          {imageLoading && <View style={styles.thumbnailLoader}><ActivityIndicator size="small" color={Colors.brand} /></View>}
                          <View style={styles.thumbnailOverlay}><View style={styles.expandPill}><Maximize2 size={12} color={Colors.white} /><Text style={styles.expandPillText}>Tap to View Full Screen</Text></View></View>
                        </>
                      ) : (
                        <View style={styles.thumbnailErrorOverlay}><AlertCircle size={22} color={Colors.warning} /><Text style={styles.thumbnailErrorTitle}>Image Preview Unavailable</Text><Text style={styles.thumbnailErrorSub}>Tap below to open attachment link</Text></View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.mediaActionRow}>
                      <TouchableOpacity style={styles.mediaActionBtnPrimary} onPress={() => onViewReceipt && onViewReceipt(transaction.receiptUrl!)} activeOpacity={0.7}><Maximize2 size={13} color={Colors.white} /><Text style={styles.mediaActionBtnPrimaryText}>Inspect Full Size</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.mediaActionBtnSecondary} onPress={handleOpenExternal} activeOpacity={0.7}><ExternalLink size={13} color={Colors.text} /><Text style={styles.mediaActionBtnSecondaryText}>Open Original</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyDocShell}><View style={styles.emptyDocInnerCard}><AlertCircle size={20} color={Colors.textSubdued} /><Text style={styles.emptyDocTitle}>No Physical Attachment</Text><Text style={styles.emptyDocSubtitle}>This ledger record does not have any receipt, bill, or invoice document linked.</Text></View></View>
              )}

              {/* Footer actions */}
              <View style={styles.footerSection}>
                {onDelete && (<TouchableOpacity style={styles.deleteFullBtn} onPress={handleDeletePress} activeOpacity={0.7}><Trash2 size={15} color={Colors.expense} /><Text style={styles.deleteFullBtnText}>Delete Transaction Entry</Text></TouchableOpacity>)}
                <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.7}><Text style={styles.dismissBtnText}>Close Details</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker */}
      <Modal visible={isCategoryPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setIsCategoryPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setIsCategoryPickerVisible(false)} />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.pickerDragHandleWrap}><View style={styles.pickerDragHandle} /></View>
            <View style={styles.pickerHeader}>
              <View>
                <Text style={styles.pickerTitle}>Change Category</Text>
                <Text style={styles.pickerSubtitle}>Current: <Text style={{ color: Colors.brand }}>{transaction.category}</Text></Text>
              </View>
              <TouchableOpacity onPress={() => setIsCategoryPickerVisible(false)} style={styles.pickerCloseBtn} activeOpacity={0.7}><X size={18} color={Colors.textSecondary} /></TouchableOpacity>
            </View>
            <FlatList
              data={TRANSACTION_CATEGORIES} keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerListContent}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              renderItem={({ item: category }) => {
                const isSelected = category === transaction.category;
                return (
                  <TouchableOpacity style={[styles.pickerItem, isSelected && styles.pickerItemSelected]} onPress={() => handleCategorySelect(category)} activeOpacity={0.7}>
                    <View style={[styles.pickerItemIcon, isSelected && styles.pickerItemIconSelected]}>{getCategoryIcon(category, 15)}</View>
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>{category}</Text>
                    {isSelected && <Check size={16} color={Colors.brand} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.72)', justifyContent: 'flex-end' },
  backdropTap: { flex: 1 },
  sheetContainer: { backgroundColor: '#0c1017', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', maxHeight: '88%', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 24 },
  dragHandleContainer: { alignItems: 'center', paddingVertical: 10 },
  dragHandle: { width: 38, height: 4.5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  categoryBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 12 },
  categoryIconCircle: { width: 28, height: 28, borderRadius: 7, backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center' },
  categoryHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  typeBadgeIncome: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' },
  typeBadgeSavings: { backgroundColor: 'rgba(94, 106, 210, 0.12)', borderColor: 'rgba(94, 106, 210, 0.3)' },
  typeBadgeExpense: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  typeTextIncome: { color: Colors.income },
  typeTextSavings: { color: Colors.savings },
  typeTextExpense: { color: Colors.textSecondary },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { flexGrow: 0 },
  sheetBodyContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  heroOuterShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 20 },
  heroInnerCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, alignItems: 'center' },
  heroLabel: { fontSize: 9.5, fontWeight: '700', fontFamily: 'monospace', color: Colors.textSubdued, letterSpacing: 1.2, marginBottom: 6 },
  heroAmount: { fontSize: 32, fontWeight: '800', fontFamily: 'monospace', letterSpacing: -0.5, marginBottom: 6 },
  heroAmountIncome: { color: Colors.income },
  heroAmountSavings: { color: Colors.savings },
  heroAmountExpense: { color: Colors.text },
  heroDescription: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center', marginTop: 2 },
  recurringTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.brandSubdued, borderColor: Colors.brandBorder, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  recurringTagText: { fontSize: 10, fontWeight: '600', color: Colors.brand },
  sectionHeaderWrap: { marginBottom: 8, marginTop: 4 },
  sectionEyebrow: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', color: Colors.textSecondary, letterSpacing: 0.8 },
  // Category edit
  scheduledBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.28)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  scheduledBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduledBannerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  scheduledBannerSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    lineHeight: 15,
  },
  categoryEditShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 20 },
  categoryEditInner: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryEditLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  categoryEditIconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  categoryEditValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  categorySavedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  categorySavedText: { fontSize: 10, color: Colors.income, fontWeight: '600' },
  categoryEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.brandSubdued, borderWidth: 1, borderColor: Colors.brandBorder, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8 },
  categoryEditBtnText: { fontSize: 12, fontWeight: '600', color: Colors.brand },
  // Bento
  bentoShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 18 },
  bentoGrid: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden' },
  bentoRow: { flexDirection: 'row' },
  bentoCell: { flex: 1, padding: 12 },
  bentoCellHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  bentoCellLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, flex: 1 },
  bentoCellValue: { fontSize: 12.5, fontWeight: '700', color: Colors.text },
  bentoCellValueMono: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', color: Colors.brand },
  bentoCellSub: { fontSize: 9.5, fontFamily: 'monospace', color: Colors.textSubdued, marginTop: 2 },
  bentoDividerVertical: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  bentoDividerHorizontal: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  // Notes
  noteShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 18 },
  noteInnerCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14 },
  noteText: { fontSize: 12.5, color: Colors.textSecondary, lineHeight: 18 },
  // Media
  mediaOuterShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 20 },
  mediaInnerCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14 },
  mediaTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mediaInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  mediaFileName: { fontSize: 12, fontWeight: '600', color: Colors.text },
  storagePill: { backgroundColor: Colors.surfaceHighlight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  storagePillText: { fontSize: 7.5, fontFamily: 'monospace', fontWeight: '700', color: Colors.textMuted },
  thumbnailWrapper: { height: 150, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 12 },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailLoader: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceHighlight },
  thumbnailOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.35)', alignItems: 'center', justifyContent: 'center' },
  thumbnailErrorOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(239, 68, 68, 0.05)', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 4 },
  thumbnailErrorTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  thumbnailErrorSub: { fontSize: 10, color: Colors.textMuted },
  expandPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  expandPillText: { fontSize: 11, fontWeight: '600', color: Colors.white },
  mediaActionRow: { flexDirection: 'row', gap: 8 },
  mediaActionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.brand, paddingVertical: 9, borderRadius: 8 },
  mediaActionBtnPrimaryText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  mediaActionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: Colors.border, paddingVertical: 9, borderRadius: 8 },
  mediaActionBtnSecondaryText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  emptyDocShell: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', padding: 2, marginBottom: 20 },
  emptyDocInnerCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyDocTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 8, marginBottom: 2 },
  emptyDocSubtitle: { fontSize: 10.5, color: Colors.textMuted, textAlign: 'center', lineHeight: 15 },
  // Footer
  footerSection: { gap: 10, marginTop: 6 },
  deleteFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)' },
  deleteFullBtnText: { fontSize: 12.5, fontWeight: '600', color: Colors.expense },
  dismissBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: Colors.border },
  dismissBtnText: { fontSize: 12.5, fontWeight: '600', color: Colors.textSecondary },
  // Picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  pickerBackdrop: { flex: 1 },
  pickerSheet: { backgroundColor: '#0c1017', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '75%', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 30 },
  pickerDragHandleWrap: { alignItems: 'center', paddingVertical: 10 },
  pickerDragHandle: { width: 38, height: 4.5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 4 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  pickerSubtitle: { fontSize: 12, color: Colors.textSecondary },
  pickerCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  pickerListContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 11 },
  pickerItemSelected: { backgroundColor: Colors.brandSubdued, borderWidth: 1, borderColor: Colors.brandBorder },
  pickerItemIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  pickerItemIconSelected: { backgroundColor: Colors.brandSubdued, borderColor: Colors.brandBorder },
  pickerItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pickerItemTextSelected: { color: Colors.brand },
  pickerSeparator: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 14 },
});

