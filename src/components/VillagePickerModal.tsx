import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import { VILLAGES, nearestVillage, findVillageByPincode, type Village } from '../data/villages';
import { useLocation } from '../store/locationStore';
import { getCurrentCoords, isLocationAvailable, reversePincode } from '../utils/location';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function VillagePickerModal({ visible, onClose }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const current = useLocation((s) => s.villageId);
  const setVillage = useLocation((s) => s.setVillage);
  const setGps = useLocation((s) => s.setGps);
  const clearGps = useLocation((s) => s.clearGps);

  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VILLAGES;
    // Pincode-only queries: try coarse pincode lookup first.
    if (/^\d{3,6}$/.test(q)) {
      const pin = findVillageByPincode(q);
      return pin ? [pin, ...VILLAGES.filter((v) => v.id !== pin.id)] : VILLAGES;
    }
    return VILLAGES.filter(
      (v) =>
        v.name.en.toLowerCase().includes(q) ||
        v.name.mr.includes(q) ||
        v.district.en.toLowerCase().includes(q) ||
        v.district.mr.includes(q) ||
        v.taluka.toLowerCase().includes(q),
    );
  }, [query]);

  const useGps = async () => {
    if (!isLocationAvailable()) return;
    setDetecting(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) return;
      setGps(coords.lat, coords.lng);
      const pin = await reversePincode(coords);
      const byPin = pin ? findVillageByPincode(pin) : null;
      const picked: Village = byPin ?? nearestVillage(coords.lat, coords.lng);
      setVillage(picked.id);
      onClose();
    } finally {
      setDetecting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>📍 {t.villagePickerTitle}</Text>
          <Text style={styles.body}>{t.villagePickerSub}</Text>

          {isLocationAvailable() && (
            <Pressable style={styles.gpsBtn} onPress={useGps} disabled={detecting}>
              {detecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.gpsText}>📡  {t.villageUseGps}</Text>
              )}
            </Pressable>
          )}

          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={t.villageSearchPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />

          <ScrollView
            style={{ maxHeight: 340 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.md }}
          >
            {filtered.map((v) => {
              const active = v.id === current;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    setVillage(v.id);
                    clearGps();
                    onClose();
                  }}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>
                      {v.name[lang]}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {v.district[lang]} · {v.pincode}
                    </Text>
                  </View>
                  {active && <Text style={styles.rowTick}>✓</Text>}
                </Pressable>
              );
            })}
            {filtered.length === 0 && (
              <Text style={styles.empty}>
                {lang === 'mr' ? 'गाव सापडले नाही' : 'No match'}
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    marginBottom: 4,
  },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  body: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
  gpsBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.pop,
  },
  gpsText: { color: '#fff', fontWeight: '800', fontSize: font.md },
  search: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: font.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    marginTop: 6,
  },
  rowActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  rowTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  rowTitleActive: { color: colors.primaryDark },
  rowMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  rowTick: { fontSize: 20, color: colors.primary, fontWeight: '800' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.md },
});
