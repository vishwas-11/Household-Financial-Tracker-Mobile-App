// src/screens/main/DashboardScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Plus, FileText, Download, Receipt } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { CashFlowChart } from '../../components/CashFlowChart';
import { TransactionItem } from '../../components/TransactionItem';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ReceiptViewerModal } from '../../components/ReceiptViewerModal';
import { ExportReportModal } from '../../components/ExportReportModal';
import { GettingStartedCard } from '../../components/GettingStartedCard';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    transactions,
    monthlyCashFlow,
    householdName,
    isRefreshing,
    refreshData,
    deleteTransaction,
  } = useApp();

  const [timeRange, setTimeRange] = useState<'month' | '30d' | '12m'>('month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expenditure'>('income');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [receiptUrlToView, setReceiptUrlToView] = useState<string | null>(null);

  const hasIncome = transactions.some((t) => t.type === 'income');

  const handleOpenAddModal = (preselectedType?: 'income' | 'expenditure') => {
    setModalInitialType(preselectedType || (hasIncome ? 'expenditure' : 'income'));
    setIsAddModalOpen(true);
  };

  // Totals calculations from actual ledger
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expenditure')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const recentTransactions = transactions.slice(0, 5);

  const incomeCount = transactions.filter((t) => t.type === 'income').length;
  const expenseCount = transactions.filter((t) => t.type === 'expenditure').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onOpenAddModal={() => handleOpenAddModal()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={Colors.brand}
          />
        }
      >
        {/* First-Time Guided Onboarding & Setup Card */}
        <GettingStartedCard
          onOpenAddTransaction={(type) => handleOpenAddModal(type || 'income')}
          onNavigateToMembers={() => navigation.navigate('Members')}
          onNavigateToRecurring={() => navigation.navigate('Recurring')}
        />

        {/* Title & Time Range Filter */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.viewTitle}>Performance Overview</Text>
            <Text style={styles.viewSubtitle}>
              Tracking {householdName} household efficiency & liquidity
            </Text>
          </View>

          <View style={styles.timeRangePicker}>
            {(['month', '30d', '12m'] as const).map((r) => {
              const label = r === 'month' ? 'This Month' : r === '30d' ? '30 Days' : '12 Months';
              const isSelected = timeRange === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setTimeRange(r)}
                  style={[styles.rangeTab, isSelected && styles.rangeTabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rangeText, isSelected && styles.rangeTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4 Stat Cards */}
        <StatCard
          label="NET MONTHLY BALANCE"
          value={formatCurrency(balance)}
          badgeText={transactions.length > 0 ? (balance >= 0 ? 'Surplus' : 'Deficit') : '0 Entries'}
          badgeType={balance >= 0 ? 'income' : 'expense'}
          progressPercent={totalIncome > 0 ? Math.min(100, Math.max(0, Math.round((balance / totalIncome) * 100))) : 0}
          progressColor={balance >= 0 ? Colors.income : Colors.expense}
        />

        <View style={styles.statRow}>
          <View style={{ flex: 1 }}>
            <StatCard
              label="TOTAL INFLOW"
              value={formatCurrency(totalIncome, { showDecimals: false })}
              badgeText={incomeCount > 0 ? `${incomeCount} credits` : '0 entries'}
              badgeType="income"
              progressPercent={totalIncome > 0 ? 100 : 0}
              progressColor={Colors.income}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              label="EXPENDITURE"
              value={formatCurrency(totalExpense, { showDecimals: false })}
              badgeText={expenseCount > 0 ? `${expenseCount} debits` : '0 entries'}
              badgeType="expense"
              progressPercent={totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0}
              progressColor={Colors.expense}
            />
          </View>
        </View>

        <StatCard
          label="BUDGET HEALTH (SAVINGS RATE)"
          value={`${savingsRate}%`}
          badgeText={totalIncome > 0 ? (savingsRate >= 40 ? 'Optimal' : savingsRate >= 15 ? 'Moderate' : 'Tight') : 'Neutral'}
          badgeType="brand"
          progressPercent={savingsRate}
          progressColor={Colors.brand}
        />

        {/* Cash Flow Distribution Chart */}
        <CashFlowChart
          data={monthlyCashFlow}
          onAddTransaction={() => handleOpenAddModal('income')}
        />

        {/* Dedicated Financial Reports & Exports Banner Card (Option B) */}
        <TouchableOpacity
          style={styles.exportBannerCard}
          onPress={() => setIsExportModalOpen(true)}
          activeOpacity={0.75}
        >
          <View style={styles.exportBannerGlow} />
          <View style={styles.exportBannerTop}>
            <View style={styles.exportBannerLeft}>
              <View style={styles.exportIconBadge}>
                <FileText size={18} color={Colors.brand} />
              </View>
              <View style={styles.exportTextWrap}>
                <View style={styles.exportEyebrowRow}>
                  <Text style={styles.exportEyebrow}>EXECUTIVE AUDIT</Text>
                  <View style={styles.exportPill}>
                    <Text style={styles.exportPillText}>PDF</Text>
                  </View>
                </View>
                <Text style={styles.exportTitle}>Financial Reports & Exports</Text>
                <Text style={styles.exportSubtitle}>
                  Download print-ready analytical statements & audit ledgers
                </Text>
              </View>
            </View>

            <View style={styles.exportActionBtn}>
              <Download size={13} color={Colors.white} />
              <Text style={styles.exportActionText}>Export</Text>
            </View>
          </View>

          {/* Quick Scope Feature Strip */}
          <View style={styles.exportTimelineStrip}>
            {['All Records', 'This Month', '30 Days', 'Specific Month', '12 Months', 'Annual FY'].map((scope) => (
              <View key={scope} style={styles.scopeBadge}>
                <Text style={styles.scopeBadgeText}>{scope}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Recent Deliverables / Ledger List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries & Receipts</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity
                onPress={() => handleOpenAddModal()}
                style={styles.quickAddBtn}
                activeOpacity={0.7}
              >
                <Plus size={12} color={Colors.text} />
                <Text style={styles.quickAddText}>Add</Text>
              </TouchableOpacity>
              {transactions.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {recentTransactions.length > 0 ? (
            <>
              {recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onDelete={deleteTransaction}
                  onViewReceipt={(url) => setReceiptUrlToView(url)}
                />
              ))}

              <TouchableOpacity
                style={styles.fullLedgerFooter}
                onPress={() => navigation.navigate('Ledger')}
                activeOpacity={0.7}
              >
                <Text style={styles.fullLedgerText}>Open Full Ledger Table</Text>
                <ArrowRight size={14} color={Colors.brand} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyRecentCard}>
              <View style={styles.emptyReceiptIcon}>
                <Receipt size={22} color={Colors.brand} />
              </View>
              <Text style={styles.emptyRecentTitle}>Start by Adding Your Income</Text>
              <Text style={styles.emptyRecentSub}>
                Record your opening salary, savings fund, or deposits first so your household balance does not start in negative.
              </Text>
              <TouchableOpacity
                onPress={() => handleOpenAddModal('income')}
                style={styles.emptyAddBtn}
                activeOpacity={0.7}
              >
                <Plus size={13} color={Colors.white} />
                <Text style={styles.emptyAddBtnText}>Add Income First</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={modalInitialType}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ReceiptViewerModal
        visible={!!receiptUrlToView}
        imageUrl={receiptUrlToView}
        onClose={() => setReceiptUrlToView(null)}
      />

      <ExportReportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
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
    paddingBottom: 30,
  },
  titleSection: {
    marginBottom: 16,
    gap: 12,
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  viewSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timeRangePicker: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 2,
    alignSelf: 'flex-start',
  },
  rangeTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rangeTabActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  rangeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  rangeTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBannerCard: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  exportBannerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(94, 106, 210, 0.08)',
  },
  exportBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exportBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextWrap: {
    flex: 1,
  },
  exportEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  exportEyebrow: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  exportPill: {
    backgroundColor: 'rgba(94, 106, 210, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.4)',
  },
  exportPillText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  exportSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.brand,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 6,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  exportActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  exportTimelineStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scopeBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scopeBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAddText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 11,
    color: Colors.brand,
    fontWeight: '600',
  },
  emptyRecentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyReceiptIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.brandSubdued,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyRecentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyRecentSub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 270,
    marginBottom: 14,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  fullLedgerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  fullLedgerText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.brand,
    fontWeight: '600',
  },
});
