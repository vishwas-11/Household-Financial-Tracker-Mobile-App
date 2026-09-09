// src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { Colors } from '../constants/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: Colors.surfaceHighlight, opacity }, style]}
    />
  );
};

// Preset skeleton layouts
export const DashboardSkeleton: React.FC = () => (
  <View style={{ padding: 18, gap: 16 }}>
    {/* Hero card skeleton */}
    <SkeletonLoader height={180} borderRadius={20} />
    {/* Quick actions */}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <SkeletonLoader height={44} borderRadius={10} style={{ flex: 1 }} />
      <SkeletonLoader height={44} borderRadius={10} style={{ flex: 1 }} />
      <SkeletonLoader height={44} borderRadius={10} style={{ flex: 1 }} />
    </View>
    {/* Chart area */}
    <SkeletonLoader height={160} borderRadius={16} />
    {/* Transaction rows */}
    {[0,1,2,3].map(i => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonLoader height={13} width="65%" borderRadius={6} />
          <SkeletonLoader height={11} width="40%" borderRadius={6} />
        </View>
        <SkeletonLoader width={60} height={13} borderRadius={6} />
      </View>
    ))}
  </View>
);
