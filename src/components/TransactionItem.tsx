// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ShoppingCart,
  Zap,
  CreditCard,
  Coffee,
  Home,
  Briefcase,
  FileText,
  Trash2,
  Paperclip,
} from 'lucide-react-native';
import { Transaction } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  onViewReceipt?: (url: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  onViewReceipt,
}) => {
  const isIncome = transaction.type === 'income';
  const isSavings = transaction.type === 'savings';

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    const size = 14;
    if (cat.includes('grocer') || cat.includes('food') || cat.includes('market')) {
      return <ShoppingCart size={size} color={Colors.brand} />;
    }
    if (
      cat.includes('util') ||
      cat.includes('electric') ||
      cat.includes('water') ||
      cat.includes('energy')
    ) {
      return <Zap size={size} color={Colors.warning} />;
    }
    if (
      cat.includes('salary') ||
      cat.includes('deposit') ||
      cat.includes('income') ||
      cat.includes('freelance')
    ) {
      return <CreditCard size={size} color={Colors.income} />;
    }
    if (cat.includes('dining') || cat.includes('coffee') || cat.includes('restaurant')) {
      return <Coffee size={size} color={Colors.expense} />;
    }
    if (cat.includes('house') || cat.includes('mortgage') || cat.includes('rent')) {
      return <Home size={size} color="#38bdf8" />;
    }
    if (cat.includes('work') || cat.includes('consult')) {
      return <Briefcase size={size} color={Colors.brand} />;
    }
    return <FileText size={size} color={Colors.textMuted} />;
  };

  return (
    <View style={styles.container}>
      {/* Icon Badge */}
      <View style={styles.iconContainer}>{getCategoryIcon(transaction.category)}</View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{transaction.date}</Text>
          <Text style={styles.metaBullet}>•</Text>
          <Text style={styles.metaText}>{transaction.category}</Text>
          {transaction.memberName && (
            <>
              <Text style={styles.metaBullet}>•</Text>
              <View style={styles.memberTag}>
                <Text style={styles.memberInitial}>
                  {transaction.memberId || transaction.memberName.charAt(0)}
                </Text>
              </View>
            </>
          )}
          {transaction.receiptUrl && (
            <TouchableOpacity
              style={styles.receiptBadge}
              onPress={() => onViewReceipt && onViewReceipt(transaction.receiptUrl!)}
              activeOpacity={0.7}
            >
              <Paperclip size={10} color={Colors.brand} />
              <Text style={styles.receiptText}>Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Amount & Actions */}
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            isIncome && styles.amountIncome,
            isSavings && styles.amountSavings,
          ]}
        >
          {isIncome
            ? `+${formatCurrency(transaction.amount)}`
            : `-${formatCurrency(transaction.amount)}`}
        </Text>

        <View style={styles.actionRow}>
          <View
            style={[
              styles.typeBadge,
              isIncome
                ? styles.typeBadgeIncome
                : isSavings
                ? styles.typeBadgeSavings
                : styles.typeBadgeExpense,
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                isIncome
                  ? styles.typeTextIncome
                  : isSavings
                  ? styles.typeTextSavings
                  : styles.typeTextExpense,
              ]}
            >
              {transaction.type.toUpperCase()}
            </Text>
          </View>

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(transaction.id)}
              style={styles.deleteBtn}
              activeOpacity={0.6}
              accessibilityLabel="Delete entry"
            >
              <Trash2 size={13} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: Colors.surface,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 10,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
  },
  metaBullet: {
    fontSize: 10,
    color: Colors.textSubdued,
  },
  memberTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberInitial: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.brandSubdued,
    borderColor: Colors.brandBorder,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  receiptText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.brand,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  amountIncome: {
    color: Colors.income,
  },
  amountSavings: {
    color: Colors.savings,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBadgeIncome: {
    backgroundColor: Colors.incomeSubdued,
    borderColor: Colors.incomeBorder,
  },
  typeBadgeSavings: {
    backgroundColor: Colors.savingsSubdued,
    borderColor: Colors.savingsBorder,
  },
  typeBadgeExpense: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.border,
  },
  typeBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  typeTextIncome: {
    color: Colors.income,
  },
  typeTextSavings: {
    color: Colors.savings,
  },
  typeTextExpense: {
    color: Colors.textSecondary,
  },
  deleteBtn: {
    padding: 3,
  },
});
