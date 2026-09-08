// src/components/CashFlowChart.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, BarChart3, Plus } from 'lucide-react-native';
import { MonthlyCashFlow } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface CashFlowChartProps {
  data: MonthlyCashFlow[];
  onAddTransaction?: () => void;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  onAddTransaction,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthlyCashFlow | null>(
    data.length > 0 ? data[data.length - 1] : null
  );

  const totalIncomeAll = data.reduce((s, d) => s + d.income, 0);
  const totalExpenseAll = data.reduce((s, d) => s + d.expenditure, 0);
  const hasAnyData = totalIncomeAll > 0 || totalExpenseAll > 0;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenditure)),
    1000
  );

  const netSurplus = totalIncomeAll - totalExpenseAll;
  const efficiencyPercent =
    totalIncomeAll > 0 ? Math.max(0, Math.round((netSurplus / totalIncomeAll) * 100)) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cash Flow Analytics</Text>
          <Text style={styles.subtitle}>Monthly Inflow vs Outflow</Text>
        </View>
        <View style={[styles.trendBadge, !hasAnyData && styles.trendBadgeNeutral]}>
          <TrendingUp size={12} color={hasAnyData ? Colors.income : Colors.textMuted} />
          <Text style={[styles.trendText, !hasAnyData && { color: Colors.textMuted }]}>
            {hasAnyData ? `${efficiencyPercent}% Efficiency` : 'Awaiting Data'}
          </Text>
        </View>
      </View>

      {/* Selected Month Tooltip / Banner */}
      {selectedMonth && hasAnyData && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipMonth}>{selectedMonth.month} Summary:</Text>
          <Text style={styles.tooltipAmounts}>
            +{formatCurrency(selectedMonth.income, { showDecimals: false })} / -
            {formatCurrency(selectedMonth.expenditure, { showDecimals: false })}
          </Text>
        </View>
      )}

      {/* Dual Bar Graphic Canvas or Empty State */}
      {hasAnyData ? (
        <View style={styles.chartCanvas}>
          {/* Horizontal grid guide lines */}
          <View style={styles.gridLinesContainer}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((item) => {
              const isSelected = selectedMonth?.month === item.month;
              const hasMonthData = item.income > 0 || item.expenditure > 0;
              const incomeHeightPercent = hasMonthData
                ? Math.max(8, Math.round((item.income / maxVal) * 100))
                : 4;
              const expenseHeightPercent = hasMonthData
                ? Math.max(8, Math.round((item.expenditure / maxVal) * 100))
                : 4;

              return (
                <TouchableOpacity
                  key={item.month}
                  style={styles.monthGroup}
                  onPress={() => setSelectedMonth(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.barsWrapper}>
                    {/* Income Bar (Linear Indigo) */}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${incomeHeightPercent}%`,
                          backgroundColor:
                            item.income > 0
                              ? isSelected
                                ? Colors.brandHover
                                : Colors.brand
                              : 'rgba(255, 255, 255, 0.05)',
                        },
                      ]}
                    />

                    {/* Expenditure Bar (Dark Steel Slate) */}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${expenseHeightPercent}%`,
                          backgroundColor:
                            item.expenditure > 0
                              ? isSelected
                                ? '#f43f5e'
                                : '#e11d48'
                              : 'rgba(255, 255, 255, 0.05)',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.monthLabel,
                      isSelected && { color: Colors.text, fontWeight: '700' },
                    ]}
                  >
                    {item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyChartCanvas}>
          <View style={styles.emptyIconBadge}>
            <BarChart3 size={24} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No Cash Flow Recorded Yet</Text>
          <Text style={styles.emptyText}>
            Cash flow distribution will automatically track here as you log household income and expenses.
          </Text>
          {onAddTransaction && (
            <TouchableOpacity
              onPress={onAddTransaction}
              style={styles.emptyAddBtn}
              activeOpacity={0.7}
            >
              <Plus size={13} color={Colors.white} />
              <Text style={styles.emptyAddBtnText}>Add Your First Entry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Legend & Breakdown */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.legendDot, { backgroundColor: Colors.brand }]} />
            <Text style={styles.legendLabel}>Total Inflows</Text>
          </View>
          <Text style={styles.legendValue}>
            {formatCurrency(totalIncomeAll, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
            <Text style={styles.legendLabel}>Disbursements</Text>
          </View>
          <Text style={styles.legendValue}>
            {formatCurrency(totalExpenseAll, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
            <Text style={styles.legendLabel}>Ledger Efficiency</Text>
          </View>
          <Text
            style={[
              styles.legendValue,
              { color: efficiencyPercent > 0 ? Colors.income : Colors.textMuted },
            ]}
          >
            {efficiencyPercent}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.incomeSubdued,
    borderColor: Colors.incomeBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  trendBadgeNeutral: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.border,
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.income,
  },
  tooltip: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipMonth: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  tooltipAmounts: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  chartCanvas: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    height: 160,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 14,
    bottom: 30,
    left: 8,
    right: 8,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    zIndex: 10,
  },
  monthGroup: {
    alignItems: 'center',
    width: 50,
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 4,
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  monthLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 8,
  },
  emptyChartCanvas: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  emptyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
    marginBottom: 14,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  emptyAddBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  legendContainer: {
    marginTop: 14,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  legendValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.text,
  },
});
