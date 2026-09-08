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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus, Receipt, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { TransactionItem } from '../../components/TransactionItem';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ReceiptViewerModal } from '../../components/ReceiptViewerModal';
import { useApp } from '../../context/AppContext';
import { TransactionType } from '../../types';
import { formatCurrency } from '../../lib/currency';

export const LedgerScreen: React.FC = () => {
  const { transactions, members, deleteTransaction, isRefreshing, refreshData } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptUrlToView, setReceiptUrlToView] = useState<string | null>(null);

  const hasIncome = transactions.some((t) => t.type === 'income');
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expenditure'>('income');

  const handleOpenAddModal = (preselectedType?: 'income' | 'expenditure') => {
    setModalInitialType(preselectedType || (hasIncome ? 'expenditure' : 'income'));
    setIsAddModalOpen(true);
  };

  // Dynamic available balance
  const currentBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expenditure') return acc - t.amount;
      return acc;
    }, 0);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = activeFilter === 'all' || tx.type === activeFilter;
      const matchesMember = selectedMember === 'all' || tx.memberId === selectedMember;
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.date.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesMember && matchesSearch;
    });
  }, [transactions, activeFilter, selectedMember, searchQuery]);

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
        {/* Balance Card Banner */}
        <View style={[styles.balanceBanner, currentBalance < 0 && styles.balanceBannerDeficit]}>
          <View style={{ flex: 1 }}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>CURRENT AVAILABLE FUNDS</Text>
              {currentBalance < 0 && (
                <View style={styles.deficitPill}>
                  <AlertTriangle size={10} color={Colors.expense} />
                  <Text style={styles.deficitPillText}>Deficit</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.balanceValue,
                currentBalance < 0 && { color: Colors.expense },
                currentBalance > 0 && { color: Colors.income },
              ]}
            >
              {formatCurrency(currentBalance)}
            </Text>
            <Text style={styles.balanceSubtext}>
              {currentBalance < 0
                ? 'Balance is negative. Log your income to offset expenses.'
                : `${filteredTransactions.length} records matching current filter`}
            </Text>
          </View>
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
              {!hasIncome ? 'Add Income' : 'Add Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchBar}>
          <Search size={14} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search description, category, or date..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
                  : 'No Matching Transactions'}
              </Text>
              <Text style={styles.emptyText}>
                {transactions.length === 0
                  ? 'Record your salary, family deposit, or opening funds first. Adding income before expenses ensures your household balance does not start in negative.'
                  : 'No transactions match your selected search or filter criteria. Try clearing filters.'}
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
                onDelete={deleteTransaction}
                onViewReceipt={(url) => setReceiptUrlToView(url)}
              />
            ))
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
    gap: 16,
  },
  balanceBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceBannerDeficit: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
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
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newEntryBtnText: {
    fontSize: 12,
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
    maxWidth: 280,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
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
});
