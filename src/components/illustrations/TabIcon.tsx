import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../../theme';

type Kind = 'home' | 'markets' | 'trade' | 'learn' | 'alerts' | 'profile';
type Props = { kind: Kind; focused: boolean; size?: number };

export function TabIcon({ kind, focused, size = 24 }: Props) {
  const stroke = focused ? colors.primary : colors.textMuted;
  const fill = focused ? colors.primary : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'home' && (
        <G stroke={stroke} strokeWidth="1.8" fill={fill === 'none' ? 'none' : colors.primarySoft} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 11 L12 3 L21 11 L21 20 A1 1 0 0 1 20 21 L15 21 L15 14 L9 14 L9 21 L4 21 A1 1 0 0 1 3 20 Z" />
        </G>
      )}
      {kind === 'markets' && (
        <G stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M3 20 L21 20" />
          <Path d="M6 16 L6 12" stroke={focused ? colors.primary : colors.textMuted} />
          <Path d="M11 16 L11 8" />
          <Path d="M16 16 L16 10" />
          <Path d="M5 10 L11 6 L16 8 L21 4" />
          <Circle cx="21" cy="4" r="1.2" fill={focused ? colors.primary : colors.textMuted} />
        </G>
      )}
      {kind === 'trade' && (
        <G stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M7 10 L4 13 L8 17 L11 14" />
          <Path d="M17 14 L20 11 L16 7 L13 10" />
          <Path d="M9 11 L15 11" />
          <Circle cx="6" cy="6" r="2" fill={focused ? colors.primary : 'none'} />
          <Circle cx="18" cy="18" r="2" fill={focused ? colors.primary : 'none'} />
        </G>
      )}
      {kind === 'learn' && (
        <G stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M3 6 L12 3 L21 6 L12 9 Z" fill={focused ? colors.primarySoft : 'none'} />
          <Path d="M6 8 L6 14 Q12 18 18 14 L18 8" />
          <Path d="M21 6 L21 12" />
        </G>
      )}
      {kind === 'alerts' && (
        <G stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M6 16 L18 16 L17 14 Q17 8 12 7 Q7 8 7 14 Z" fill={focused ? colors.primarySoft : 'none'} />
          <Path d="M10 19 Q12 21 14 19" />
          <Circle cx="18" cy="6" r="2.5" fill={colors.saffron} stroke={colors.saffron} />
        </G>
      )}
      {kind === 'profile' && (
        <G stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Circle cx="12" cy="8" r="4" fill={focused ? colors.primarySoft : 'none'} />
          <Path d="M4 21 Q4 14 12 14 Q20 14 20 21" />
        </G>
      )}
    </Svg>
  );
}
