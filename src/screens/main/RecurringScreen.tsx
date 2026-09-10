// src/screens/main/RecurringScreen.tsx
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
import { Plus, ShieldCheck, Repeat } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/Header';
import { RecurringItemRow } from '../../components/RecurringItemRow';
import { AddRecurringModal } from '../../components/AddRecurringModal';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/currency';
import { RecurringItem } from '../../types';

export const RecurringScreen: React.FC = () => {
  const { recurringItems, transactions, deductRecurringNow, deleteRecurring, isRefreshing, refreshData } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);

  const totalMonthlyExpense = recurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyIncome = recurringItems
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const netMonthlyRecurring = totalMonthlyIncome - totalMonthlyExpense;

  const autoPayCount = recurringItems.filter((r) => r.autoPay).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Recurring Schedules"
        subtitle="Automated Obligations"
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
        {/* Recurring Net Flow Banner with Inflow & Outflow Chips */}
        <View style={styles.bannerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerLabel}>NET MONTHLY RECURRING FLOW</Text>
            <Text
              style={[
                styles.bannerValue,
                netMonthlyRecurring > 0 && { color: Colors.income },
                netMonthlyRecurring < 0 && { color: Colors.expense },
              ]}
            >
              {netMonthlyRecurring > 0 ? '+' : ''}{formatCurrency(netMonthlyRecurring)}
            </Text>
            <View style={styles.bannerFlowPillsRow}>
              <View style={styles.bannerFlowPillIncome}>
                <Text style={styles.bannerFlowPillIncomeText}>
                  +{formatCurrency(totalMonthlyIncome, { showDecimals: false })} Inflow
                </Text>
              </View>
              <View style={styles.bannerFlowPillExpense}>
                <Text style={styles.bannerFlowPillExpenseText}>
                  -{formatCurrency(totalMonthlyExpense, { showDecimals: false })} Outflow
                </Text>
              </View>
              <Text style={styles.bannerSubtext}>
                {recurringItems.length} active {recurringItems.length === 1 ? 'schedule' : 'schedules'}
              </Text>
            </View>
          </View>
        </View>

        {/* Protection / Stat Strip */}
        <View style={styles.statStrip}>
          <View style={styles.stripCard}>
            <View style={[styles.stripIcon, { backgroundColor: Colors.incomeSubdued }]}>
              <ShieldCheck size={14} color={Colors.income} />
            </View>
            <View>
              <Text style={styles.stripLabel}>AUTO-PAY PROTECTED</Text>
              <Text style={styles.stripValue}>
                {autoPayCount} of {recurringItems.length} items
              </Text>
            </View>
          </View>

          <View style={styles.stripCard}>
            <View style={[styles.stripIcon, { backgroundColor: netMonthlyRecurring >= 0 ? Colors.incomeSubdued : Colors.brandSubdued }]}>
              <Repeat size={14} color={netMonthlyRecurring >= 0 ? Colors.income : Colors.brand} />
            </View>
            <View>
              <Text style={styles.stripLabel}>NET RECURRING / MO</Text>
              <Text style={[styles.stripValue, netMonthlyRecurring > 0 && { color: Colors.income }, netMonthlyRecurring < 0 && { color: Colors.expense }]}>
                {netMonthlyRecurring > 0 ? '+' : ''}{formatCurrency(netMonthlyRecurring, { showDecimals: false })}/mo
              </Text>
            </View>
          </View>
        </View>

        {/* List of Schedules or Dedicated Action Card */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Active Scheduled Items ({recurringItems.length})
          </Text>
          {recurringItems.length > 0 ? (
            <>
              {recurringItems.map((item) => (
                <RecurringItemRow
                  key={item.id}
                  item={item}
                  transactions={transactions}
                  onDeductNow={deductRecurringNow}
                  onDelete={deleteRecurring}
                  onEdit={(item) => setEditingItem(item)}
                />
              ))}

              <TouchableOpacity
                onPress={() => setIsAddModalOpen(true)}
                style={styles.addMoreBtn}
                activeOpacity={0.7}
              >
                <Plus size={13} color={Colors.white} />
                <Text style={styles.addMoreBtnText}>Schedule your Recurring payment</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyRecurringCard}>
              <View style={styles.emptyIconBadge}>
                <Repeat size={24} color={Colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>No Recurring Obligations Scheduled</Text>
              <Text style={styles.emptyText}>
                Schedule your household rent, electricity, Wi-Fi, school fees, or subscription bills to keep fixed commitments organized and prevent missed payments.
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(true)}
                style={styles.emptyAddBtn}
                activeOpacity={0.8}
              >
                <Plus size={14} color={Colors.white} />
                <Text style={styles.emptyAddBtnText}>Schedule your Recurring payment</Text>
              </TouchableOpacity>

              {/* Informative description below the button inside the card */}
              <View style={styles.infoNoteBox}>
                <ShieldCheck size={14} color="#A5B4FC" style={styles.infoNoteIcon} />
                <Text style={styles.infoNoteText}>
                  How it works: Once scheduled, your commitment is automatically tracked each month. It forecasts in your Dashboard's upcoming balance and deducts on its due date so you always know your true cash-on-hand.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Recurring Modal */}
      <AddRecurringModal
        visible={isAddModalOpen || editingItem !== null}
        initialItem={editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
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
  },
  bannerCard: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannerLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  bannerFlowPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  bannerFlowPillIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  bannerFlowPillIncomeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.income,
  },
  bannerFlowPillExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.28)',
  },
  bannerFlowPillExpenseText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.expense,
  },
  bannerSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statStrip: {
    gap: 8,
    marginBottom: 16,
  },
  stripCard: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stripIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  stripValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  listSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  emptyRecurringCard: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.brandSubdued,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 290,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.brand,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 18,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 10,
    padding: 12,
    maxWidth: 320,
  },
  infoNoteIcon: {
    marginTop: 1,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 10.5,
    color: '#94A3B8',
    lineHeight: 15.5,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
  },
  addMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
