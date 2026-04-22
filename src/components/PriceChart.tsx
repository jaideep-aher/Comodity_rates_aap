import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, font, radius, spacing } from '../theme';
import type { PriceSnapshot } from '../types';
import { formatRupees } from '../utils/format';

type Props = {
  data: PriceSnapshot[];
  height?: number;
};

export function PriceChart({ data, height = 180 }: Props) {
  const width = Dimensions.get('window').width - spacing.lg * 2 - spacing.lg * 2;
  const padTop = 12;
  const padBottom = 22;
  const padLeft = 44;
  const padRight = 8;

  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;

  const values = data.map((d) => d.avg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = chartW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: padTop + chartH - ((d.avg - min) / range) * chartH,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${path} L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  const yTicks = 3;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks);

  return (
    <View>
      <Svg width={width} height={height}>
        {ticks.map((t, i) => {
          const y = padTop + chartH - ((t - min) / range) * chartH;
          return (
            <React.Fragment key={i}>
              <Line
                x1={padLeft}
                x2={padLeft + chartW}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeDasharray="3,4"
                strokeWidth={1}
              />
              <SvgText
                x={padLeft - 6}
                y={y + 3}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {formatRupees(t)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Path d={area} fill={colors.primary} fillOpacity={0.1} />
        <Path
          d={path}
          stroke={colors.primary}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.xLabels}>
        <Text style={styles.xLabel}>{data[0]?.date.slice(5)}</Text>
        <Text style={styles.xLabel}>{data[Math.floor(data.length / 2)]?.date.slice(5)}</Text>
        <Text style={styles.xLabel}>{data[data.length - 1]?.date.slice(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -8,
  },
  xLabel: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
});
