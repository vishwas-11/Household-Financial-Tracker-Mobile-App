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

export const RecurringScreen: React.FC = () => {
  const { recurringItems, transactions, deductRecurringNow, deleteRecurring, isRefreshing, refreshData } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const totalMonthlyExpense = recurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

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
        {/* Outflow Banner without redundant add button */}
        <View style={styles.bannerCard}>
          <View>
            <Text style={styles.bannerLabel}>MONTHLY FIXED OUTFLOW</Text>
            <Text style={styles.bannerValue}>{formatCurrency(totalMonthlyExpense)}</Text>
            <Text style={styles.bannerSubtext}>
              {recurringItems.length} active recurring commitments
            </Text>
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
            <View style={[styles.stripIcon, { backgroundColor: Colors.brandSubdued }]}>
              <Repeat size={14} color={Colors.brand} />
            </View>
            <View>
              <Text style={styles.stripLabel}>FIXED OBLIGATIONS</Text>
              <Text style={styles.stripValue}>
                {formatCurrency(totalMonthlyExpense, { showDecimals: false })}/mo
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
                  onDelete={deleteRecurring}
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
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
