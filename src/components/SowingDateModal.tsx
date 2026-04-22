import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { localiseNumber } from '../utils/format';
import { lifecycleFor } from '../data/cropStages';
import { varietiesFor } from '../data/varieties';

type Props = {
  visible: boolean;
  iconKey: string;
  initial?: string | null;
  initialVariety?: string | null;
  onClose: () => void;
  // Callers can consume just the ISO date (legacy) or the tuple — extra arg
  // is ignored by old handlers.
  onSave: (isoDate: string | null, variety?: string | null) => void;
};

// Minimal, offline-safe date picker: horizontal "days ago" scroller + a quick
// chip for "today". Avoids platform-dependent DateTimePicker during Stage 5.
export function SowingDateModal({
  visible,
  iconKey,
  initial,
  initialVariety,
  onClose,
  onSave,
}: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const lifecycle = lifecycleFor(iconKey);
  const varieties = varietiesFor(iconKey);
  const [selected, setSelected] = useState<string | null>(initial ?? null);
  const [variety, setVariety] = useState<string | null>(initialVariety ?? null);

  // Build a list of candidate dates: today back to today - totalDays - 20.
  // Enough coverage to enter "already harvested" timing too.
  const options = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    const monthsMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = lang === 'mr' ? monthsMr : monthsEn;
    const total = Math.min(180, lifecycle.totalDays + 30);
    for (let i = 0; i <= total; i += 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        iso,
        label: `${localiseNumber(d.getDate(), nLang)} ${months[d.getMonth()]}`,
      });
    }
    return out;
  }, [lang, nLang, lifecycle.totalDays]);

  const save = () => {
    onSave(selected, variety);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t.sowingPromptTitle}</Text>
          <Text style={styles.body}>{t.sowingPromptBody}</Text>

          <Pressable
            onPress={() => setSelected(options[0].iso)}
            style={[styles.todayChip, selected === options[0].iso && styles.todayChipActive]}
          >
            <Text
              style={[
                styles.todayText,
                selected === options[0].iso && styles.todayTextActive,
              ]}
            >
              {lang === 'mr' ? '📅  आज लावले' : '📅  Planted today'}
            </Text>
          </Pressable>

          <Text style={styles.section}>
            {lang === 'mr' ? 'किंवा निवडा (दिवसांपूर्वी)' : 'Or pick (days ago)'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {options.map((o, i) => {
              const active = selected === o.iso;
              return (
                <Pressable
                  key={o.iso}
                  onPress={() => setSelected(o.iso)}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                >
                  <Text
                    style={[styles.dateLabel, active && styles.dateLabelActive]}
                  >
                    {o.label}
                  </Text>
                  <Text
                    style={[styles.dateDays, active && styles.dateDaysActive]}
                  >
                    {i === 0
                      ? lang === 'mr' ? 'आज' : 'today'
                      : lang === 'mr'
                        ? `${localiseNumber(i, nLang)} दिवस`
                        : `${i} d ago`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {varieties.length > 0 && (
            <>
              <Text style={styles.section}>
                🌿  {lang === 'mr' ? 'वाण निवडा (ऐच्छिक)' : 'Variety (optional)'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRow}
              >
                {[{ id: null, name: { mr: 'कोणतेही', en: 'Skip' }, blurb: { mr: '', en: '' } }, ...varieties].map((v) => {
                  const active = variety === v.id;
                  return (
                    <Pressable
                      key={v.id ?? 'none'}
                      onPress={() => setVariety(v.id)}
                      style={[styles.varietyChip, active && styles.varietyChipActive]}
                    >
                      <Text
                        style={[styles.dateLabel, active && styles.dateLabelActive]}
                      >
                        {v.name[lang]}
                      </Text>
                      {!!v.blurb[lang] && (
                        <Text
                          style={[styles.dateDays, active && styles.dateDaysActive]}
                          numberOfLines={2}
                        >
                          {v.blurb[lang]}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => {
                onSave(null, null);
                onClose();
              }}
            >
              <Text style={styles.btnGhostText}>{t.sowingNotPlanted}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, !selected && styles.btnDisabled]}
              onPress={save}
              disabled={!selected}
            >
              <Text style={styles.btnPrimaryText}>{t.save}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  body: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 20 },
  todayChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  todayChipActive: { backgroundColor: colors.primary, ...shadow.pop },
  todayText: { fontSize: font.md, fontWeight: '800', color: colors.primaryDark },
  todayTextActive: { color: '#fff' },
  section: {
    marginTop: spacing.md,
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: { gap: 6, paddingVertical: spacing.sm, paddingRight: spacing.md },
  dateChip: {
    minWidth: 70,
    alignItems: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  varietyChip: {
    minWidth: 160,
    maxWidth: 200,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 2,
  },
  varietyChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  dateLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  dateLabelActive: { color: colors.primaryDark },
  dateDays: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  dateDaysActive: { color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary, ...shadow.pop },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnGhost: { backgroundColor: colors.bgAlt },
  btnGhostText: { color: colors.text, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
});
