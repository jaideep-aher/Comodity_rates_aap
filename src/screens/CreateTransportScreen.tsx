import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { useDict } from '../store/settingsStore';
import { createTransportRequest } from '../api/marketplace';
import { track } from '../utils/analytics';

type Props = { onDone: () => void; onCancel: () => void };

export function CreateTransportScreen({ onDone, onCancel }: Props) {
  const t = useDict();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [quantity, setQuantity] = useState('');
  const [neededBy, setNeededBy] = useState(new Date().toISOString().slice(0, 10));
  const [maxBudget, setMaxBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit =
    fromCity.trim() && toCity.trim() && Number(quantity) > 0 && neededBy.length === 10;

  const submit = async () => {
    setSaving(true);
    try {
      await createTransportRequest({
        fromCity,
        toCity,
        quantityQtl: Number(quantity),
        neededBy,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        notes: notes || undefined,
      });
      track('transport_request_created', { fromCity, toCity, quantityQtl: Number(quantity) });
      Alert.alert('✓', 'Posted');
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
        <Text style={styles.title}>{t.transportCreateRequest}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Field label={t.transportFrom}>
          <TextInput style={styles.input} value={fromCity} onChangeText={setFromCity} placeholder="e.g. Nashik" />
        </Field>
        <Field label={t.transportTo}>
          <TextInput style={styles.input} value={toCity} onChangeText={setToCity} placeholder="e.g. Mumbai APMC" />
        </Field>
        <Field label={t.transportCapacity}>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        </Field>
        <Field label="Needed by (YYYY-MM-DD)">
          <TextInput style={styles.input} value={neededBy} onChangeText={setNeededBy} />
        </Field>
        <Field label="Max budget (₹)">
          <TextInput style={styles.input} value={maxBudget} onChangeText={setMaxBudget} keyboardType="number-pad" />
        </Field>
        <Field label={t.tradeNotes}>
          <TextInput style={[styles.input, { minHeight: 80 }]} value={notes} onChangeText={setNotes} multiline />
        </Field>
        <Pressable
          style={[styles.cta, !canSubmit && { opacity: 0.4 }]}
          onPress={submit}
          disabled={!canSubmit || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t.tradePublish}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
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
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
