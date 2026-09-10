// src/screens/main/DashboardScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText, Download, ChevronRight, ArrowRight,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { HeroBalanceCard } from '../../components/HeroBalanceCard';
import { calculateBalanceMetrics } from '../../lib/transactionCalculations';
import { getRecurringScheduleInfo } from '../../lib/recurringManager';
import { RecurringCommitmentsCard } from '../../components/RecurringCommitmentsCard';
import { CashFlowAreaChart } from '../../components/CashFlowAreaChart';
import { CategoryDonutChart } from '../../components/CategoryDonutChart';
import { TransactionItem } from '../../components/TransactionItem';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ReceiptViewerModal } from '../../components/ReceiptViewerModal';
import { ExportReportModal } from '../../components/ExportReportModal';
import { GettingStartedCard } from '../../components/GettingStartedCard';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { useApp } from '../../context/AppContext';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    transactions,
    recurringItems,
    deductRecurringNow,
    monthlyCashFlow,
    householdName,
    isLoading,
    isRefreshing,
    refreshData,
    hasCompletedTutorial,
    openTutorial,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expenditure'>('income');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [donutY, setDonutY] = useState(0);
  const [isDonutVisible, setIsDonutVisible] = useState(false);

  // Auto-launch interactive onboarding tutorial for first-time users
  useEffect(() => {
    if (!isLoading && !hasCompletedTutorial) {
      const timer = setTimeout(() => {
        openTutorial();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasCompletedTutorial, openTutorial]);

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

  // Closest 2-3 recurring payments for hero card preview
  const topRecurringPreviews = useMemo(() => {
    if (!recurringItems || recurringItems.length === 0) return [];

    const sorted = [...recurringItems].sort((a, b) => {
      const infoA = getRecurringScheduleInfo(a, transactions);
      const infoB = getRecurringScheduleInfo(b, transactions);

      if (infoA.isSettledThisMonth !== infoB.isSettledThisMonth) {
        return infoA.isSettledThisMonth ? 1 : -1;
      }
      if (infoA.isDueToday !== infoB.isDueToday) {
        return infoA.isDueToday ? -1 : 1;
      }
      return infoA.daysRemaining - infoB.daysRemaining;
    });

    return sorted.slice(0, 3).map((item) => {
      const info = getRecurringScheduleInfo(item, transactions);
      return {
        id: item.id,
        title: item.title,
        amount: item.amount,
        type: item.type,
        dueText: info.isDueToday ? 'Due Today' : info.statusLabel,
        isDueToday: info.isDueToday,
        category: item.category,
        frequency: item.frequency,
      };
    });
  }, [recurringItems, transactions]);

  const balanceMetrics = calculateBalanceMetrics(transactions, recurringItems);
  const {
    currentHolding,
    realizedIncome,
    realizedExpense,
    projectedBalance,
    upcomingIncome,
    upcomingExpense,
    upcomingCount,
    earliestUpcomingDate,
    savingsRate,
  } = balanceMetrics;

  const totalRecurringExpense = (recurringItems || [])
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalRecurringIncome = (recurringItems || [])
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime())
    .slice(0, 5);
  const hasNoData = transactions.length === 0;

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
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsDonutVisible(false);
              await refreshData();
            }}
            tintColor={Colors.brand}
          />
        }
      >
        {/* ── Hero Balance Card ─────────────────────────── */}
        <View style={styles.section}>
          <HeroBalanceCard
            balance={currentHolding}
            totalIncome={realizedIncome}
            totalExpense={realizedExpense}
            savingsRate={savingsRate}
            householdName={householdName}
            recurringMonthlyOutflow={totalRecurringExpense}
            recurringMonthlyInflow={totalRecurringIncome}
            projectedBalance={projectedBalance}
            upcomingIncome={upcomingIncome}
            upcomingExpense={upcomingExpense}
            upcomingCount={upcomingCount}
            earliestUpcomingDate={earliestUpcomingDate}
            upcomingRecurringItems={topRecurringPreviews}
            onNavigateToRecurring={() => navigation?.navigate?.('Recurring')}
          />
        </View>

                {/* ── Cash Flow Chart (Rendered before Export) ───── */}
        {!hasNoData && (
          <View style={styles.section}>
            <CashFlowAreaChart data={monthlyCashFlow} />
          </View>
        )}

        {/* ── Scheduled Recurring Obligations ───────────── */}
        {recurringItems && recurringItems.length > 0 && (
          <View style={styles.section}>
            <RecurringCommitmentsCard
              recurringItems={recurringItems}
              transactions={transactions}
              currentBalance={currentHolding}
              onNavigateToRecurring={() => navigation?.navigate?.('Recurring')}
            />
          </View>
        )}

        {/* ── Descriptive Financial Statement Card ───────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.exportBannerCard}
            onPress={() => setIsExportModalOpen(true)}
            activeOpacity={0.82}
          >
            <View style={styles.exportBannerTop}>
              <View style={styles.exportBannerLeft}>
                <View style={styles.exportIconBadge}>
                  <FileText size={18} color={Colors.brand} />
                </View>
                <View style={styles.exportTextWrap}>
                  <View style={styles.exportEyebrowRow}>
                    <Text style={styles.exportEyebrow}>FINANCIAL REPORT</Text>
                    <View style={styles.exportPill}>
                      <Text style={styles.exportPillText}>AUDIT READY</Text>
                    </View>
                  </View>
                  <Text style={styles.exportTitle}>Monthly Household Statement</Text>
                  <Text style={styles.exportSubtitle}>
                    Download complete itemized PDF breakdown with receipts attached
                  </Text>
                </View>
              </View>

              <View style={styles.exportActionBtn}>
                <Download size={12} color={Colors.white} />
                <Text style={styles.exportActionText}>Export</Text>
              </View>
            </View>

            {/* Scope Badges */}
            <View style={styles.exportTimelineStrip}>
              <View style={styles.scopeBadge}>
                <Text style={styles.scopeBadgeText}>Schedule A: Cash Flow</Text>
              </View>
              <View style={styles.scopeBadge}>
                <Text style={styles.scopeBadgeText}>Schedule B: Categorical</Text>
              </View>
              <View style={styles.scopeBadge}>
                <Text style={styles.scopeBadgeText}>Schedule D: Itemized Ledger</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Getting Started (if no data) ──────────────── */}
        {hasNoData && (
          <View style={styles.section}>
            <GettingStartedCard onOpenAddTransaction={() => handleOpenAddModal()} />
          </View>
        )}

        {/* ── Category Breakdown ────────────────────────── */}
        {!hasNoData && realizedExpense > 0 && (
          <View
            style={styles.section}
            onLayout={(e) => setDonutY(e.nativeEvent.layout.y)}
          >
            <CategoryDonutChart transactions={transactions} isVisible={isDonutVisible} />
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

  // Descriptive Export Banner Card
  exportBannerCard: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
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
    borderRadius: 10,
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
    marginBottom: 3,
  },
  exportEyebrow: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  exportPill: {
    backgroundColor: 'rgba(94, 106, 210, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.35)',
  },
  exportPillText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
  },
  exportTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  exportSubtitle: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  exportTimelineStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  scopeBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scopeBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
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
