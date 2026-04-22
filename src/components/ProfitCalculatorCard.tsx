import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useNumeralLang, useSettings } from '../store/settingsStore';
import { formatRupees } from '../utils/format';

type Props = {
  pricePerQtl: number;
  defaults?: { area?: number; yield?: number; cost?: number };
};

// Simple profit calculator. Local-only — nothing leaves the device.
// Numbers are keyed in Latin digits (standard numeric keyboard) but
// displayed Devanagari if the user prefers.
export function ProfitCalculatorCard({ pricePerQtl, defaults }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();

  const [area, setArea] = useState(String(defaults?.area ?? 1));
  const [yieldQtl, setYieldQtl] = useState(String(defaults?.yield ?? 40));
  const [cost, setCost] = useState(String(defaults?.cost ?? 25000));

  const { revenue, profit } = useMemo(() => {
    const a = parseFloat(area) || 0;
    const y = parseFloat(yieldQtl) || 0;
    const c = parseFloat(cost) || 0;
    const rev = a * y * pricePerQtl;
    const pr = rev - a * c;
    return { revenue: rev, profit: pr };
  }, [area, yieldQtl, cost, pricePerQtl]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.detailCalculatorTitle}</Text>
      <Text style={styles.sub}>{t.detailCalculatorUnit}</Text>

      <Field
        label={t.detailCalculatorArea}
        value={area}
        onChange={setArea}
      />
      <Field
        label={t.detailCalculatorYield}
        value={yieldQtl}
        onChange={setYieldQtl}
      />
      <Field
        label={t.detailCalculatorCost}
        value={cost}
        onChange={setCost}
      />

      <View style={styles.results}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{t.detailCalculatorEstRevenue}</Text>
          <Text style={styles.resultValue}>{formatRupees(revenue, nLang)}</Text>
        </View>
        <View style={[styles.resultRow, styles.resultRowHighlight, { backgroundColor: profit >= 0 ? colors.upBg : colors.downBg }]}>
          <Text style={[styles.resultLabel, { color: profit >= 0 ? colors.up : colors.down, fontWeight: '700' }]}>
            {t.detailCalculatorEstProfit}
          </Text>
          <Text style={[styles.resultValue, { color: profit >= 0 ? colors.up : colors.down }]}>
            {formatRupees(profit, nLang)}
          </Text>
        </View>
      </View>
      <Text style={styles.tip}>
        {lang === 'mr'
          ? 'सूत्र: क्षेत्र × उत्पादन × भाव − (क्षेत्र × खर्च).'
          : 'Formula: area × yield × price − (area × cost).'}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textSubtle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  title: { fontSize: font.md, fontWeight: '700', color: colors.text },
  sub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontSize: font.xs, color: colors.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  results: { marginTop: spacing.md, gap: 6 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  resultRowHighlight: {},
  resultLabel: { fontSize: font.sm, color: colors.text },
  resultValue: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  tip: { marginTop: spacing.sm, fontSize: font.xs, color: colors.textSubtle },
});
