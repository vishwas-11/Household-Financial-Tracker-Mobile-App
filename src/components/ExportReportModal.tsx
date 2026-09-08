// src/components/ExportReportModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  FileText,
  Download,
  Calendar,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import {
  ReportScope,
  ReportScopeType,
  computeReportAnalytics,
  exportReportPdf,
  parseTxDate,
} from '../lib/reportGenerator';
import { formatCurrency } from '../lib/currency';

interface ExportReportModalProps {
  visible: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  visible,
  onClose,
}) => {
  const { transactions, members, householdName, inviteCode } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Find the latest transaction date to intelligently default month/year selectors
  const latestTxDate = useMemo(() => {
    if (transactions.length === 0) return new Date();
    const sorted = [...transactions].sort(
      (a, b) => parseTxDate(b).getTime() - parseTxDate(a).getTime()
    );
    return parseTxDate(sorted[0]);
  }, [transactions]);

  // Check if current month has transactions
  const hasCurrentMonthTx = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    return transactions.some((tx) => {
      const d = parseTxDate(tx);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });
  }, [transactions]);

  // Default to 'all_records' if this_month has 0 transactions so user immediately sees live data
  const [scopeType, setScopeType] = useState<ReportScopeType>(
    hasCurrentMonthTx ? 'this_month' : 'all_records'
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    hasCurrentMonthTx ? currentYear : latestTxDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    hasCurrentMonthTx ? currentMonth : latestTxDate.getMonth()
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Available years for selection
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1, latestTxDate.getFullYear()]);
    transactions.forEach((tx) => {
      const d = parseTxDate(tx);
      years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear, latestTxDate]);

  // Current scope definition
  const currentScope: ReportScope = useMemo(() => {
    return {
      type: scopeType,
      year: selectedYear,
      month: selectedMonth,
    };
  }, [scopeType, selectedYear, selectedMonth]);

  // Live analytics preview calculation
  const analytics = useMemo(() => {
    return computeReportAnalytics(transactions, members, currentScope);
  }, [transactions, members, currentScope]);

  const handleGeneratePdf = async () => {
    setIsExporting(true);
    try {
      const result = await exportReportPdf(analytics, householdName, inviteCode);
      if (!result.success) {
        Alert.alert('Export Failed', result.error || 'Unable to generate statement document.');
      } else {
        // On native mobile, close modal after invoking share sheet
        if (Platform.OS !== 'web') {
          onClose();
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to export document.');
    } finally {
      setIsExporting(false);
    }
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
        {/* Backdrop dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            { height: Math.round(windowHeight * 0.88) },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <FileText size={16} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Financial Statement & Reconciliation</Text>
                <Text style={styles.headerSubtitle}>
                  Print-ready CPA reconciliation report & balanced ledger
                </Text>
              </View>
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
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Timeline Scope Selector Tabs */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>SELECT RECONCILIATION TIMELINE</Text>
              <View style={styles.scopeTabsContainer}>
                {(
                  [
                    { id: 'all_records', label: 'All Records' },
                    { id: 'this_month', label: 'This Month' },
                    { id: '30_days', label: '30 Days', rawId: 'last_30_days' },
                    { id: 'specific_month', label: 'Specific Month' },
                    { id: 'past_12_months', label: '12 Months' },
                    { id: 'specific_year', label: 'Annual FY' },
                  ] as const
                ).map((tab) => {
                  const targetId = (tab as any).rawId || tab.id;
                  const isSelected = scopeType === targetId;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setScopeType(targetId)}
                      style={[styles.scopeTab, isSelected && styles.scopeTabActive]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.scopeTabText,
                          isSelected && styles.scopeTabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sub-selectors for Specific Month */}
            {scopeType === 'specific_month' && (
              <View style={styles.subPickerCard}>
                <Text style={styles.subPickerTitle}>SELECT MONTH & YEAR TO AUDIT</Text>
                
                {/* Year Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {availableYears.map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => setSelectedYear(yr)}
                      style={[styles.chip, selectedYear === yr && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Month Grid */}
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((mName, idx) => {
                    const isSelected = selectedMonth === idx;
                    return (
                      <TouchableOpacity
                        key={mName}
                        onPress={() => setSelectedMonth(idx)}
                        style={[styles.monthTile, isSelected && styles.monthTileActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.monthTileText, isSelected && styles.monthTileTextActive]}>
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Sub-selectors for Annual Report Year */}
            {scopeType === 'specific_year' && (
              <View style={styles.subPickerCard}>
                <Text style={styles.subPickerTitle}>SELECT FISCAL YEAR</Text>
                <View style={styles.yearGrid}>
                  {availableYears.map((yr) => {
                    const isSelected = selectedYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setSelectedYear(yr)}
                        style={[styles.yearTile, isSelected && styles.yearTileActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.yearTileText, isSelected && styles.yearTileTextActive]}>
                          FY {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Live Financial Reconciliation Position Preview */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.previewTag}>RECONCILIATION SUMMARY</Text>
                </View>
                <Text style={styles.entriesBadge}>{analytics.transactionCount} entries</Text>
              </View>

              <Text style={styles.previewPeriodTitle}>{analytics.periodLabel}</Text>
              <Text style={styles.previewDateRange}>
                <Calendar size={12} color={Colors.textMuted} /> {analytics.dateRangeText}
              </Text>

              {/* Accounting Position Summary */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>GROSS INFLOW</Text>
                  <Text style={[styles.metricVal, { color: Colors.income }]}>
                    +{formatCurrency(analytics.totalIncome, { showDecimals: false })}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TOTAL OUTFLOW</Text>
                  <Text style={[styles.metricVal, { color: Colors.expense }]}>
                    -{formatCurrency(analytics.totalExpense, { showDecimals: false })}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>NET SURPLUS</Text>
                  <Text
                    style={[
                      styles.metricVal,
                      { color: analytics.netBalance >= 0 ? Colors.income : Colors.expense },
                    ]}
                  >
                    {analytics.netBalance >= 0 ? '+' : ''}
                    {formatCurrency(analytics.netBalance, { showDecimals: false })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Report Document Features Badge List */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>STANDARDS & COMPLIANCE INCLUDED</Text>
              <View style={styles.featureGrid}>
                <View style={styles.featureItem}>
                  <Check size={14} color={Colors.brand} />
                  <Text style={styles.featureText}>Double-Entry Accounting Reconciliation Position</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={14} color={Colors.brand} />
                  <Text style={styles.featureText}>Schedule A: Category Classification & Share Bars</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={14} color={Colors.brand} />
                  <Text style={styles.featureText}>Schedule B: Member Inflow/Outflow Settlement</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={14} color={Colors.brand} />
                  <Text style={styles.featureText}>Schedule D: Itemized Ledger with Voucher Ref #</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={14} color={Colors.brand} />
                  <Text style={styles.featureText}>Dual Sign-off Blocks for Primary & Co-Owner</Text>
                </View>
              </View>

              <View style={styles.printOptimizedNote}>
                <ShieldCheck size={14} color={Colors.brand} />
                <Text style={styles.printNoteText}>
                  A4 Print-Optimized CPA format &bull; Exclusively outputs clean financial document
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <TouchableOpacity
              onPress={handleGeneratePdf}
              disabled={isExporting}
              style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Download size={16} color={Colors.white} />
                  <Text style={styles.exportBtnText}>Download Financial Statement</Text>
                </>
              )}
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
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
  scrollContent: {
    flex: 1,
  },
  scrollBody: {
    padding: 20,
    gap: 16,
  },
  sectionGroup: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scopeTabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 4,
  },
  scopeTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  scopeTabActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scopeTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  scopeTabTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  subPickerCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  subPickerTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  chipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthTile: {
    width: '23%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthTileActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  monthTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  monthTileTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  yearGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  yearTile: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearTileActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  yearTileText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  yearTileTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.income,
  },
  previewTag: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  entriesBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    backgroundColor: Colors.brandSubdued,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewPeriodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  previewDateRange: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginTop: 6,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  featuresCard: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  featuresTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  featureGrid: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  printOptimizedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  printNoteText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
