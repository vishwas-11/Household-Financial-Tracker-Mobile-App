// src/components/HeroBalanceCard.tsx
// High-intensity Brushed Titanium & Specular Platinum Metallic Finish
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, Repeat, Clock } from 'lucide-react-native';
import { AnimatedCounter } from './AnimatedCounter';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../lib/currency';

interface HeroBalanceCardProps {
  balance: number; // Current Holding (Realized cash on hand)
  totalIncome: number; // Realized income
  totalExpense: number; // Realized expenses
  savingsRate: number;
  householdName: string;
  recurringMonthlyOutflow?: number;
  projectedBalance?: number; // Projected month-end balance after upcoming transactions
  upcomingIncome?: number;
  upcomingExpense?: number;
  upcomingCount?: number;
  earliestUpcomingDate?: string;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  balance,
  totalIncome,
  totalExpense,
  savingsRate,
  householdName,
  recurringMonthlyOutflow = 0,
  projectedBalance,
  upcomingIncome = 0,
  upcomingExpense = 0,
  upcomingCount = 0,
  earliestUpcomingDate,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 9, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {/* Precision Brushed Titanium Bezel Frame */}
      <LinearGradient
        colors={['#94A3B8', '#475569', '#1E293B', '#64748B', '#CBD5E1', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezelBorder}
      >
        {/* Rich Brushed Obsidian/Titanium Surface */}
        <LinearGradient
          colors={['#1F2430', '#13151D', '#0A0C11', '#171B24'] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Luminous Specular Platinum Chamfer Light Strip */}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(148, 163, 184, 0.4)',
              '#FFFFFF',
              '#E2E8F0',
              'rgba(203, 213, 225, 0.8)',
              'rgba(148, 163, 184, 0.3)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topMetallicSheen}
          />

          {/* Soft ambient metallic glow beneath top edge */}
          <LinearGradient
            colors={['rgba(203, 213, 225, 0.12)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.topAmbientGlow, { pointerEvents: 'none' }]}
          />

          {/* Primary diagonal brushed metallic reflection streak */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.metallicDiagonalStreakPrimary, { pointerEvents: 'none' }]}
          />

          {/* Secondary counter-diagonal brushed metallic streak */}
          <LinearGradient
            colors={['rgba(203, 213, 225, 0.06)', 'rgba(255, 255, 255, 0.01)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.metallicDiagonalStreakSecondary, { pointerEvents: 'none' }]}
          />

          {/* Card Header: Household Identity & Status */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#2D3342', '#181B22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.walletIcon}
              >
                <Wallet size={14} color="#CBD5E1" />
              </LinearGradient>
              <Text style={styles.householdLabel} numberOfLines={1}>
                {householdName || 'Household Ledger'}
              </Text>
            </View>

            <View style={styles.headerRightBadgeRow}>
              <View style={styles.savingsRateBadge}>
                <TrendingUp size={11} color="#10B981" />
                <Text style={styles.savingsRateText}>{savingsRate}% saved</Text>
              </View>
              <LinearGradient
                colors={['#2D3342', '#181B22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metallicChip}
              >
                <ShieldCheck size={12} color="#CBD5E1" />
              </LinearGradient>
            </View>
          </View>

          {/* Current Holding Display */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceLabelLeft}>
                <View style={styles.liveHoldingDot} />
                <Text style={styles.balanceLabel}>CURRENT HOLDING</Text>
              </View>
              {recurringMonthlyOutflow > 0 && (
                <View style={styles.recurringChip}>
                  <Repeat size={9.5} color="#A5B4FC" />
                  <Text style={styles.recurringChipText}>
                    {formatCurrency(recurringMonthlyOutflow, { showDecimals: false })}/mo recurring
                  </Text>
                </View>
              )}
            </View>
            <AnimatedCounter
              value={balance}
              prefix={balance < 0 ? '-₹' : '₹'}
              style={styles.balanceAmount}
              duration={2600}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            />

            {/* Upcoming / Projected Month-End Callout */}
            {upcomingCount > 0 && projectedBalance !== undefined && (
              <View style={styles.projectedBanner}>
                {/* Header Row: Timing badge on left, count on right */}
                <View style={styles.projectedHeader}>
                  <View style={styles.projectedBadge}>
                    <Clock size={10} color="#A5B4FC" />
                    <Text style={styles.projectedBadgeText}>
                      UPCOMING {earliestUpcomingDate ? `· ${earliestUpcomingDate.toUpperCase()}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.projectedCountText}>
                    {upcomingCount} scheduled {upcomingCount === 1 ? 'entry' : 'entries'}
                  </Text>
                </View>

                {/* Main Content Row: Flow Pills on left, Month-End Est. stacked on right */}
                <View style={styles.projectedBodyRow}>
                  <View style={styles.projectedPillsWrap}>
                    {upcomingIncome > 0 && (
                      <View style={styles.projectedIncomePill}>
                        <Text style={styles.projectedIncomeText}>
                          +{formatCurrency(upcomingIncome, { showDecimals: false })}
                        </Text>
                      </View>
                    )}
                    {upcomingExpense > 0 && (
                      <View style={styles.projectedExpensePill}>
                        <Text style={styles.projectedExpenseText}>
                          -{formatCurrency(upcomingExpense, { showDecimals: false })}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.projectedTargetBlock}>
                    <Text style={styles.projectedTargetLabel}>Month-End Est.</Text>
                    <Text style={styles.projectedTargetAmount}>
                      {formatCurrency(projectedBalance)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Hairline Platinum Specular Divider */}
          <LinearGradient
            colors={['transparent', 'rgba(203, 213, 225, 0.42)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Income / Expense Sub-Cards */}
          <View style={styles.pillsRow}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pillCard}
            >
              <View style={[styles.pillIcon, styles.pillIconIncome]}>
                <TrendingUp size={12.5} color="#10B981" />
              </View>
              <View style={styles.pillTextWrap}>
                <Text style={styles.pillLabel} numberOfLines={1}>Current Income</Text>
                <AnimatedCounter
                  value={totalIncome}
                  prefix="₹"
                  style={[styles.pillAmount, styles.pillAmountIncome]}
                  duration={2400}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                />
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pillCard}
            >
              <View style={[styles.pillIcon, styles.pillIconExpense]}>
                <TrendingDown size={12.5} color="#F43F5E" />
              </View>
              <View style={styles.pillTextWrap}>
                <Text style={styles.pillLabel} numberOfLines={1}>Current Expenses</Text>
                <AnimatedCounter
                  value={totalExpense}
                  prefix="₹"
                  style={[styles.pillAmount, styles.pillAmountExpense]}
                  duration={2400}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                />
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 22px rgba(0, 0, 0, 0.55)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.55,
        shadowRadius: 22,
        elevation: 16,
      },
    }),
    marginBottom: 4,
  },
  bezelBorder: {
    borderRadius: 22,
    padding: 1.5,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 20.5,
    padding: 20,
    paddingBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  topMetallicSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  metallicDiagonalStreakPrimary: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 250,
    height: 250,
    borderRadius: 125,
    transform: [{ rotate: '25deg' }],
  },
  metallicDiagonalStreakSecondary: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    transform: [{ rotate: '-15deg' }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  walletIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: 0.1,
    maxWidth: 160,
  },
  headerRightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8.5,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  savingsRateText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },
  metallicChip: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    marginTop: 2,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveHoldingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  recurringChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.32)',
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  recurringChipText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#C7D2FE',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.4,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontFamily: 'monospace',
    ...Platform.select({
      web: {
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.65)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.65)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  projectedBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 8,
  },
  projectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  projectedBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 0.5,
  },
  projectedCountText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  projectedBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  projectedPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  projectedIncomePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  projectedIncomeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#10B981',
  },
  projectedExpensePill: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  projectedExpenseText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#F43F5E',
  },
  projectedTargetBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  projectedTargetLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 1,
  },
  projectedTargetAmount: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1.5,
    marginVertical: 14,
    width: '100%',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.16)',
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 9,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillIconIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pillIconExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  pillTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pillLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  pillAmount: {
    fontSize: 12.8,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: -0.2,
  },
  pillAmountIncome: {
    color: '#10B981',
  },
  pillAmountExpense: {
    color: '#F43F5E',
  },
});
