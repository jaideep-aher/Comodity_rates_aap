import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useNumeralLang } from '../store/settingsStore';
import { getWeather } from '../data/weather';
import { TODAY_ISO } from '../data/mockData';
import { localiseNumber } from '../utils/format';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { useLocation } from '../store/locationStore';

// Shows the next 12 hours of rain probability as a row of emoji + filled bars.
// Meant to answer: "will it rain, and if so, when?" in one glance.
export function RainRadarStrip() {
  const t = useDict();
  const nLang = useNumeralLang();
  const live = useLiveWeather();
  const permission = useLocation((s) => s.permission);
  // Hide rain radar entirely until the user grants location — we don't want
  // to show fake mock data masquerading as their forecast.
  if (permission !== 'granted') return null;
  const days = live.days.length > 0 ? live.days : getWeather(TODAY_ISO);
  if (days.length === 0) return null;
  const pct = days[0].hourlyRainPct;
  if (!pct || pct.length === 0) return null;

  // Skip render entirely on a completely dry day — no visual noise.
  const totalRain = pct.reduce((s, v) => s + v, 0);
  if (totalRain < 20) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>🌧️  {t.rainRadarTitle}</Text>
        <Text style={styles.sub}>{t.rainRadarSubtitle}</Text>
      </View>
      <View style={styles.row}>
        {pct.map((p, i) => {
          const glyph = p >= 70 ? '⛈️' : p >= 40 ? '🌧️' : p >= 15 ? '⛅' : '☀️';
          const fill = Math.max(4, p);
          return (
            <View key={i} style={styles.col}>
              <Text style={styles.glyph}>{glyph}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${fill}%`,
                      backgroundColor:
                        p >= 70 ? colors.indigo : p >= 40 ? colors.sky : colors.skySoft,
                    },
                  ]}
                />
              </View>
              <Text style={styles.pctText}>{localiseNumber(p, nLang)}%</Text>
              <Text style={styles.hourText}>
                {i === 0 ? (nLang === 'mr' ? 'आता' : 'now') : `+${localiseNumber(i, nLang)}`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.skySoft,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  header: { marginBottom: spacing.sm },
  title: { fontSize: font.md, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  glyph: { fontSize: 16 },
  barTrack: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: radius.sm },
  pctText: { fontSize: 10, fontWeight: '700', color: colors.indigo },
  hourText: { fontSize: 10, color: colors.textMuted },
});
