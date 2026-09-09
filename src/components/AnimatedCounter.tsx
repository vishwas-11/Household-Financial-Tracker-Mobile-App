// src/components/AnimatedCounter.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  decimals?: number;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  style,
  duration = 1200,
  decimals = 2,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
}) => {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const start = startRef.current;
    const end = value;
    const startTime = Date.now();
    startTimeRef.current = startTime;

    if (animRef.current) clearInterval(animRef.current);

    if (start === end) return;

    // Easing: easeOutExpo
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    animRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = start + (end - start) * eased;
      setDisplayed(current);
      startRef.current = current;

      if (progress >= 1) {
        setDisplayed(end);
        startRef.current = end;
        if (animRef.current) clearInterval(animRef.current);
      }
    }, 16);

    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [value, duration]);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(displayed));

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
    >
      {prefix}{formatted}{suffix}
    </Text>
  );
};
