// src/components/RecurringItemRow.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle2, Trash2 } from 'lucide-react-native';
import { RecurringItem } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface RecurringItemRowProps {
  item: RecurringItem;
  onDelete?: (id: string) => void;
}

export const RecurringItemRow: React.FC<RecurringItemRowProps> = ({ item, onDelete }) => {
  const isIncome = item.type === 'income';

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category} • {item.frequency}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.dueDateRow}>
            <Clock size={11} color={Colors.textSubdued} />
            <Text style={styles.dueDateText}>{item.nextDueDate}</Text>
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
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.amount, isIncome && styles.amountIncome]}>
          {isIncome ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
        </Text>

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
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
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
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
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
    gap: 8,
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
  deleteBtn: {
    padding: 4,
  },
});
