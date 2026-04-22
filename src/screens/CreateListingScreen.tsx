import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import type { Commodity, QualityGrade } from '../types';
import { getCommodities } from '../api/client';
import { createListing } from '../api/marketplace';
import { emojiFor } from '../utils/icons';
import { track } from '../utils/analytics';

type Props = { onDone: () => void; onCancel: () => void };

export function CreateListingScreen({ onDone, onCancel }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const village = useSettings((s) => s.village);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commodity, setCommodity] = useState<Commodity | null>(null);
  const [quantity, setQuantity] = useState('');
  const [askPrice, setAskPrice] = useState('');
  const [grade, setGrade] = useState<QualityGrade>('standard');
  const [negotiable, setNegotiable] = useState(true);
  const [vill, setVill] = useState(village || '');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCommodities().then(setCommodities);
  }, []);

  const canSubmit = useMemo(
    () =>
      !!commodity &&
      !!quantity &&
      !!askPrice &&
      !!vill &&
      Number(quantity) > 0 &&
      Number(askPrice) > 0,
    [commodity, quantity, askPrice, vill],
  );

  const submit = async () => {
    if (!commodity) return;
    setSaving(true);
    try {
      await createListing({
        commodityId: commodity.id,
        quantityQtl: Number(quantity),
        qualityGrade: grade,
        askPrice: Number(askPrice),
        isNegotiable: negotiable,
        village: vill,
        district: district || undefined,
        notes: notes || undefined,
      });
      track('listing_created', { commodityId: commodity.id, askPrice: Number(askPrice) });
      Alert.alert('✓', 'Listing published');
      onDone();
    } catch (err: any) {
      Alert.alert('Error', String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t.tradeCreateListing}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Commodity">
          <Pressable style={styles.picker} onPress={() => setPicking(true)}>
            <Text style={styles.pickerText}>
              {commodity ? emojiFor(commodity.iconKey) + '  ' + commodity.name[lang] : 'Select crop…'}
            </Text>
            <Text style={styles.caret}>▾</Text>
          </Pressable>
        </Field>

        <Field label={t.tradeQuantity}>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="e.g. 20"
          />
        </Field>

        <Field label={t.tradeAskPrice}>
          <TextInput
            style={styles.input}
            value={askPrice}
            onChangeText={setAskPrice}
            keyboardType="number-pad"
            placeholder="e.g. 2200"
          />
        </Field>

        <Field label={t.tradeQuality}>
          <View style={styles.segmented}>
            {(
              [
                ['premium', t.tradeQualityPremium],
                ['standard', t.tradeQualityStandard],
                ['value', t.tradeQualityValue],
              ] as [QualityGrade, string][]
            ).map(([k, label]) => (
              <Pressable
                key={k}
                style={[styles.segment, grade === k && styles.segmentActive]}
                onPress={() => setGrade(k)}
              >
                <Text style={[styles.segmentText, grade === k && styles.segmentTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t.tradeNegotiable}</Text>
          <Switch value={negotiable} onValueChange={setNegotiable} />
        </View>

        <Field label={t.tradeVillage}>
          <TextInput style={styles.input} value={vill} onChangeText={setVill} />
        </Field>

        <Field label={t.tradeDistrict}>
          <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
        </Field>

        <Field label={t.tradeNotes}>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </Field>

        <Pressable
          style={[styles.cta, !canSubmit && { opacity: 0.4 }]}
          onPress={submit}
          disabled={!canSubmit || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t.tradePublish}</Text>}
        </Pressable>
      </ScrollView>

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => setPicking(false)} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Select crop</Text>
          </View>
          <FlatList
            data={commodities}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => (
              <Pressable
                style={styles.cropRow}
                onPress={() => {
                  setCommodity(item);
                  setPicking(false);
                }}
              >
                <Text style={{ fontSize: 28, width: 42 }}>{emojiFor(item.iconKey)}</Text>
                <Text style={styles.cropName}>{item.name[lang]}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 28 },
  title: { fontSize: font.lg, fontWeight: '700' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.md },
  fieldLabel: { color: colors.textMuted, fontSize: font.sm, marginBottom: spacing.xs, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.md,
    color: colors.text,
  },
  picker: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: { flex: 1, fontSize: font.md, color: colors.text },
  caret: { fontSize: font.md, color: colors.textMuted },
  segmented: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.textMuted, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  rowLabel: { color: colors.text, fontSize: font.md, fontWeight: '600' },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cropName: { fontSize: font.md, color: colors.text, flex: 1 },
});
