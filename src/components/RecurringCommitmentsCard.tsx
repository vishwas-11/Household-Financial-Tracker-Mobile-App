// src/components/RecurringCommitmentsCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Repeat, ChevronRight, CheckCircle2, Clock } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { RecurringItem, Transaction } from '../types';
import { formatCurrency } from '../lib/currency';
import { getRecurringScheduleInfo } from '../lib/recurringManager';

interface RecurringCommitmentsCardProps {
  recurringItems: RecurringItem[];
  transactions: Transaction[];
  currentBalance: number;
  onNavigateToRecurring?: () => void;
}

export const RecurringCommitmentsCard: React.FC<RecurringCommitmentsCardProps> = ({
  recurringItems,
  transactions,
  currentBalance,
  onNavigateToRecurring,
}) => {
  if (!recurringItems || recurringItems.length === 0) {
    return null;
  }

  // Calculate monthly inflow, outflow, and net
  const totalMonthlyIncome = recurringItems
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalMonthlyExpense = recurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

  const netMonthlyRecurring = totalMonthlyIncome - totalMonthlyExpense;

  const pendingRecurringItems = recurringItems.filter((r) => {
    const info = getRecurringScheduleInfo(r, transactions);
    return !info.isSettledThisMonth;
  });

  const pendingIncome = pendingRecurringItems
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingExpense = pendingRecurringItems
    .filter((r) => r.type === 'expenditure')
    .reduce((sum, r) => sum + r.amount, 0);

  const netPending = pendingIncome - pendingExpense;

  // Free cash flow forecast: current realized cash + pending income - pending commitments
  const forecastedFreeCash = currentBalance + netPending;

  // Sort: unsettled and due soonest first, then settled
  const sortedItems = useMemo(() => {
    return [...recurringItems].sort((a, b) => {
      const infoA = getRecurringScheduleInfo(a, transactions);
      const infoB = getRecurringScheduleInfo(b, transactions);

      if (infoA.isSettledThisMonth !== infoB.isSettledThisMonth) {
        return infoA.isSettledThisMonth ? 1 : -1;
      }
      return infoA.daysRemaining - infoB.daysRemaining;
    });
  }, [recurringItems, transactions]);

  // Show top 2-3 items on dashboard
  const displayedItems = sortedItems.slice(0, 3);
  const remainingCount = sortedItems.length - displayedItems.length;

  const activeCount = recurringItems.length;

  const CardContainer = onNavigateToRecurring ? TouchableOpacity : View;

  return (
    <CardContainer
      style={styles.card}
      {...(onNavigateToRecurring ? { onPress: onNavigateToRecurring, activeOpacity: 0.78 } : {})}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Repeat size={16} color={Colors.brand} />
          </View>
          <View style={styles.headerTextWrap}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>RECURRING ENGINE</Text>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{activeCount} ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.title}>Monthly Commitments</Text>
            <Text style={styles.subtitle}>Tap to view schedule & settle payments</Text>
          </View>
        </View>

        {onNavigateToRecurring && (
          <View style={styles.chevronWrap}>
            <ChevronRight size={18} color={Colors.textMuted} />
          </View>
        )}
      </View>

      {/* Financial Metrics Strip */}
      <View style={styles.metricsBanner}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>NET RECURRING/MO</Text>
          <Text
            style={[
              styles.metricValue,
              netMonthlyRecurring > 0 && styles.metricValueIncome,
              netMonthlyRecurring < 0 && styles.metricValueDeficit,
            ]}
          >
            {netMonthlyRecurring > 0 ? '+' : ''}{formatCurrency(netMonthlyRecurring, { showDecimals: false })}
          </Text>
          <Text style={styles.metricSubtext}>
            +{formatCurrency(totalMonthlyIncome, { showDecimals: false })} · -{formatCurrency(totalMonthlyExpense, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>PENDING CYCLE</Text>
          <Text
            style={[
              styles.metricValue,
              netPending > 0 && styles.metricValueIncome,
              netPending < 0 && styles.metricValueDeficit,
            ]}
          >
            {netPending > 0 ? '+' : ''}{formatCurrency(netPending, { showDecimals: false })}
          </Text>
          <Text style={styles.metricSubtext}>
            +{formatCurrency(pendingIncome, { showDecimals: false })} · -{formatCurrency(pendingExpense, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>PROJECTED FREE CASH</Text>
          <Text
            style={[
              styles.metricValue,
              forecastedFreeCash < 0 && styles.metricValueDeficit,
            ]}
          >
            {formatCurrency(forecastedFreeCash, { showDecimals: false })}
          </Text>
          <Text style={styles.metricSubtext}>
            Holding {netPending >= 0 ? '+' : ''}{formatCurrency(netPending, { showDecimals: false })}
          </Text>
        </View>
      </View>

      {/* Scheduled Items List (Clean rows without deduct button) */}
      <View style={styles.itemsList}>
        {displayedItems.map((item) => {
          const info = getRecurringScheduleInfo(item, transactions);

          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemCategory}>{item.category} • {item.frequency}</Text>
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
                <Text style={[styles.itemAmount, item.type === 'income' && styles.itemAmountIncome]}>
                  {item.type === 'income' ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                </Text>
                <View style={[styles.typeBadge, item.type === 'income' ? styles.typeBadgeIncome : styles.typeBadgeExpense]}>
                  <Text style={[styles.typeBadgeText, item.type === 'income' ? styles.typeBadgeTextIncome : styles.typeBadgeTextExpense]}>
                    {item.type === 'income' ? 'INFLOW' : 'OUTFLOW'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* View All In Recurring Tab CTA */}
      {remainingCount > 0 && (
        <View style={styles.viewAllCommitmentsBtn}>
          <Text style={styles.viewAllCommitmentsText}>
            +{remainingCount} more recurring {remainingCount === 1 ? 'commitment' : 'commitments'} scheduled
          </Text>
          <View style={styles.viewAllRight}>
            <Text style={styles.viewAllActionText}>View & Settle in Recurring</Text>
            <ChevronRight size={13} color={Colors.brand} />
          </View>
        </View>
      )}
    </CardContainer>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    alignItems: 'center',
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
  chevronWrap: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
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
  metricValueIncome: {
    color: Colors.income,
  },
  metricSubtext: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemAmountIncome: {
    color: Colors.income,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  typeBadgeIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  typeBadgeExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  typeBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  typeBadgeTextIncome: {
    color: Colors.income,
  },
  typeBadgeTextExpense: {
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
    gap: 4,
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
    justifyContent: 'center',
  },
  itemAmount: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.expense,
  },
  viewAllCommitmentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 10,
  },
  viewAllCommitmentsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewAllRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.brand,
  },
});
