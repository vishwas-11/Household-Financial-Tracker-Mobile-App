// src/components/RecurringItemRow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Clock, CheckCircle2, Trash2, Zap, Pencil } from 'lucide-react-native';
import { RecurringItem, Transaction } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';
import { getRecurringScheduleInfo } from '../lib/recurringManager';

interface RecurringItemRowProps {
  item: RecurringItem;
  transactions?: Transaction[];
  onDelete?: (id: string) => void;
  onDeductNow?: (item: RecurringItem) => Promise<void>;
  onEdit?: (item: RecurringItem) => void;
}

export const RecurringItemRow: React.FC<RecurringItemRowProps> = ({
  item,
  transactions = [],
  onDelete,
  onDeductNow,
  onEdit,
}) => {
  const isIncome = item.type === 'income';
  const [isDeducting, setIsDeducting] = useState(false);
  const info = getRecurringScheduleInfo(item, transactions);

  const handleDeduct = async () => {
    if (!onDeductNow || isDeducting) return;
    setIsDeducting(true);
    try {
      await onDeductNow(item);
    } finally {
      setIsDeducting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit?.(item)}
      activeOpacity={0.78}
    >
      <View style={styles.leftCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.editPencilBadge}>
            <Pencil size={10} color={Colors.brand} />
          </View>
        </View>
        <Text style={styles.category}>{item.category} • {item.frequency}</Text>

        <View style={styles.metaRow}>
          <View style={styles.dueDateRow}>
            <Clock size={11} color={Colors.textSubdued} />
            <Text style={styles.dueDateText}>
            {item.nextDueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.nextDueDate)
              ? new Date(
                  parseInt(item.nextDueDate.split('-')[0], 10),
                  parseInt(item.nextDueDate.split('-')[1], 10) - 1,
                  parseInt(item.nextDueDate.split('-')[2], 10)
                ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : item.nextDueDate}
          </Text>
          </View>

          {item.autoPay ? (
            <View style={styles.autoPayBadge}>
              <CheckCircle2 size={10} color={Colors.income} />
              <Text style={styles.autoPayText}>AUTO-PAY</Text>
            </View>
          ) : (
            <View style={styles.manualBadge}>
              <Text style={styles.manualText}>MANUAL</Text>
            </View>
          )}

          {info.isSettledThisMonth && (
            <View style={styles.settledBadge}>
              <CheckCircle2 size={10} color={Colors.income} />
              <Text style={styles.settledText}>Deducted this cycle</Text>
            </View>
          )}
        </View>

        {!info.isSettledThisMonth && (
          <Text style={styles.statusHelper}>
            {info.statusLabel}
          </Text>
        )}
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.amount, isIncome && styles.amountIncome]}>
          {isIncome ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
        </Text>

        <View style={styles.actionRow}>
          {onDeductNow && (
            <TouchableOpacity
              onPress={handleDeduct}
              disabled={isDeducting}
              style={[
                styles.deductBtn,
                info.isSettledThisMonth && styles.deductBtnSettled,
              ]}
              activeOpacity={0.7}
            >
              {isDeducting ? (
                <ActivityIndicator size="small" color={info.isSettledThisMonth ? Colors.textMuted : Colors.brand} />
              ) : (
                <>
                  <Zap size={11} color={info.isSettledThisMonth ? Colors.textMuted : Colors.brand} />
                  <Text style={[styles.deductBtnText, info.isSettledThisMonth && styles.deductBtnSettledText]}>
                    {info.isSettledThisMonth ? 'Deduct Again' : 'Deduct Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
              activeOpacity={0.6}
              accessibilityLabel="Delete recurring schedule"
            >
              <Trash2 size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  editPencilBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brandSubdued,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  autoPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.incomeSubdued,
    borderColor: Colors.incomeBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  autoPayText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.income,
  },
  manualBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  manualText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  settledText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.income,
  },
  statusHelper: {
    fontSize: 10,
    color: Colors.textSubdued,
    marginTop: 5,
    fontFamily: 'monospace',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.text,
  },
  amountIncome: {
    color: Colors.income,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brandSubdued,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deductBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.brand,
  },
  deductBtnSettled: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deductBtnSettledText: {
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
});
