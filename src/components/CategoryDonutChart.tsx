// src/components/CategoryDonutChart.tsx
// Custom SVG donut chart using react-native-svg (already installed)
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_WIDTH * 0.38, 150);
const RADIUS = SIZE / 2 - 10;
const INNER_RADIUS = RADIUS * 0.58;
const CX = SIZE / 2;
const CY = SIZE / 2;

const CHART_COLORS = [
  Colors.chart[0], Colors.chart[1], Colors.chart[2],
  Colors.chart[3], Colors.chart[4], Colors.chart[5],
];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number, innerR: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

interface CategoryDonutChartProps {
  transactions: Transaction[];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ transactions }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 12, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const expenses = transactions.filter(t => t.type === 'expenditure');
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const catMap: Record<string, number> = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (sorted.length === 0 || total === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Spending by Category</Text>
        <View style={styles.emptyState}><Text style={styles.emptyText}>No expenses recorded yet</Text></View>
      </View>
    );
  }

  // Build arcs
  let currentAngle = -90;
  const GAP = 3;
  const arcs = sorted.map(([name, amount], i) => {
    const pct = amount / total;
    const sweep = pct * 360 - GAP;
    const startAngle = currentAngle + GAP / 2;
    const endAngle = currentAngle + sweep + GAP / 2;
    currentAngle += sweep + GAP;
    return {
      name,
      amount,
      pct: Math.round(pct * 100),
      color: CHART_COLORS[i % CHART_COLORS.length],
      path: buildArcPath(CX, CY, RADIUS, startAngle + 90, endAngle + 90, INNER_RADIUS),
    };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Spending by Category</Text>
      <View style={styles.content}>
        {/* Donut */}
        <View style={{ position: "relative", width: SIZE, height: SIZE }}>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
          <Svg width={SIZE} height={SIZE}>
            <G>
              {arcs.map((arc, i) => (
                <Path key={i} d={arc.path} fill={arc.color} />
              ))}
            </G>
            {/* Center fill */}
            <Circle cx={CX} cy={CY} r={INNER_RADIUS - 2} fill={Colors.surfaceCard} />
          </Svg>
          </Animated.View>
          <View style={styles.centerOverlay} pointerEvents="none">
            <Text style={styles.centerAmount}>{formatCurrency(total)}</Text>
            <Text style={styles.centerSub}>total spent</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {arcs.slice(0, 5).map((arc, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: arc.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>{arc.name}</Text>
              <Text style={styles.legendPct}>{arc.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surfaceCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  centerOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  centerAmount: { fontSize: 12, fontWeight: '800', color: Colors.text, fontFamily: 'monospace' },
  centerSub: { fontSize: 9, color: Colors.textMuted, fontWeight: '500', marginTop: 1 },
  legend: { flex: 1, gap: 9 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendColor: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendName: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  legendPct: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', fontFamily: 'monospace' },
  emptyState: { height: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: Colors.textSubdued, textAlign: 'center' },
});


