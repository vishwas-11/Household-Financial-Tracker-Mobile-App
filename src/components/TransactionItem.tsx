// src/components/TransactionItem.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { ShoppingCart, Zap, CreditCard, Coffee, Home, Briefcase, FileText, Trash2, Paperclip, PiggyBank, Bus, BookOpen, Activity, Music, Tag } from 'lucide-react-native';
import { Transaction } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  onViewReceipt?: (url: string) => void;
  onPress?: () => void;
  index?: number;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  onViewReceipt,
  onPress,
  index = 0,
}) => {
  const isIncome = transaction.type === 'income';
  const isSavings = transaction.type === 'savings';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = index * 55;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, delay, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const getCategoryMeta = (category: string): { icon: React.ReactNode; accentColor: string } => {
    const cat = category.toLowerCase();
    const size = 15;
    if (cat.includes('grocer') || cat.includes('food') || cat.includes('market'))
      return { icon: <ShoppingCart size={size} color={Colors.income} />, accentColor: Colors.income };
    if (cat.includes('util') || cat.includes('electric') || cat.includes('water'))
      return { icon: <Zap size={size} color={Colors.warning} />, accentColor: Colors.warning };
    if (cat.includes('salary') || cat.includes('deposit') || cat.includes('income') || cat.includes('freelance'))
      return { icon: <CreditCard size={size} color="#60A5FA" />, accentColor: '#60A5FA' };
    if (cat.includes('dining') || cat.includes('coffee') || cat.includes('restaurant'))
      return { icon: <Coffee size={size} color={Colors.expense} />, accentColor: Colors.expense };
    if (cat.includes('house') || cat.includes('mortgage') || cat.includes('rent'))
      return { icon: <Home size={size} color="#38BDF8" />, accentColor: '#38BDF8' };
    if (cat.includes('transport') || cat.includes('uber') || cat.includes('cab'))
      return { icon: <Bus size={size} color="#A78BFA" />, accentColor: '#A78BFA' };
    if (cat.includes('education') || cat.includes('school') || cat.includes('book'))
      return { icon: <BookOpen size={size} color="#FB923C" />, accentColor: '#FB923C' };
    if (cat.includes('health') || cat.includes('medical') || cat.includes('doctor'))
      return { icon: <Activity size={size} color="#34D399" />, accentColor: '#34D399' };
    if (cat.includes('saving'))
      return { icon: <PiggyBank size={size} color={Colors.savings} />, accentColor: Colors.savings };
    if (cat.includes('entertainment') || cat.includes('music') || cat.includes('movie'))
      return { icon: <Music size={size} color="#F472B6" />, accentColor: '#F472B6' };
    if (cat.includes('work') || cat.includes('consult'))
      return { icon: <Briefcase size={size} color={Colors.brand} />, accentColor: Colors.brand };
    return { icon: <Tag size={size} color={Colors.textMuted} />, accentColor: Colors.brand };
  };

  const { icon, accentColor } = getCategoryMeta(transaction.category);

  const amountColor = isIncome ? Colors.income : isSavings ? Colors.savings : Colors.text;
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={onPress ? 0.72 : 1}
        disabled={!onPress}
      >
        {/* Category accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
          {icon}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaCategory}>{transaction.category}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaDate}>{transaction.date}</Text>
            {transaction.receiptUrl && (
              <TouchableOpacity style={styles.receiptChip} onPress={(e) => { e.stopPropagation(); if (onViewReceipt) onViewReceipt(transaction.receiptUrl!); }}>
                <Paperclip size={9} color={Colors.brand} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}{formatCurrency(transaction.amount)}
          </Text>
          <View style={[styles.typePill, { backgroundColor: `${amountColor}18`, borderColor: `${amountColor}35` }]}>
            <Text style={[styles.typeText, { color: amountColor }]}>
              {isIncome ? 'INC' : isSavings ? 'SAV' : 'EXP'}
            </Text>
          </View>
        </View>

        {/* Delete */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); onDelete(transaction.id); }} activeOpacity={0.6}>
            <Trash2 size={13} color={Colors.textSubdued} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingRight: 14,
    paddingLeft: 0,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 11,
  },
  accentBar: {
    width: 3,
    height: 38,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    flexShrink: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  details: {
    flex: 1,
    gap: 3,
    overflow: 'hidden',
  },
  description: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaCategory: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 10,
    color: Colors.textSubdued,
  },
  metaDate: {
    fontSize: 10.5,
    color: Colors.textSubdued,
    fontFamily: 'monospace',
  },
  receiptChip: {
    backgroundColor: Colors.brandSubdued,
    borderRadius: 4,
    padding: 3,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: -0.3,
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 8.5,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
    marginLeft: -4,
  },
});
