// src/components/HeroBalanceCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { AnimatedCounter } from './AnimatedCounter';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface HeroBalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  householdName: string;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  balance,
  totalIncome,
  totalExpense,
  savingsRate,
  householdName,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const isPositive = balance >= 0;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <LinearGradient
        colors={['#3B5BDB', '#1971C2', '#0C8599'] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle texture overlay */}
        <View style={styles.textureOverlay} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.walletIcon}>
              <Wallet size={14} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.householdLabel} numberOfLines={1}>{householdName}</Text>
          </View>
          {savingsRate > 0 && (
            <View style={styles.savingsRateBadge}>
              <TrendingUp size={10} color="#10B981" />
              <Text style={styles.savingsRateText}>{savingsRate}% saved</Text>
            </View>
          )}
        </View>

        {/* Balance */}
        <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
        <AnimatedCounter
          value={balance}
          prefix={balance < 0 ? '-₹' : '₹'}
          style={styles.balanceAmount}
          duration={1400}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Income / Expense Pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <View style={[styles.pillIcon, styles.pillIconIncome]}>
              <TrendingUp size={12} color="#10B981" />
            </View>
            <View>
              <Text style={styles.pillLabel}>Total Income</Text>
              <AnimatedCounter
                value={totalIncome}
                prefix="₹"
                style={styles.pillAmount}
                duration={1200}
              />
            </View>
          </View>

          <View style={styles.pillDivider} />

          <View style={styles.pill}>
            <View style={[styles.pillIcon, styles.pillIconExpense]}>
              <TrendingDown size={12} color="#F43F5E" />
            </View>
            <View>
              <Text style={styles.pillLabel}>Total Expenses</Text>
              <AnimatedCounter
                value={totalExpense}
                prefix="₹"
                style={[styles.pillAmount, styles.pillAmountExpense]}
                duration={1200}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 4,
  },
  gradient: {
    padding: 22,
    paddingBottom: 20,
  },
  textureOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 160,
  },
  savingsRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  savingsRateText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIconIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pillIconExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  pillLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 2,
  },
  pillAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  pillAmountExpense: {
    color: '#FCA5A5',
  },
  pillDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 14,
  },
});

