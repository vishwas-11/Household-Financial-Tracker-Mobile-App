// src/components/RecurringCommitmentsCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Repeat, ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { RecurringItem, Transaction } from '../types';
import { formatCurrency } from '../lib/currency';
import { getRecurringScheduleInfo } from '../lib/recurringManager';

interface RecurringCommitmentsCardProps {
  recurringItems: RecurringItem[];
  transactions: Transaction[];
  currentBalance: number;
  onNavigateToRecurring?: () => void;
  onDeductNow?: (item: RecurringItem) => Promise<void>;
}

export const RecurringCommitmentsCard: React.FC<RecurringCommitmentsCardProps> = ({
  recurringItems,
  transactions,
  currentBalance,
  onNavigateToRecurring,
  onDeductNow,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!recurringItems || recurringItems.length === 0) {
    return null;
  }

  // Calculate monthly total and pending amounts
  const totalMonthlyCommitment = recurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingRecurringItems = recurringItems.filter((r) => {
    const info = getRecurringScheduleInfo(r, transactions);
    return !info.isSettledThisMonth;
  });

  const pendingAmount = pendingRecurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

  const forecastedFreeCash = currentBalance - pendingAmount;

  const handleDeduct = async (item: RecurringItem) => {
    if (!onDeductNow || processingId) return;
    setProcessingId(item.id);
    try {
      await onDeductNow(item);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Repeat size={16} color={Colors.brand} />
          </View>
          <View style={styles.headerTextWrap}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>AUTOMATED SCHEDULES</Text>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>DUE-DATE DEDUCTION</Text>
              </View>
            </View>
            <Text style={styles.title}>Scheduled Recurring Bills</Text>
            <Text style={styles.subtitle}>
              Committed auto-pay obligations deducted when their due cycle arrives
            </Text>
          </View>
        </View>

        {onNavigateToRecurring && (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={onNavigateToRecurring}
            activeOpacity={0.7}
          >
            <Text style={styles.manageText}>Manage</Text>
            <ChevronRight size={13} color={Colors.brand} />
          </TouchableOpacity>
        )}
      </View>

      {/* Financial Impact Breakdown Banner */}
      <View style={styles.metricsBanner}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>COMMITTED OUTFLOW</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(totalMonthlyCommitment, { showDecimals: false })}/mo
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>FORECASTED FREE CASH</Text>
          <Text style={[styles.metricValue, forecastedFreeCash < 0 && styles.metricValueDeficit]}>
            {formatCurrency(forecastedFreeCash, { showDecimals: false })}
          </Text>
        </View>
      </View>

      {/* Scheduled Items List */}
      <View style={styles.itemsList}>
        {recurringItems.map((item) => {
          const info = getRecurringScheduleInfo(item, transactions);
          const isProcessing = processingId === item.id;

          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <View style={styles.dot} />
                  {info.isSettledThisMonth ? (
                    <View style={styles.settledBadge}>
                      <CheckCircle2 size={10} color={Colors.income} />
                      <Text style={styles.settledText}>Settled this cycle</Text>
                    </View>
                  ) : (
                    <View style={styles.dueBadge}>
                      <Clock size={10} color={info.isDueToday ? Colors.expense : Colors.textMuted} />
                      <Text style={[styles.dueText, info.isDueToday && styles.dueTextUrgent]}>
                        {info.isDueToday ? 'Due Today' : info.statusLabel}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={styles.itemAmount}>
                  -{formatCurrency(item.amount)}
                </Text>

                {!info.isSettledThisMonth && onDeductNow && (
                  <TouchableOpacity
                    style={styles.deductNowBtn}
                    onPress={() => handleDeduct(item)}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Zap size={10} color={Colors.brand} />
                        <Text style={styles.deductNowText}>Deduct Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  eyebrow: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  pillBadge: {
    backgroundColor: 'rgba(94, 106, 210, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.3)',
  },
  pillBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 14.5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  manageText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand,
  },
  metricsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.textSubdued,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: Colors.text,
  },
  metricValueDeficit: {
    color: Colors.expense,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  itemsList: {
    marginTop: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  itemLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  itemCategory: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textSubdued,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  settledText: {
    fontSize: 9.5,
    color: Colors.income,
    fontWeight: '600',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueText: {
    fontSize: 9.5,
    color: Colors.textMuted,
  },
  dueTextUrgent: {
    color: Colors.expense,
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  itemAmount: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.expense,
  },
  deductNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  deductNowText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.brand,
  },
});
