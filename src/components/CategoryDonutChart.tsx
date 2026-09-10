// src/components/CategoryDonutChart.tsx
// Animated segmented radial donut chart inspired by BNA UI with circular sweep animation
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Transaction, RecurringItem } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { formatCurrency } from '../lib/currency';
import { getRecurringScheduleInfo } from '../lib/recurringManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_WIDTH * 0.42, 155);
const STROKE_WIDTH = 18;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CX = SIZE / 2;
const CY = SIZE / 2;

const CHART_COLORS = [
  Colors.chart[0], // Brand / Indigo
  Colors.chart[1], // Emerald
  Colors.chart[2], // Rose
  Colors.chart[3], // Amber
  Colors.chart[4], // Violet
  Colors.chart[5], // Cyan
];

interface CategoryDonutChartProps {
  transactions: Transaction[];
  recurringItems?: RecurringItem[];
  duration?: number;
  isVisible?: boolean;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  transactions = [],
  recurringItems = [],
  duration = 2400,
  isVisible = true,
}) => {
  const [sweepProgress, setSweepProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Dynamically compute category totals combining realized expenses and active recurring commitments
  const { catMap, total, scheduledCount } = useMemo(() => {
    const map: Record<string, number> = {};
    let sum = 0;
    let scheduled = 0;

    // 1. Realized transaction expenses
    transactions
      .filter((t) => t.type === 'expenditure')
      .forEach((t) => {
        sum += t.amount;
        const cat = t.category || 'Other';
        map[cat] = (map[cat] || 0) + t.amount;
      });

    // 2. Active recurring expense commitments for this cycle (if not already deducted)
    recurringItems
      .filter((r) => r.type === 'expenditure')
      .forEach((r) => {
        const info = getRecurringScheduleInfo(r, transactions);
        if (!info.isSettledThisMonth) {
          sum += r.amount;
          scheduled++;
          const cat = r.category || 'Other';
          map[cat] = (map[cat] || 0) + r.amount;
        }
      });

    return { catMap: map, total: sum, scheduledCount: scheduled };
  }, [transactions, recurringItems]);

  const sorted = useMemo(() => {
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [catMap]);

  // Easing function: easeOutCubic
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    if (!isVisible || total === 0) {
      setSweepProgress(0);
      return;
    }

    setSweepProgress(0);
    const startTime = Date.now();
    startTimeRef.current = startTime;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setSweepProgress(eased);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isVisible, total, duration]);

  // Compute segmented arcs geometry
  const segments = useMemo(() => {
    if (total === 0 || sorted.length === 0) return [];

    let currentAngle = -90; // Start at 12 o'clock
    const hasMultiple = sorted.length > 1;
    // 3.5-degree gap between slices if multiple categories
    const gapDeg = hasMultiple ? 3.5 : 0;
    const gapLength = (gapDeg / 360) * CIRCUMFERENCE;

    return sorted.map(([name, amount], index) => {
      const ratio = amount / total;
      const sweepDeg = ratio * 360;
      const startAngle = currentAngle + (hasMultiple ? gapDeg / 2 : 0);
      currentAngle += sweepDeg;

      const rawArcLength = ratio * CIRCUMFERENCE;
      const arcLength = Math.max(rawArcLength - gapLength, 1);

      return {
        name,
        amount,
        pct: Math.round(ratio * 100),
        color: CHART_COLORS[index % CHART_COLORS.length],
        startAngle,
        arcLength,
      };
    });
  }, [sorted, total]);

  if (sorted.length === 0 || total === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Spending by Category</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No expenses or recurring bills scheduled yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Spending by Category</Text>
          <Text style={styles.subtitle}>
            {scheduledCount > 0
              ? `Realized spend + ${scheduledCount} scheduled ${scheduledCount === 1 ? 'bill' : 'bills'}`
              : 'Realized expenses breakdown'}
          </Text>
        </View>
        {scheduledCount > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE FLOW</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Radial Donut Container */}
        <View style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE}>
            {/* Background circular track */}
            <Circle
              cx={CX}
              cy={CY}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />

            {/* Animated Category Segments */}
            <G>
              {segments.map((segment, index) => {
                const currentLength = segment.arcLength * sweepProgress;
                return (
                  <Circle
                    key={`seg-${index}`}
                    cx={CX}
                    cy={CY}
                    r={RADIUS}
                    stroke={segment.color}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeLinecap={segments.length > 1 ? 'round' : 'butt'}
                    strokeDasharray={[currentLength, CIRCUMFERENCE]}
                    strokeDashoffset={0}
                    transform={`rotate(${segment.startAngle} ${CX} ${CY})`}
                  />
                );
              })}
            </G>
          </Svg>

          {/* Center totals with animated counter */}
          <View style={[styles.centerOverlay, { pointerEvents: 'none' }]}>
            <AnimatedCounter
              value={isVisible ? total : 0}
              prefix="₹"
              style={styles.centerAmount}
              duration={duration}
              decimals={2}
            />
            <Text style={styles.centerSub}>
              {scheduledCount > 0 ? 'total spent & committed' : 'total spent'}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {segments.slice(0, 5).map((segment, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: segment.color },
                ]}
              />
              <Text style={styles.legendName} numberOfLines={1}>
                {segment.name}
              </Text>
              <Text style={styles.legendPct}>{segment.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.28)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.brand,
  },
  liveBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  centerAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 8.5,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  legend: {
    flex: 1,
    gap: 9,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  legendPct: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  emptyState: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSubdued,
    textAlign: 'center',
  },
});
