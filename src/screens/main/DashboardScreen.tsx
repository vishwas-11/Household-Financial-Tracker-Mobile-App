// src/screens/main/DashboardScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus, FileDown, TrendingUp, TrendingDown, PiggyBank,
  ChevronRight, ArrowRight, Receipt, Repeat,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { HeroBalanceCard } from '../../components/HeroBalanceCard';
import { CashFlowAreaChart } from '../../components/CashFlowAreaChart';
import { CategoryDonutChart } from '../../components/CategoryDonutChart';
import { TransactionItem } from '../../components/TransactionItem';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ReceiptViewerModal } from '../../components/ReceiptViewerModal';
import { ExportReportModal } from '../../components/ExportReportModal';
import { GettingStartedCard } from '../../components/GettingStartedCard';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { transactions, monthlyCashFlow, householdName, isLoading, isRefreshing, refreshData, deleteTransaction } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expenditure'>('income');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [donutY, setDonutY] = useState(0);
  const [isDonutVisible, setIsDonutVisible] = useState(false);
  const windowHeight = Dimensions.get('window').height;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isDonutVisible) return;
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const scrollBottom = contentOffset.y + layoutMeasurement.height;
    if (donutY > 0 && scrollBottom >= donutY + 50) {
      setIsDonutVisible(true);
    }
  };
  const [receiptUrlToView, setReceiptUrlToView] = useState<string | null>(null);

  const hasIncome = transactions.some((t) => t.type === 'income');

  const handleOpenAddModal = (preselectedType?: 'income' | 'expenditure') => {
    setModalInitialType(preselectedType || (hasIncome ? 'expenditure' : 'income'));
    setIsAddModalOpen(true);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expenditure').reduce((s, t) => s + t.amount, 0);
  const totalSavings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime()).slice(0, 5);
  const hasNoData = transactions.length === 0;

  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFadeAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }).start();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header onOpenAddModal={() => handleOpenAddModal()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={async () => { setIsDonutVisible(false); await refreshData(); }} tintColor={Colors.brand} />}
      >
        {/* ── Hero Balance Card ─────────────────────────── */}
        <View style={styles.section}>
          <HeroBalanceCard
            balance={balance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            savingsRate={savingsRate}
            householdName={householdName}
          />
        </View>

        {/* ── Stat Pills Row ───────────────────────────── */}
        <Animated.View style={[styles.statRow, { opacity: headerFadeAnim }]}>
          <View style={[styles.statPill, { borderColor: Colors.incomeBorder }]}>
            <View style={[styles.statPillIcon, { backgroundColor: Colors.incomeSubdued }]}>
              <TrendingUp size={13} color={Colors.income} />
            </View>
            <View>
              <Text style={styles.statPillLabel}>Income</Text>
              <Text style={[styles.statPillValue, { color: Colors.income }]}>{formatCurrency(totalIncome)}</Text>
            </View>
          </View>

          <View style={[styles.statPill, { borderColor: Colors.expenseBorder }]}>
            <View style={[styles.statPillIcon, { backgroundColor: Colors.expenseSubdued }]}>
              <TrendingDown size={13} color={Colors.expense} />
            </View>
            <View>
              <Text style={styles.statPillLabel}>Expenses</Text>
              <Text style={[styles.statPillValue, { color: Colors.expense }]}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>

          {totalSavings > 0 && (
            <View style={[styles.statPill, { borderColor: Colors.savingsBorder }]}>
              <View style={[styles.statPillIcon, { backgroundColor: Colors.savingsSubdued }]}>
                <PiggyBank size={13} color={Colors.savings} />
              </View>
              <View>
                <Text style={styles.statPillLabel}>Savings</Text>
                <Text style={[styles.statPillValue, { color: Colors.savings }]}>{formatCurrency(totalSavings)}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ── Quick Actions ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.qaBtn, styles.qaBtnIncome]} onPress={() => handleOpenAddModal('income')} activeOpacity={0.75}>
              <Plus size={15} color={Colors.income} />
              <Text style={[styles.qaBtnText, { color: Colors.income }]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qaBtn, styles.qaBtnExpense]} onPress={() => handleOpenAddModal('expenditure')} activeOpacity={0.75}>
              <Plus size={15} color={Colors.expense} />
              <Text style={[styles.qaBtnText, { color: Colors.expense }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qaBtn, styles.qaBtnExport]} onPress={() => setIsExportModalOpen(true)} activeOpacity={0.75}>
              <FileDown size={15} color={Colors.brand} />
              <Text style={[styles.qaBtnText, { color: Colors.brand }]}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Getting Started (if no data) ──────────────── */}
        {hasNoData && (
          <View style={styles.section}>
            <GettingStartedCard onOpenAddTransaction={() => handleOpenAddModal()} />
          </View>
        )}

        {/* ── Cash Flow Chart ───────────────────────────── */}
        {!hasNoData && (
          <View style={styles.section}>
            <CashFlowAreaChart data={monthlyCashFlow} />
          </View>
        )}

        {/* ── Category Breakdown ────────────────────────── */}
        {!hasNoData && totalExpense > 0 && (
          <View style={styles.section}>
            <CategoryDonutChart transactions={transactions} />
          </View>
        )}

        {/* ── Recent Transactions ───────────────────────── */}
        {!hasNoData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation?.navigate?.('Ledger')} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View all</Text>
                <ArrowRight size={13} color={Colors.brand} />
              </TouchableOpacity>
            </View>

            <View style={styles.txCard}>
              {recentTransactions.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  index={idx}
                  onPress={() => navigation?.navigate?.('Ledger', { selectedTransactionId: tx.id })}
                  onViewReceipt={(url) => setReceiptUrlToView(url)}
                />
              ))}
              {transactions.length > 5 && (
                <TouchableOpacity style={styles.txViewMoreBtn} onPress={() => navigation?.navigate?.('Ledger')} activeOpacity={0.7}>
                  <Text style={styles.txViewMoreText}>+{transactions.length - 5} more transactions in ledger</Text>
                  <ChevronRight size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <AddTransactionModal visible={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} initialType={modalInitialType} />
      <ExportReportModal visible={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ReceiptViewerModal visible={!!receiptUrlToView} imageUrl={receiptUrlToView} onClose={() => setReceiptUrlToView(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { paddingHorizontal: 16, marginTop: 16 },

  // Stat pills
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flex: 1,
    minWidth: 100,
  },
  statPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 1,
  },
  statPillValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: -0.3,
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  qaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qaBtnIncome: {
    backgroundColor: Colors.incomeSubdued,
    borderColor: Colors.incomeBorder,
  },
  qaBtnExpense: {
    backgroundColor: Colors.expenseSubdued,
    borderColor: Colors.expenseBorder,
  },
  qaBtnExport: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brandBorder,
  },
  qaBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '600',
  },

  // Transaction card
  txCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  txViewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  txViewMoreText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});

