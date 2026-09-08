// src/components/StatCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface StatCardProps {
  label: string;
  value: string;
  badgeText: string;
  badgeType?: 'income' | 'expense' | 'neutral' | 'brand';
  progressPercent?: number;
  progressColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  badgeText,
  badgeType = 'brand',
  progressPercent = 70,
  progressColor = Colors.brand,
}) => {
  const getBadgeStyles = () => {
    switch (badgeType) {
      case 'income':
        return {
          bg: Colors.incomeSubdued,
          border: Colors.incomeBorder,
          text: Colors.income,
          icon: <ArrowUpRight size={12} color={Colors.income} />,
        };
      case 'expense':
        return {
          bg: Colors.expenseSubdued,
          border: Colors.expenseBorder,
          text: Colors.expense,
          icon: <ArrowDownRight size={12} color={Colors.expense} />,
        };
      case 'neutral':
      case 'brand':
      default:
        return {
          bg: Colors.brandSubdued,
          border: Colors.brandBorder,
          text: Colors.brand,
          icon: <Activity size={12} color={Colors.brand} />,
        };
    }
  };

  const badge = getBadgeStyles();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.contentRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          {badge.icon}
          <Text style={[styles.badgeText, { color: badge.text }]}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.max(8, Math.min(progressPercent, 100))}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
