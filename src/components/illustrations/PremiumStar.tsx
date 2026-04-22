import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = { size?: number };

export function PremiumStar({ size = 120 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBBF24" />
          <Stop offset="1" stopColor="#E86A1D" />
        </LinearGradient>
      </Defs>
      <Circle cx="60" cy="60" r="56" fill="#FEF3C7" />
      <Circle cx="60" cy="60" r="44" fill="#FDE68A" />
      <Path
        d="M60 26 L70 52 L98 54 L76 72 L84 98 L60 84 L36 98 L44 72 L22 54 L50 52 Z"
        fill="url(#gold)"
        stroke="#92400E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <G fill="#FEF3C7" opacity="0.9">
        <Path d="M12 20 L14 24 L18 26 L14 28 L12 32 L10 28 L6 26 L10 24 Z" />
        <Path d="M104 88 L106 92 L110 94 L106 96 L104 100 L102 96 L98 94 L102 92 Z" />
      </G>
    </Svg>
  );
}
