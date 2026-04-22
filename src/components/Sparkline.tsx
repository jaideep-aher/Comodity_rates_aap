import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
};

export function Sparkline({ data, width = 90, height = 32, color, fill = true }: Props) {
  if (!data || data.length < 2) {
    return <Svg width={width} height={height} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;

  const trendColor = color ?? (data[data.length - 1] >= data[0] ? colors.up : colors.down);

  return (
    <Svg width={width} height={height}>
      {fill && <Path d={area} fill={trendColor} fillOpacity={0.12} />}
      <Path d={d} stroke={trendColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={trendColor}
      />
    </Svg>
  );
}
