// src/screens/main/LedgerScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { TransactionItem } from '../../components/TransactionItem';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ReceiptViewerModal } from '../../components/ReceiptViewerModal';
import { TransactionDetailSheet } from '../../components/TransactionDetailSheet';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { calculateMonthMetrics, calculateBalanceMetrics } from '../../lib/transactionCalculations';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const LedgerScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const { transactions, recurringItems, members, deleteTransaction, isRefreshing, refreshData } = useApp();

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Month navigation state
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [isAllTime, setIsAllTime] = useState<boolean>(false);
  const [isMonthPickerModalOpen, setIsMonthPickerModalOpen] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(currentYear);

  // Filters & Modal state
  const [activeFilter, setActiveFilter] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptUrlToView, setReceiptUrlToView] = useState<string | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);

  // Auto-open transaction detail if navigating from Dashboard
  React.useEffect(() => {
    if (route?.params?.selectedTransactionId) {
      const found = transactions.find((t) => t.id === route.params.selectedTransactionId);
      if (found) {
        setSelectedTransactionForDetail(found);
      }
    }
  }, [route?.params?.selectedTransactionId, transactions]);

  const hasIncome = transactions.some((t) => t.type === 'income');
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expenditure'>('income');

  // Format active month labels
  const selectedYearMonthStr = useMemo(() => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${m}`;
  }, [selectedYear, selectedMonth]);

  const selectedMonthLabel = useMemo(() => {
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Initial date for AddTransactionModal based on selected month
  const modalInitialDate = useMemo(() => {
    if (isAllTime || (selectedYear === currentYear && selectedMonth === currentMonth)) {
      const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return todayStr;
    }
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  }, [isAllTime, selectedYear, selectedMonth, currentYear, currentMonth, now]);

  const handleOpenAddModal = (preselectedType?: 'income' | 'expenditure') => {
    setModalInitialType(preselectedType || (hasIncome ? 'expenditure' : 'income'));
    setIsAddModalOpen(true);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
      setPickerYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
      setPickerYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleJumpToCurrentMonth = () => {
    setIsAllTime(false);
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setPickerYear(currentYear);
  };

  // Filter transactions strictly by selected month (or all time)
  const monthTransactions = useMemo(() => {
    if (isAllTime) return transactions;
    return transactions.filter((tx) => {
      if (tx.fullDate) {
        return tx.fullDate.startsWith(selectedYearMonthStr);
      }
      return true;
    });
  }, [transactions, isAllTime, selectedYearMonthStr]);

  // Financial calculations for the selected month (separated into realized vs upcoming)
  const monthMetrics = useMemo(() => {
    return calculateMonthMetrics(monthTransactions, recurringItems);
  }, [monthTransactions]);

  // Overall household balance metrics across all transactions
  const overallBalance = useMemo(() => {
    return calculateBalanceMetrics(transactions, recurringItems);
  }, [transactions]);

  const monthIncome = monthMetrics.realizedIncome;
  const monthExpense = monthMetrics.realizedExpense;
  const monthNet = monthMetrics.realizedNet;
  const overallReserve = overallBalance.currentHolding;

  // Filtered transactions (month + type + member + search)
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((tx) => {
      const matchesType = activeFilter === 'all' || tx.type === activeFilter;
      const matchesMember = selectedMember === 'all' || tx.memberId === selectedMember;
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.date.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesMember && matchesSearch;
    });
  }, [monthTransactions, activeFilter, selectedMember, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        onOpenAddModal={() => handleOpenAddModal()}
        title="Transaction Ledger"
        subtitle="Digital Records"
      />

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
        {/* Month Selector Bar */}
        <View style={styles.monthSelectorBar}>
          {/* Top Row: Month Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.monthNavArrow}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={16} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPickerYear(selectedYear);
                setIsMonthPickerModalOpen(true);
              }}
              style={styles.monthTitlePill}
              activeOpacity={0.7}
            >
              <Calendar size={13} color={Colors.brand} />
              <Text style={styles.monthTitleText} numberOfLines={1}>
                {isAllTime ? 'All Time (Tap to Pick Month)' : selectedMonthLabel}
              </Text>
              <ChevronDown size={12} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.monthNavArrow}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Quick Scope Switcher */}
          <View style={styles.scopeSwitcher}>
            <TouchableOpacity
              onPress={handleJumpToCurrentMonth}
              style={[
                styles.scopeBtn,
                !isAllTime &&
                  selectedYear === currentYear &&
                  selectedMonth === currentMonth &&
                  styles.scopeBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  !isAllTime &&
                    selectedYear === currentYear &&
                    selectedMonth === currentMonth &&
                    styles.scopeBtnTextActive,
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsAllTime(true)}
              style={[styles.scopeBtn, isAllTime && styles.scopeBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.scopeBtnText, isAllTime && styles.scopeBtnTextActive]}>
                All Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Month Financial Balance Banner */}
        <View
          style={[
            styles.balanceBanner,
            !isAllTime && monthNet < 0 && styles.balanceBannerDeficit,
            isAllTime && overallReserve < 0 && styles.balanceBannerDeficit,
          ]}
        >
          {/* Header Row: Label & Surplus/Deficit Pill */}
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel} numberOfLines={1}>
              {isAllTime
                ? 'CURRENT AVAILABLE HOLDINGS (ALL TIME)'
                : monthMetrics.upcomingCount > 0
                ? `REALIZED CASH FLOW (${selectedMonthLabel.toUpperCase()})`
                : `NET CASH FLOW (${selectedMonthLabel.toUpperCase()})`}
            </Text>
            {!isAllTime ? (
              monthNet < 0 ? (
                <View style={styles.deficitPill}>
                  <AlertTriangle size={10} color={Colors.expense} />
                  <Text style={styles.deficitPillText}>Realized Deficit</Text>
                </View>
              ) : monthNet > 0 ? (
                <View style={styles.surplusPill}>
                  <TrendingUp size={10} color={Colors.income} />
                  <Text style={styles.surplusPillText}>Realized Surplus</Text>
                </View>
              ) : null
            ) : overallReserve < 0 ? (
              <View style={styles.deficitPill}>
                <AlertTriangle size={10} color={Colors.expense} />
                <Text style={styles.deficitPillText}>Reserve Deficit</Text>
              </View>
            ) : null}
          </View>

          {/* Main Net Amount */}
          <Text
            style={[
              styles.balanceValue,
              !isAllTime
                ? monthNet < 0
                  ? { color: Colors.expense }
                  : monthNet > 0
                  ? { color: Colors.income }
                  : { color: Colors.text }
                : overallReserve < 0
                ? { color: Colors.expense }
                : { color: Colors.text },
            ]}
          >
            {!isAllTime
              ? `${monthNet > 0 ? '+' : ''}${formatCurrency(monthNet)}`
              : formatCurrency(overallReserve)}
          </Text>

          {/* Inflow / Outflow summary */}
          {!isAllTime ? (
            <View style={styles.inflowOutflowRow}>
              <Text style={styles.inflowText}>
                +{formatCurrency(monthIncome, { showDecimals: false })} Inflow
              </Text>
              <View style={styles.summaryDot} />
              <Text style={styles.outflowText}>
                -{formatCurrency(monthExpense, { showDecimals: false })} Outflow
              </Text>
              <View style={styles.summaryDot} />
              <Text style={styles.balanceSubtext}>
                {monthMetrics.realizedCount} cleared
              </Text>
            </View>
          ) : (
            <Text style={styles.balanceSubtext}>
              {overallBalance.upcomingCount > 0
                ? `Current Holding: ${formatCurrency(overallBalance.currentHolding)} · Projected: ${formatCurrency(overallBalance.projectedBalance)}`
                : `${filteredTransactions.length} total records across all months`}
            </Text>
          )}

          {/* Scheduled Upcoming Transactions Strip for this month */}
          {!isAllTime && monthMetrics.upcomingCount > 0 && (
            <View style={styles.ledgerUpcomingStrip}>
              <View style={styles.ledgerUpcomingHeader}>
                <View style={styles.ledgerUpcomingBadge}>
                  <Clock size={10} color="#A5B4FC" />
                  <Text style={styles.ledgerUpcomingBadgeText}>
                    UPCOMING {monthMetrics.earliestUpcomingDate ? `· DUE ${monthMetrics.earliestUpcomingDate.toUpperCase()}` : ''}
                  </Text>
                </View>
                <Text style={styles.ledgerUpcomingCountText}>
                  {monthMetrics.upcomingCount} scheduled
                </Text>
              </View>

              <View style={styles.ledgerUpcomingBodyRow}>
                <View style={styles.ledgerUpcomingPillsWrap}>
                  {monthMetrics.upcomingIncome > 0 && (
                    <View style={styles.ledgerIncomePill}>
                      <Text style={styles.ledgerIncomeText}>
                        +{formatCurrency(monthMetrics.upcomingIncome, { showDecimals: false })}
                      </Text>
                    </View>
                  )}
                  {monthMetrics.upcomingExpense > 0 && (
                    <View style={styles.ledgerExpensePill}>
                      <Text style={styles.ledgerExpenseText}>
                        -{formatCurrency(monthMetrics.upcomingExpense, { showDecimals: false })}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.ledgerUpcomingTargetBlock}>
                  <Text style={styles.ledgerUpcomingTargetLabel}>Projected Net</Text>
                  <Text style={styles.ledgerUpcomingTargetValue}>
                    {monthMetrics.projectedNet > 0 ? '+' : ''}{formatCurrency(monthMetrics.projectedNet)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!isAllTime && (
            <Text style={styles.reserveSubtext}>
              Current Holding: {formatCurrency(overallBalance.currentHolding)}
              {overallBalance.upcomingCount > 0 ? ` (Projected: ${formatCurrency(overallBalance.projectedBalance)})` : ''}
            </Text>
          )}

          {/* Action Button - Placed at bottom so it never overlaps metrics on any phone */}
          <TouchableOpacity
            style={[
              styles.newEntryBtn,
              !hasIncome && { backgroundColor: Colors.income },
            ]}
            onPress={() => handleOpenAddModal(!hasIncome ? 'income' : undefined)}
            activeOpacity={0.8}
          >
            <Plus size={14} color={Colors.white} />
            <Text style={styles.newEntryBtnText}>
              {!hasIncome ? 'Add First Income Entry' : 'Add Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchBar}>
          <Search size={14} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${isAllTime ? 'all' : selectedMonthLabel} records...`}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.typeFilterTabs}>
          {(['all', 'income', 'expenditure', 'savings'] as const).map((type) => {
            const isSelected = activeFilter === type;
            const label =
              type === 'all'
                ? 'All Types'
                : type === 'income'
                ? 'Income'
                : type === 'expenditure'
                ? 'Expenses'
                : 'Savings';

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setActiveFilter(type)}
                style={[styles.typeTab, isSelected && styles.typeTabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeTabText, isSelected && styles.typeTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Member Chips Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.memberFilterScroll}
          contentContainerStyle={{ gap: 6 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedMember('all')}
            style={[styles.memberChip, selectedMember === 'all' && styles.memberChipActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.memberChipText,
                selectedMember === 'all' && styles.memberChipTextActive,
              ]}
            >
              All Members
            </Text>
          </TouchableOpacity>

          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setSelectedMember(m.id)}
              style={[styles.memberChip, selectedMember === m.id && styles.memberChipActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.memberChipText,
                  selectedMember === m.id && styles.memberChipTextActive,
                ]}
              >
                {m.name} ({m.avatarLetter})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ledger List */}
        <View style={styles.ledgerListCard}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconBadge,
                  !hasIncome && { backgroundColor: Colors.incomeSubdued },
                ]}
              >
                {!hasIncome ? (
                  <TrendingUp size={24} color={Colors.income} />
                ) : (
                  <Receipt size={24} color={Colors.brand} />
                )}
              </View>

              <Text style={styles.emptyTitle}>
                {transactions.length === 0
                  ? 'Add Your Opening Income First'
                  : monthTransactions.length === 0
                  ? `No Entries in ${selectedMonthLabel}`
                  : 'No Matching Transactions'}
              </Text>

              <Text style={styles.emptyText}>
                {transactions.length === 0
                  ? 'Record your salary, family deposit, or opening funds first. Adding income before expenses ensures your household balance does not start in negative.'
                  : monthTransactions.length === 0
                  ? `There are no income or expense entries recorded for ${selectedMonthLabel}. Add an entry for this month or switch to a different period.`
                  : `No transactions match your search or filters in ${selectedMonthLabel}. Try clearing your filters.`}
              </Text>

              {transactions.length === 0 ? (
                <TouchableOpacity
                  onPress={() => handleOpenAddModal('income')}
                  style={[styles.emptyAddBtn, { backgroundColor: Colors.income }]}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color={Colors.white} />
                  <Text style={styles.emptyAddBtnText}>Add Income First</Text>
                </TouchableOpacity>
              ) : monthTransactions.length === 0 ? (
                <View style={styles.emptyActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleOpenAddModal()}
                    style={styles.emptyAddBtn}
                    activeOpacity={0.7}
                  >
                    <Plus size={13} color={Colors.white} />
                    <Text style={styles.emptyAddBtnText}>
                      Add Entry for {MONTH_SHORT_NAMES[selectedMonth]}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleJumpToCurrentMonth}
                    style={styles.emptySecondaryBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptySecondaryBtnText}>View This Month</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilter('all');
                    setSelectedMember('all');
                    setSearchQuery('');
                  }}
                  style={styles.emptyResetBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyResetBtnText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => setSelectedTransactionForDetail(tx)}
                onDelete={deleteTransaction}
                onViewReceipt={(url) => setReceiptUrlToView(url)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Quick Month & Year Picker Modal */}
      <Modal
        visible={isMonthPickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsMonthPickerModalOpen(false)}
          />

          <View style={styles.monthPickerCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reconciliation Month</Text>
                <Text style={styles.modalSubtitle}>Filter ledger by accounting period</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsMonthPickerModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick shortcuts */}
            <View style={styles.quickModalShortcuts}>
              <TouchableOpacity
                onPress={() => {
                  handleJumpToCurrentMonth();
                  setIsMonthPickerModalOpen(false);
                }}
                style={[
                  styles.quickModalPill,
                  !isAllTime &&
                    selectedYear === currentYear &&
                    selectedMonth === currentMonth &&
                    styles.quickModalPillActive,
                ]}
                activeOpacity={0.7}
              >
                <Clock size={12} color={Colors.textSecondary} />
                <Text style={styles.quickModalPillText}>
                  Current Month ({MONTH_SHORT_NAMES[currentMonth]} {currentYear})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsAllTime(true);
                  setIsMonthPickerModalOpen(false);
                }}
                style={[
                  styles.quickModalPill,
                  isAllTime && styles.quickModalPillActive,
                ]}
                activeOpacity={0.7}
              >
                <Calendar size={12} color={Colors.textSecondary} />
                <Text style={styles.quickModalPillText}>All Time (All Records)</Text>
              </TouchableOpacity>
            </View>

            {/* Year Stepper */}
            <View style={styles.yearStepperRow}>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y - 1)}
                style={styles.yearStepperBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.yearStepperText}>{pickerYear}</Text>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y + 1)}
                style={styles.yearStepperBtn}
                activeOpacity={0.7}
              >
                <ChevronRight size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* 12-Month Grid */}
            <View style={styles.monthsGrid}>
              {MONTH_NAMES.map((mName, idx) => {
                const isSelected =
                  !isAllTime && selectedYear === pickerYear && selectedMonth === idx;
                const isCurrentMonthNow = currentYear === pickerYear && currentMonth === idx;
                const monthCode = `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
                const hasDataInMonth = transactions.some(
                  (t) => t.fullDate && t.fullDate.startsWith(monthCode)
                );

                return (
                  <TouchableOpacity
                    key={mName}
                    onPress={() => {
                      setSelectedYear(pickerYear);
                      setSelectedMonth(idx);
                      setIsAllTime(false);
                      setIsMonthPickerModalOpen(false);
                    }}
                    style={[
                      styles.monthGridCell,
                      isSelected && styles.monthGridCellSelected,
                      isCurrentMonthNow && !isSelected && styles.monthGridCellCurrent,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.monthGridText,
                        isSelected && styles.monthGridTextSelected,
                        isCurrentMonthNow && !isSelected && { color: Colors.brand, fontWeight: '700' },
                      ]}
                    >
                      {MONTH_SHORT_NAMES[idx]}
                    </Text>
                    {hasDataInMonth && (
                      <View
                        style={[
                          styles.dataDot,
                          isSelected && { backgroundColor: Colors.white },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={modalInitialType}
        initialDate={modalInitialDate}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ReceiptViewerModal
        visible={!!receiptUrlToView}
        imageUrl={receiptUrlToView}
        onClose={() => setReceiptUrlToView(null)}
      />

      <TransactionDetailSheet
        visible={!!selectedTransactionForDetail}
        transaction={selectedTransactionForDetail}
        onClose={() => setSelectedTransactionForDetail(null)}
        onDelete={(id) => {
          deleteTransaction(id);
          setSelectedTransactionForDetail(null);
        }}
        onViewReceipt={(url) => {
          setReceiptUrlToView(url);
        }}
        onTransactionUpdated={(updated) => {
          setSelectedTransactionForDetail(updated);
        }}
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
    paddingBottom: 40,
    gap: 14,
  },
  monthSelectorBar: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavArrow: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitlePill: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  scopeSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnActive: {
    backgroundColor: Colors.surfaceHighlight,
  },
  scopeBtnText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  scopeBtnTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  balanceBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'column',
  },
  balanceBannerDeficit: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    flexShrink: 1,
    marginRight: 8,
  },
  deficitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.expenseSubdued,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deficitPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.expense,
  },
  surplusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.incomeSubdued,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  surplusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.income,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  inflowOutflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  inflowText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.income,
  },
  outflowText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.expense,
  },
  summaryDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 3,
  },
  balanceSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  reserveSubtext: {
    fontSize: 10.5,
    color: Colors.textSubdued,
    marginTop: 4,
  },
  ledgerUpcomingStrip: {
    marginTop: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
  },
  ledgerUpcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ledgerUpcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ledgerUpcomingBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 0.5,
  },
  ledgerUpcomingCountText: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  ledgerUpcomingBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ledgerUpcomingPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  ledgerIncomePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ledgerIncomeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#10B981',
  },
  ledgerExpensePill: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ledgerExpenseText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#F43F5E',
  },
  ledgerUpcomingTargetBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ledgerUpcomingTargetLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 1,
  },
  ledgerUpcomingTargetValue: {
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9,
    marginTop: 14,
    width: '100%',
  },
  newEntryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
  },
  typeFilterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeTabActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  typeTabTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  memberFilterScroll: {
    marginHorizontal: -4,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberChipActive: {
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brand,
  },
  memberChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  memberChipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  ledgerListCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    marginBottom: 16,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  emptySecondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptySecondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
  },
  emptyResetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  monthPickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickModalShortcuts: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14,
  },
  quickModalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickModalPillActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSubdued,
  },
  quickModalPillText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  yearStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    marginBottom: 12,
  },
  yearStepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearStepperText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthGridCell: {
    width: '30%',
    height: 40,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthGridCellSelected: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  monthGridCellCurrent: {
    borderColor: Colors.brand,
  },
  monthGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  monthGridTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dataDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand,
  },
});


