// src/components/CashFlowAreaChart.tsx
// Uses react-native-svg (already installed) for a Expo-compatible area chart
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { MonthlyCashFlow } from '../types';
import { formatCurrency } from '../lib/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_H = 150;
const CHART_PAD = { top: 12, bottom: 28, left: 40, right: 14 };

interface CashFlowAreaChartProps {
  data: MonthlyCashFlow[];
}

function buildAreaPath(
  points: { x: number; y: number }[],
  chartW: number,
  chartH: number,
  bottom: number
): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp1x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  d += ` L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  return d;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp1x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export const CashFlowAreaChart: React.FC<CashFlowAreaChartProps> = ({ data }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }).start();
  }, []);

  const chartW = SCREEN_WIDTH - 36;
  const innerW = chartW - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

  const hasData = data.some(d => d.income > 0 || d.expenditure > 0);
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenditure)), 1000);

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const toSvgY = (val: number) => CHART_PAD.top + innerH - (val / maxVal) * innerH;
  const bottom = CHART_PAD.top + innerH;

  const incomePoints = data.map((d, i) => ({ x: CHART_PAD.left + i * xStep, y: toSvgY(d.income) }));
  const expensePoints = data.map((d, i) => ({ x: CHART_PAD.left + i * xStep, y: toSvgY(d.expenditure) }));

  const incomeAreaPath = buildAreaPath(incomePoints, innerW, innerH, bottom);
  const expenseAreaPath = buildAreaPath(expensePoints, innerW, innerH, bottom);
  const incomeLinePath = buildLinePath(incomePoints);
  const expenseLinePath = buildLinePath(expensePoints);

  const yTicks = [0, maxVal * 0.5, maxVal].map(v => ({
    val: v,
    y: toSvgY(v),
    label: v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${Math.round(v)}`,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Cash Flow</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.income }]} /><Text style={styles.legendText}>Income</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.expense }]} /><Text style={styles.legendText}>Expense</Text></View>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Add transactions to see your cash flow chart</Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: opacityAnim }}>
          <Svg width={chartW} height={CHART_H}>
            <Defs>
              <SvgLinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.income} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={Colors.income} stopOpacity="0" />
              </SvgLinearGradient>
              <SvgLinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.expense} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={Colors.expense} stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>

            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <Line key={i} x1={CHART_PAD.left} y1={tick.y} x2={chartW - CHART_PAD.right} y2={tick.y}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 4" />
            ))}

            {/* Y-axis labels */}
            {yTicks.map((tick, i) => (
              <SvgText key={i} x={CHART_PAD.left - 5} y={tick.y + 4} textAnchor="end" fontSize={9} fill={Colors.textSubdued} fontFamily="monospace">{tick.label}</SvgText>
            ))}

            {/* Area fills */}
            {incomeAreaPath ? <Path d={incomeAreaPath} fill="url(#incomeGrad)" /> : null}
            {expenseAreaPath ? <Path d={expenseAreaPath} fill="url(#expenseGrad)" /> : null}

            {/* Lines */}
            {incomeLinePath ? <Path d={incomeLinePath} stroke={Colors.income} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {expenseLinePath ? <Path d={expenseLinePath} stroke={Colors.expense} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}

            {/* Data points */}
            {incomePoints.map((pt, i) => (
              <Circle key={`inc-${i}`} cx={pt.x} cy={pt.y} r={4} fill={Colors.income} stroke={Colors.surface} strokeWidth={2} />
            ))}
            {expensePoints.map((pt, i) => (
              <Circle key={`exp-${i}`} cx={pt.x} cy={pt.y} r={4} fill={Colors.expense} stroke={Colors.surface} strokeWidth={2} />
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => (
              <SvgText key={i} x={CHART_PAD.left + i * xStep} y={CHART_H - 6} textAnchor="middle" fontSize={9.5} fill={Colors.textMuted}>{d.month}</SvgText>
            ))}
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surfaceCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, paddingBottom: 8, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text },
  legendRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10.5, color: Colors.textMuted, fontWeight: '500' },
  emptyState: { height: 150, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: Colors.textSubdued, textAlign: 'center', lineHeight: 18, maxWidth: 200 },
});
