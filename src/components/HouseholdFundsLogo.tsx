// src/components/HouseholdFundsLogo.tsx
// Vector SVG Logo faithfully converted from h_logo_1.png with Deep Navy / Midnight Blue accents
import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
  glow?: boolean;
}

export const HouseholdFundsLogo: React.FC<LogoProps> = ({
  size = 24,
  color,
  glow = true,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        {/* House Deep Navy to Royal Blue Gradient */}
        <LinearGradient id="hfHouseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#60A5FA" />
          <Stop offset="35%" stopColor="#3B82F6" />
          <Stop offset="70%" stopColor="#1D4ED8" />
          <Stop offset="100%" stopColor="#1E3A8A" />
        </LinearGradient>

        {/* Midnight Cutout / Bar Gradient */}
        <LinearGradient id="hfBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0B0F19" />
          <Stop offset="100%" stopColor="#07080A" />
        </LinearGradient>

        {/* Rupee Coin Gradient: Glowing Sky Cyan to Electric Indigo */}
        <LinearGradient id="hfCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#BAE6FD" />
          <Stop offset="50%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#818CF8" />
        </LinearGradient>

        {/* Inner Coin Highlight */}
        <LinearGradient id="hfCoinInner" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
        </LinearGradient>
      </Defs>

      {/* Main House Silhouette: Roof with Chimney & Base with Coin Cutout */}
      <Path
        d="
          M 47.8 16.5
          C 48.8 15.5 50.8 15.5 51.8 16.5
          L 58 22.5
          L 58 18.5
          C 58 17.5 58.8 17 59.8 17
          L 63.8 17
          C 64.8 17 65.5 17.8 65.5 18.8
          L 65.5 29.8
          L 78.5 42.2
          C 79.8 43.5 79 45.8 77.2 45.8
          L 71.5 45.8
          L 71.5 54.5
          C 69.2 53.8 66.8 53.5 64.2 53.5
          C 53.2 53.5 44.2 62.5 44.2 73.5
          C 44.2 76.5 44.8 79.4 46 82
          L 28.5 82
          C 25.8 82 24 80.2 24 77.5
          L 24 45.8
          L 18.2 45.8
          C 16.5 45.8 15.6 43.5 17 42.2
          Z
        "
        fill={color || 'url(#hfHouseGrad)'}
      />

      {/* 3 Ascending Financial Growth Bars */}
      <G>
        {/* Bar 1: Shortest */}
        <Rect
          x="28.5"
          y="63.5"
          width="5.5"
          height="14"
          rx="2.75"
          fill="url(#hfBarGrad)"
        />
        {/* Bar 2: Medium */}
        <Rect
          x="36.5"
          y="51"
          width="5.5"
          height="26.5"
          rx="2.75"
          fill="url(#hfBarGrad)"
        />
        {/* Bar 3: Tallest */}
        <Rect
          x="44.5"
          y="39"
          width="5.5"
          height="22"
          rx="2.75"
          fill="url(#hfBarGrad)"
        />
      </G>

      {/* Rupee Coin Badge */}
      <Circle
        cx="67"
        cy="71"
        r="16"
        fill="url(#hfCoinGrad)"
      />
      <Circle
        cx="67"
        cy="71"
        r="15.5"
        fill="none"
        stroke="#F0F9FF"
        strokeWidth="1"
        strokeOpacity="0.7"
      />

      {/* Rupee Glyph (₹) in Deep Midnight Blue */}
      <Path
        d="
          M 61 63.5 L 73 63.5
          M 61 67.2 L 71 67.2
          M 64.8 63.5 L 64.8 71.8
          M 64.8 67.2 C 68.8 67.2 70 69.4 70 71.5 C 70 73.8 68.2 75 64.8 75 L 63.5 75
          M 65 75 L 72.2 82.5
        "
        fill="none"
        stroke="#0F172A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
