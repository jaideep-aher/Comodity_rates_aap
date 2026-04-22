import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

export type WeatherKind = 'sunny' | 'cloudy' | 'partly' | 'rain' | 'storm' | 'hot';

type Props = { kind: WeatherKind; size?: number };

export function WeatherGlyph({ kind, size = 56 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {kind === 'sunny' && <SunnyArt />}
      {kind === 'cloudy' && <CloudyArt />}
      {kind === 'partly' && <PartlyArt />}
      {kind === 'rain' && <RainArt />}
      {kind === 'storm' && <StormArt />}
      {kind === 'hot' && <HotArt />}
    </Svg>
  );
}

function SunnyArt() {
  return (
    <G>
      <Circle cx="32" cy="32" r="12" fill="#F5A524" />
      <G stroke="#F5A524" strokeWidth="3" strokeLinecap="round">
        <Path d="M32 6 L32 14" />
        <Path d="M32 50 L32 58" />
        <Path d="M6 32 L14 32" />
        <Path d="M50 32 L58 32" />
        <Path d="M14 14 L19 19" />
        <Path d="M45 45 L50 50" />
        <Path d="M14 50 L19 45" />
        <Path d="M45 19 L50 14" />
      </G>
    </G>
  );
}
function CloudyArt() {
  return (
    <G>
      <Path d="M14 40 Q14 30 24 30 Q26 22 36 24 Q48 24 48 34 Q56 36 54 44 L16 44 Q12 44 14 40 Z" fill="#94A3B8" />
    </G>
  );
}
function PartlyArt() {
  return (
    <G>
      <Circle cx="44" cy="22" r="9" fill="#F5A524" />
      <Path d="M10 42 Q10 32 20 32 Q22 24 32 26 Q44 26 44 36 Q52 38 50 46 L12 46 Q8 46 10 42 Z" fill="#CBD5E1" />
    </G>
  );
}
function RainArt() {
  return (
    <G>
      <Path d="M12 34 Q12 24 22 24 Q24 16 34 18 Q46 18 46 28 Q54 30 52 38 L14 38 Q10 38 12 34 Z" fill="#64748B" />
      <G stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round">
        <Path d="M22 44 L18 52" />
        <Path d="M32 44 L28 52" />
        <Path d="M42 44 L38 52" />
      </G>
    </G>
  );
}
function StormArt() {
  return (
    <G>
      <Path d="M12 30 Q12 20 22 20 Q24 12 34 14 Q46 14 46 24 Q54 26 52 34 L14 34 Q10 34 12 30 Z" fill="#475569" />
      <Path d="M28 36 L22 48 L30 48 L24 58 L38 42 L30 42 L34 36 Z" fill="#F5A524" />
    </G>
  );
}
function HotArt() {
  return (
    <G>
      <Circle cx="32" cy="28" r="14" fill="#EF4444" />
      <G stroke="#F97316" strokeWidth="3" strokeLinecap="round">
        <Path d="M32 6 L32 12" />
        <Path d="M8 28 L14 28" />
        <Path d="M50 28 L56 28" />
      </G>
      <Path d="M22 46 Q26 50 32 46 Q38 42 42 46 Q46 50 52 48" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M14 56 Q18 60 24 56 Q30 52 36 56 Q40 60 46 58" stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </G>
  );
}
