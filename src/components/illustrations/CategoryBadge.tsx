import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { Category } from '../../types';
import { categoryPalette, radius } from '../../theme';

type Props = { category: Category; size?: number };

export function CategoryBadge({ category, size = 44 }: Props) {
  const palette = categoryPalette[category];
  return (
    <View style={{ width: size, height: size, borderRadius: radius.pill, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        {category === 'veg' && (
          <G fill={palette.fg}>
            <Path d="M12 3 Q14 6 12 8 Q10 6 12 3 Z" />
            <Circle cx="12" cy="14" r="7" />
            <Path d="M8 10 Q6 6 10 5" stroke={palette.fg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </G>
        )}
        {category === 'fruit' && (
          <G fill={palette.fg}>
            <Path d="M12 5 Q14 3 16 5" stroke={palette.fg} strokeWidth="1.5" fill="none" />
            <Circle cx="12" cy="14" r="7" />
            <Path d="M11 7 L13 7 L13 9 L11 9 Z" />
          </G>
        )}
        {category === 'grain' && (
          <G stroke={palette.fg} strokeWidth="1.8" strokeLinecap="round" fill="none">
            <Path d="M12 4 L12 20" />
            <Path d="M9 8 Q12 6 15 8" />
            <Path d="M9 12 Q12 10 15 12" />
            <Path d="M9 16 Q12 14 15 16" />
          </G>
        )}
        {category === 'turbhe' && (
          <G fill={palette.fg}>
            <Rect x="5" y="8" width="14" height="10" rx="2" />
            <Path d="M7 8 L7 6 L9 6 L9 8 M15 8 L15 6 L17 6 L17 8" stroke={palette.fg} strokeWidth="1.5" fill="none" />
            <Path d="M8 13 L10 13 M12 13 L14 13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </View>
  );
}
