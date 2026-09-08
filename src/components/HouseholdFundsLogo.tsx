// src/components/HouseholdFundsLogo.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

export const HouseholdFundsLogo: React.FC<LogoProps> = ({ size = 20, color = '#ffffff' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 13.5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
