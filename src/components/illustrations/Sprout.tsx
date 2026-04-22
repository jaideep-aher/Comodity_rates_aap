import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

type Props = { width?: number; height?: number };

// Sprout emerging from soil — friendly empty-state illustration.
export function Sprout({ width = 140, height = 140 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 140">
      {/* soil mound */}
      <Ellipse cx="70" cy="110" rx="54" ry="12" fill="#8B5E34" />
      <Ellipse cx="70" cy="108" rx="50" ry="8" fill="#A0764B" />
      {/* pebbles */}
      <Circle cx="40" cy="110" r="2.5" fill="#5C3E20" />
      <Circle cx="100" cy="112" r="2" fill="#5C3E20" />
      {/* stem */}
      <Path d="M70 108 Q68 80 70 50" stroke="#15803D" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* left leaf */}
      <G>
        <Path d="M70 75 Q45 60 38 75 Q52 82 70 78" fill="#22C55E" />
        <Path d="M45 72 Q55 75 68 77" stroke="#15803D" strokeWidth="1" fill="none" />
      </G>
      {/* right leaf */}
      <G>
        <Path d="M70 60 Q100 50 106 68 Q90 72 70 64" fill="#22C55E" />
        <Path d="M95 62 Q82 64 72 63" stroke="#15803D" strokeWidth="1" fill="none" />
      </G>
      {/* top bud */}
      <Circle cx="70" cy="46" r="6" fill="#84CC16" />
      <Circle cx="70" cy="46" r="3" fill="#A3E635" />
      {/* sparkles */}
      <Path d="M30 40 L30 48 M26 44 L34 44" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" />
      <Path d="M110 30 L110 36 M107 33 L113 33" stroke="#F5A524" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
