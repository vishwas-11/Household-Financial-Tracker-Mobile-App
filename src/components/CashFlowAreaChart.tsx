// src/components/CashFlowAreaChart.tsx
// Animated dual-line cash flow chart with BNA UI load animation & interactive touch scrubbing
// Pure React Native implementation - 100% compatible with Expo Go (no worklet/reanimated crash)
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../constants/colors';
import { MonthlyCashFlow } from '../types';
import { formatCurrency } from '../lib/currency';

const CHART_H = 175;
const CHART_PAD = { top: 16, bottom: 26, left: 34, right: 18 };

interface CashFlowAreaChartProps {
  data: MonthlyCashFlow[];
  interactive?: boolean;
}

// Helper to create smooth bezier curves between points
const createSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return '';
  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];

    // Smooth quadratic bezier curve
    const cpx = (prevPoint.x + currentPoint.x) / 2;
    const cpy = prevPoint.y;

    path += ` Q${cpx},${cpy} ${currentPoint.x},${currentPoint.y}`;
  }

  return path;
};

// Helper to create closed area path for gradients
const createAreaPath = (points: { x: number; y: number }[], baselineY: number): string => {
  if (points.length === 0) return '';
  const linePath = createSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L${lastPoint.x},${baselineY} L${firstPoint.x},${baselineY} Z`;
};

// Compact number formatting for axis (e.g. 60k, 2.5k, 0)
const formatAxisNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
  }
  return num.toFixed(0);
};

export const CashFlowAreaChart: React.FC<CashFlowAreaChartProps> = ({
  data,
  interactive = true,
}) => {
  const [containerWidth, setContainerWidth] = useState(340);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Left-to-right drawing reveal animation
  const revealProgress = useRef(new Animated.Value(0)).current;
  const areaFade = useRef(new Animated.Value(0)).current;

  // Staggered pop-in animations for each point
  const dotAnims = useRef<Animated.Value[]>([]).current;
  while (dotAnims.length < data.length) {
    dotAnims.push(new Animated.Value(0));
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const hasData = data.some((d) => d.income > 0 || d.expenditure > 0);
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenditure)), 1000);

  const chartWidth = containerWidth;
  const innerW = Math.max(chartWidth - CHART_PAD.left - CHART_PAD.right, 50);
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;
  const baselineY = CHART_PAD.top + innerH;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const toSvgY = (val: number) => CHART_PAD.top + innerH - (val / maxVal) * innerH;

  const incomePoints = useMemo(
    () => data.map((d, i) => ({ x: CHART_PAD.left + i * xStep, y: toSvgY(d.income) })),
    [data, innerW, maxVal]
  );

  const expensePoints = useMemo(
    () => data.map((d, i) => ({ x: CHART_PAD.left + i * xStep, y: toSvgY(d.expenditure) })),
    [data, innerW, maxVal]
  );

  const incomeLinePath = useMemo(() => createSmoothPath(incomePoints), [incomePoints]);
  const expenseLinePath = useMemo(() => createSmoothPath(expensePoints), [expensePoints]);
  const incomeAreaPath = useMemo(() => createAreaPath(incomePoints, baselineY), [incomePoints, baselineY]);
  const expenseAreaPath = useMemo(() => createAreaPath(expensePoints, baselineY), [expensePoints, baselineY]);

  // Y-axis grid ticks
  const yTicks = useMemo(
    () =>
      [0, maxVal * 0.5, maxVal].map((v) => ({
        val: v,
        y: toSvgY(v),
        label: formatAxisNumber(v),
      })),
    [maxVal, innerH]
  );

  // Trigger BNA UI load animation sequence
  useEffect(() => {
    revealProgress.setValue(0);
    areaFade.setValue(0);
    dotAnims.forEach((anim) => anim.setValue(0));

    Animated.parallel([
      // 1. Left-to-right reveal of line paths
      Animated.timing(revealProgress, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // 2. Smooth fade-in of gradient area fills
      Animated.timing(areaFade, {
        toValue: 1,
        duration: 2000,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      // 3. Staggered spring pop-in for data points
      ...dotAnims.slice(0, data.length).map((anim, idx) =>
        Animated.sequence([
          Animated.delay(idx * 160 + 200),
          Animated.spring(anim, {
            toValue: 1,
            tension: 130,
            friction: 8,
            useNativeDriver: false,
          }),
        ])
      ),
    ]).start();
  }, [data]);

  // Touch scrubbing gesture handler
  const findNearestPointIndex = useCallback(
    (touchX: number): number => {
      if (!incomePoints.length) return 0;
      let nearest = 0;
      let minDistance = Math.abs(incomePoints[0].x - touchX);
      for (let i = 1; i < incomePoints.length; i++) {
        const distance = Math.abs(incomePoints[i].x - touchX);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }
      return nearest;
    },
    [incomePoints]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive && hasData,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Lock to horizontal dragging so vertical dashboard scrolling is smooth
        return (
          interactive &&
          hasData &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 6
        );
      },
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        setActivePointIndex(findNearestPointIndex(x));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        setActivePointIndex(findNearestPointIndex(x));
      },
      onPanResponderRelease: () => {
        setActivePointIndex(null);
      },
      onPanResponderTerminate: () => {
        setActivePointIndex(null);
      },
    })
  ).current;

  const activeData = activePointIndex !== null ? data[activePointIndex] : null;
  const activeIncomePt = activePointIndex !== null ? incomePoints[activePointIndex] : null;
  const activeExpensePt = activePointIndex !== null ? expensePoints[activePointIndex] : null;

  // Reveal width interpolation for left-to-right drawing animation
  const revealWidth = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chartWidth],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Cash Flow</Text>
          {activeData && (
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{activeData.month}</Text>
            </View>
          )}
        </View>

        {activeData ? (
          <View style={styles.activeInspectRow}>
            <View style={styles.inspectItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
              <Text style={[styles.inspectValue, { color: Colors.income }]}>
                {formatCurrency(activeData.income)}
              </Text>
            </View>
            <View style={styles.inspectItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
              <Text style={[styles.inspectValue, { color: Colors.expense }]}>
                {formatCurrency(activeData.expenditure)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>
        )}
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Add transactions to see your cash flow chart</Text>
        </View>
      ) : (
        <View
          style={styles.chartArea}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          {/* Base SVG Layer: Grid lines & Axis Labels */}
          <Svg width={chartWidth} height={CHART_H} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.income} stopOpacity="0.28" />
                <Stop offset="100%" stopColor={Colors.income} stopOpacity="0.01" />
              </SvgLinearGradient>
              <SvgLinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.expense} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={Colors.expense} stopOpacity="0.01" />
              </SvgLinearGradient>
            </Defs>

            {/* Horizontal dashed grid lines */}
            {yTicks.map((tick, i) => (
              <Line
                key={`grid-h-${i}`}
                x1={CHART_PAD.left}
                y1={tick.y}
                x2={chartWidth - CHART_PAD.right}
                y2={tick.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Y-axis numbers */}
            {yTicks.map((tick, i) => (
              <SvgText
                key={`y-label-${i}`}
                x={CHART_PAD.left - 6}
                y={tick.y + 3.5}
                textAnchor="end"
                fontSize={9}
                fill={Colors.textSubdued}
                fontFamily="monospace"
              >
                {tick.label}
              </SvgText>
            ))}

            {/* X-axis month labels */}
            {data.map((d, i) => {
              const x = CHART_PAD.left + i * xStep;
              const isSelected = activePointIndex === i;
              return (
                <SvgText
                  key={`x-label-${i}`}
                  x={x}
                  y={CHART_H - 8}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={isSelected ? '700' : '400'}
                  fill={isSelected ? Colors.text : Colors.textMuted}
                >
                  {d.month}
                </SvgText>
              );
            })}
          </Svg>

          {/* Animated Area Fill Layer */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: areaFade }]}>
            <Svg width={chartWidth} height={CHART_H}>
              <Defs>
                <SvgLinearGradient id="incomeGrad2" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.income} stopOpacity="0.28" />
                  <Stop offset="100%" stopColor={Colors.income} stopOpacity="0.01" />
                </SvgLinearGradient>
                <SvgLinearGradient id="expenseGrad2" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.expense} stopOpacity="0.22" />
                  <Stop offset="100%" stopColor={Colors.expense} stopOpacity="0.01" />
                </SvgLinearGradient>
              </Defs>
              {incomeAreaPath ? <Path d={incomeAreaPath} fill="url(#incomeGrad2)" /> : null}
              {expenseAreaPath ? <Path d={expenseAreaPath} fill="url(#expenseGrad2)" /> : null}
            </Svg>
          </Animated.View>

          {/* Animated Left-to-Right Drawing Lines Reveal */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: CHART_H,
              width: revealWidth,
              overflow: 'hidden',
            }}
          >
            <Svg width={chartWidth} height={CHART_H}>
              {incomeLinePath ? (
                <Path
                  d={incomeLinePath}
                  stroke={Colors.income}
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {expenseLinePath ? (
                <Path
                  d={expenseLinePath}
                  stroke={Colors.expense}
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </Animated.View>

          {/* Staggered Spring Data Points */}
          <Svg width={chartWidth} height={CHART_H} style={StyleSheet.absoluteFill} pointerEvents="none">
            {incomePoints.map((pt, i) => {
              const anim = dotAnims[i] || new Animated.Value(1);
              return (
                <Circle
                  key={`inc-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3.8}
                  fill={Colors.income}
                  stroke={Colors.surfaceCard}
                  strokeWidth={2}
                />
              );
            })}
            {expensePoints.map((pt, i) => {
              return (
                <Circle
                  key={`exp-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3.8}
                  fill={Colors.expense}
                  stroke={Colors.surfaceCard}
                  strokeWidth={2}
                />
              );
            })}

            {/* Interactive touch cursor: vertical dashed line & pulse rings */}
            {activeIncomePt && activeExpensePt && (
              <G>
                <Line
                  x1={activeIncomePt.x}
                  y1={CHART_PAD.top}
                  x2={activeIncomePt.x}
                  y2={baselineY}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                {/* Income point pulse ring */}
                <Circle
                  cx={activeIncomePt.x}
                  cy={activeIncomePt.y}
                  r={8}
                  fill={Colors.income}
                  opacity={0.25}
                />
                <Circle
                  cx={activeIncomePt.x}
                  cy={activeIncomePt.y}
                  r={4.5}
                  fill={Colors.income}
                  stroke="#FFFFFF"
                  strokeWidth={1.8}
                />
                {/* Expense point pulse ring */}
                <Circle
                  cx={activeExpensePt.x}
                  cy={activeExpensePt.y}
                  r={8}
                  fill={Colors.expense}
                  opacity={0.25}
                />
                <Circle
                  cx={activeExpensePt.x}
                  cy={activeExpensePt.y}
                  r={4.5}
                  fill={Colors.expense}
                  stroke="#FFFFFF"
                  strokeWidth={1.8}
                />
              </G>
            )}
          </Svg>
        </View>
      )}
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
    paddingBottom: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 24,
  },
  chartArea: {
    width: '100%',
    height: CHART_H,
    position: 'relative',
    marginTop: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  monthBadge: {
    backgroundColor: 'rgba(94, 106, 210, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.35)',
  },
  monthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  activeInspectRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inspectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectValue: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  emptyState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSubdued,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 200,
  },
});
