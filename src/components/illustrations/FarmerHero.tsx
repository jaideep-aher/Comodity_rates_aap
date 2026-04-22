import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type Props = { width?: number; height?: number };

// Stylised farmer with a basket of produce & a morning sun.
// Flat-vector style (no gradients on skin), keeping the file small and crisp at any DPI.
export function FarmerHero({ width = 240, height = 200 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 200">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDE7D6" stopOpacity="1" />
          <Stop offset="1" stopColor="#F7F8F5" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C8E6C9" stopOpacity="1" />
          <Stop offset="1" stopColor="#A5D6A7" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* sky wash */}
      <Rect x="0" y="0" width="240" height="130" fill="url(#sky)" />
      {/* sun */}
      <Circle cx="50" cy="50" r="22" fill="#F5A524" />
      <Circle cx="50" cy="50" r="14" fill="#FBBF24" />
      {/* far hills */}
      <Path d="M0 110 Q40 80 80 100 T160 95 T240 105 V140 H0 Z" fill="#94C58B" />
      {/* near field */}
      <Path d="M0 135 Q60 115 120 130 T240 130 V200 H0 Z" fill="url(#field)" />
      {/* crop rows */}
      <G stroke="#6FA16A" strokeWidth="2" strokeLinecap="round">
        <Path d="M10 160 L230 160" />
        <Path d="M0 180 L240 180" />
      </G>

      {/* farmer */}
      <G>
        {/* turban */}
        <Path d="M115 78 Q130 60 150 72 Q158 78 150 86 L118 86 Z" fill="#E86A1D" />
        <Path d="M118 86 L150 86 L150 82 L118 82 Z" fill="#B85212" />
        {/* face */}
        <Ellipse cx="133" cy="96" rx="12" ry="14" fill="#E3A776" />
        {/* moustache */}
        <Path d="M125 103 Q133 107 141 103" stroke="#4A2C14" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <Circle cx="128" cy="95" r="1.5" fill="#1F1410" />
        <Circle cx="138" cy="95" r="1.5" fill="#1F1410" />
        {/* kurta */}
        <Path d="M110 110 Q133 104 156 110 L160 160 L108 160 Z" fill="#0B6E4F" />
        <Path d="M130 110 L133 160" stroke="#084E38" strokeWidth="2" fill="none" />
        {/* arms */}
        <Path d="M110 116 Q95 132 102 150" stroke="#0B6E4F" strokeWidth="10" strokeLinecap="round" fill="none" />
        <Path d="M156 116 Q170 132 162 150" stroke="#0B6E4F" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* hands */}
        <Circle cx="102" cy="150" r="5" fill="#E3A776" />
        <Circle cx="162" cy="150" r="5" fill="#E3A776" />
      </G>

      {/* basket with produce */}
      <G>
        <Path d="M82 152 L118 152 L114 178 L86 178 Z" fill="#B07B4A" />
        <Path d="M82 152 L118 152 L116 156 L84 156 Z" fill="#8B5E34" />
        {/* tomatoes */}
        <Circle cx="92" cy="148" r="7" fill="#DC2626" />
        <Circle cx="104" cy="146" r="7" fill="#DC2626" />
        <Circle cx="114" cy="150" r="6" fill="#F59E0B" />
        <Path d="M92 142 q2 -4 4 0" stroke="#15803D" strokeWidth="1.5" fill="none" />
        <Path d="M104 140 q2 -4 4 0" stroke="#15803D" strokeWidth="1.5" fill="none" />
      </G>

      {/* wheat sheaf in other hand */}
      <G transform="translate(156 136) rotate(20)">
        <Path d="M0 0 L0 -28" stroke="#A16207" strokeWidth="2" />
        <Path d="M-4 -20 Q0 -24 4 -20" stroke="#EAB308" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M-5 -14 Q0 -18 5 -14" stroke="#EAB308" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M-5 -8 Q0 -12 5 -8" stroke="#EAB308" strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
