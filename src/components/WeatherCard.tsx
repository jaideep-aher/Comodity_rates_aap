import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useNumeralLang, useSettings } from '../store/settingsStore';
import { WeatherGlyph } from './illustrations/WeatherGlyph';
import { getWeather } from '../data/weather';
import { TODAY_ISO } from '../data/mockData';
import { localiseNumber } from '../utils/format';
import { useWatchlist } from '../store/watchlistStore';
import { COMMODITIES } from '../data/commodities';
import { evaluateAllActions, heatStressFor } from '../utils/advisor';
import { TtsButton } from './TtsButton';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { useLocation, activeVillage } from '../store/locationStore';
import { requestLocation } from '../utils/location';

type Props = { onPress?: () => void };

const MONTHS_MR = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_MR = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeatherCard({ onPress }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const watchIds = useWatchlist((s) => s.ids);
  const villageId = useLocation((s) => s.villageId);
  const permission = useLocation((s) => s.permission);
  const setPermission = useLocation((s) => s.setPermission);
  const setGps = useLocation((s) => s.setGps);
  const live = useLiveWeather();

  // If we don't have location yet, show a compact CTA instead of fake weather
  // for a default village. Tapping the tile prompts the OS permission dialog.
  // After "denied" we keep the tile but compress it further.
  if (permission !== 'granted') {
    const onEnable = async () => {
      const res = await requestLocation();
      if (res.status === 'granted' && res.coords) {
        setGps(res.coords.lat, res.coords.lng);
        setPermission('granted');
      } else if (res.status === 'denied') {
        setPermission('denied');
      }
    };
    const isDenied = permission === 'denied';
    return (
      <Pressable
        style={[styles.wrap, styles.gateWrap, isDenied && styles.gateWrapDenied]}
        onPress={onEnable}
      >
        <View style={styles.gateRow}>
          <View style={styles.gateIcon}>
            <Text style={styles.gateIconText}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gateTitle}>
              {lang === 'mr' ? 'हवामान पाहण्यासाठी' : 'See your local weather'}
            </Text>
            <Text style={styles.gateBody}>
              {isDenied
                ? lang === 'mr'
                  ? 'सेटिंग्जमधून लोकेशन परवानगी द्या'
                  : 'Enable location in Settings to see live weather'
                : lang === 'mr'
                  ? 'टॅप करून लोकेशन परवानगी द्या'
                  : 'Tap to share your location'}
            </Text>
          </View>
          <Text style={styles.gateChev}>›</Text>
        </View>
      </Pressable>
    );
  }

  const days = live.days.length > 0 ? live.days : getWeather(TODAY_ISO);
  if (days.length === 0) return null;
  const today = days[0];
  const rest = days.slice(1);
  const village = activeVillage({ villageId });

  // Pick up to 3 distinct iconKeys from watchlist for heat-stress chips.
  const watchedIcons = Array.from(
    new Set(
      watchIds
        .map((id) => COMMODITIES.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => c.iconKey),
    ),
  ).slice(0, 3);

  const heatChips = watchedIcons.map((key) => {
    const c = COMMODITIES.find((x) => x.iconKey === key);
    const stress = heatStressFor(key, today.tempMaxC);
    return { icon: key, name: c?.name ?? { mr: '', en: '' }, stress };
  });

  // Pre-compose the TTS / share text so both controls speak identically.
  const actionVerdict = evaluateAllActions(today, rest, watchedIcons[0] ?? null);
  const spoken = [
    `${t.homeWeatherToday} — ${today.label[lang]}.`,
    `${localiseNumber(today.tempMaxC, nLang)}° / ${localiseNumber(today.tempMinC, nLang)}°C.`,
    today.advice[lang],
    actionVerdict[0]?.reason[lang] ?? '',
  ].join(' ');

  const onShare = () => {
    Share.share({
      message: [
        `🌤️ ${t.homeWeatherToday} — ${today.label[lang]}`,
        `${today.tempMaxC}° / ${today.tempMinC}°C · ${t.priceMin}: 💧 ${today.rainChance}%`,
        today.advice[lang],
        '— बाजारभाव ॲप',
      ].join('\n'),
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.96 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <WeatherGlyph kind={today.kind} size={64} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.homeWeatherToday}</Text>
          <Text style={styles.label}>{today.label[lang]}</Text>
          <Text style={styles.temp}>
            {localiseNumber(today.tempMaxC, nLang)}° / {localiseNumber(today.tempMinC, nLang)}°C
            <Text style={styles.rain}>
              {'   '}💧 {localiseNumber(today.rainChance, nLang)}%
              {'   '}💨 {localiseNumber(today.windKph, nLang)}
            </Text>
          </Text>
        </View>
        <View style={styles.topActions}>
          <TtsButton text={spoken} compact />
          <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={8}>
            <Text style={styles.shareIcon}>📤</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          📍 {village.name[lang]}
        </Text>
        <View
          style={[
            styles.liveDot,
            { backgroundColor: live.isLive ? colors.up : colors.warning },
          ]}
        />
        <Text style={styles.metaText}>
          {live.loading
            ? t.weatherLoading
            : live.isLive
              ? t.weatherLive
              : t.weatherOffline}
        </Text>
      </View>

      <Text style={styles.advice}>{today.advice[lang]}</Text>

      {heatChips.length > 0 && (
        <View style={styles.stressHeader}>
          <Text style={styles.stressTitle}>{t.heatStressTitle}</Text>
        </View>
      )}
      {heatChips.length > 0 && (
        <View style={styles.stressRow}>
          {heatChips.map((h) => (
            <View key={h.icon} style={styles.stressChip}>
              <Text style={styles.stressEmoji}>{h.stress.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stressName} numberOfLines={1}>
                  {h.name[lang]}
                </Text>
                <Text style={styles.stressLabel} numberOfLines={1}>
                  {h.stress.label[lang]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.forecastLabel}>{t.homeForecastNextDays}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.forecastRow}
      >
        {rest.map((d, i) => {
          const forecast = evaluateAllActions(d, rest.slice(i + 1), watchedIcons[0] ?? null);
          // Pick the most actionable single tag for the tile: prefer "avoid"
          // warnings, then "warn", else show the first OK.
          const hero =
            forecast.find((a) => a.verdict === 'avoid') ??
            forecast.find((a) => a.verdict === 'warn') ??
            forecast[0];
          const tagColor =
            hero.verdict === 'avoid'
              ? colors.down
              : hero.verdict === 'warn'
                ? colors.warning
                : colors.up;
          return (
            <View key={d.date} style={styles.dayChip}>
              <Text style={styles.dayLabel}>{formatTile(d.date, lang, nLang)}</Text>
              <WeatherGlyph kind={d.kind} size={36} />
              <Text style={styles.dayTemp}>
                {localiseNumber(d.tempMaxC, nLang)}° · {localiseNumber(d.tempMinC, nLang)}°
              </Text>
              <Text style={styles.dayRain}>
                💧 {localiseNumber(d.rainChance, nLang)}%
              </Text>
              <View style={[styles.dayTag, { backgroundColor: tagColor + '22' }]}>
                <Text style={[styles.dayTagText, { color: tagColor }]}>
                  {hero.emoji}{' '}
                  {hero.verdict === 'ok'
                    ? t.verdictOk
                    : hero.verdict === 'warn'
                      ? t.verdictWarn
                      : t.verdictAvoid}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Pressable>
  );
}

function formatTile(iso: string, lang: 'mr' | 'en', nLang: 'mr' | 'en'): string {
  const d = new Date(iso + 'T00:00:00');
  const months = lang === 'mr' ? MONTHS_MR : MONTHS_EN;
  const weekdays = lang === 'mr' ? WEEK_MR : WEEK_EN;
  return `${weekdays[d.getDay()]}  ${localiseNumber(d.getDate(), nLang)} ${months[d.getMonth()]}`;
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 68, height: 68, borderRadius: radius.lg, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: font.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: font.md, color: colors.text, fontWeight: '600', marginTop: 2 },
  temp: { fontSize: font.lg, color: colors.text, fontWeight: '800', marginTop: 2 },
  rain: { fontSize: font.sm, color: colors.sky, fontWeight: '600' },
  topActions: { gap: 6, alignItems: 'flex-end' },
  shareBtn: {
    width: 36, height: 36, borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { fontSize: 16 },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  advice: {
    marginTop: spacing.sm,
    fontSize: font.sm,
    color: colors.text,
    lineHeight: 20,
  },

  stressHeader: { marginTop: spacing.md, marginBottom: 4 },
  stressTitle: {
    fontSize: font.xs, color: colors.textMuted, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  stressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stressChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.pill, minWidth: 120, flexGrow: 1, flexShrink: 1, flexBasis: 140,
  },
  stressEmoji: { fontSize: 14 },
  stressName: { fontSize: font.xs, fontWeight: '700', color: colors.text },
  stressLabel: { fontSize: 10, color: colors.textMuted },

  forecastLabel: {
    marginTop: spacing.md, fontSize: font.xs, color: colors.textMuted,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  forecastRow: { paddingVertical: spacing.sm, gap: spacing.sm, paddingRight: spacing.md },
  dayChip: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 86,
    gap: 2,
  },
  dayLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },
  dayTemp: { fontSize: font.sm, fontWeight: '700', color: colors.text, marginTop: 2 },
  dayRain: { fontSize: 10, color: colors.sky },
  dayTag: {
    marginTop: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dayTagText: { fontSize: 10, fontWeight: '800' },

  // Permission-gate tile (shown instead of full weather card until location
  // is granted). Compact, single-row, tappable.
  gateWrap: {
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  gateWrapDenied: {
    backgroundColor: colors.flatBg,
    opacity: 0.85,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateIconText: { fontSize: 22 },
  gateTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  gateBody: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  gateChev: { fontSize: 28, color: colors.primary, fontWeight: '300' },
});
