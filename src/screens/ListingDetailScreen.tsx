import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import { getListing, sendInquiry } from '../api/marketplace';
import type { Listing } from '../types';
import { useAuth } from '../auth/authStore';
import { IS_REAL } from '../api/config';
import { formatRupees } from '../utils/format';
import { emojiFor } from '../utils/icons';
import { track } from '../utils/analytics';

type Props = { listingId: string; onBack: () => void };

export function ListingDetailScreen({ listingId, onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const isAuthed = useAuth((s) => !!s.token);
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [offer, setOffer] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getListing(listingId)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Not found.</Text></View>
      </SafeAreaView>
    );
  }

  const call = () => Linking.openURL(`tel:${item.seller.phone}`);
  const whatsapp = () =>
    Linking.openURL(`https://wa.me/${item.seller.phone.replace(/\D/g, '')}`);

  const submitInquiry = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await sendInquiry(item.id, msg, offer ? Number(offer) : undefined);
      track('listing_inquiry_sent', { listingId: item.id });
      Alert.alert('✓', 'Inquiry sent');
      setMsg('');
      setOffer('');
    } catch (err: any) {
      Alert.alert('Error', String(err?.message ?? err));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {item.commodity.name[lang]}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {item.photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.photos.map((p) => (
              <Image key={p} source={{ uri: p }} style={styles.photo} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={{ fontSize: 72 }}>{emojiFor(item.commodity.iconKey)}</Text>
          </View>
        )}

        <View style={styles.headerCard}>
          <Text style={styles.price}>{formatRupees(item.askPrice)}/q</Text>
          <Text style={styles.meta}>
            {item.quantityQtl} quintal · {item.qualityGrade}
            {item.isNegotiable ? ' · Negotiable' : ' · Fixed'}
          </Text>
        </View>

        <Section title="Location">
          <Text style={styles.body}>
            {item.location.village}
            {item.location.taluka ? ', ' + item.location.taluka : ''}
            {item.location.district ? ', ' + item.location.district : ''}
          </Text>
          <Text style={styles.muted}>Ready from {item.readyFrom}</Text>
        </Section>

        {item.notes ? (
          <Section title={t.tradeNotes}>
            <Text style={styles.body}>{item.notes}</Text>
          </Section>
        ) : null}

        <Section title={t.tradeContactSeller}>
          <Text style={styles.body}>{item.seller.name ?? item.seller.phone}</Text>
          <View style={styles.contactRow}>
            <Pressable style={[styles.contactBtn, { flex: 1 }]} onPress={call}>
              <Text style={styles.contactText}>📞 Call</Text>
            </Pressable>
            <Pressable style={[styles.contactBtn, { flex: 1, backgroundColor: '#25D366' }]} onPress={whatsapp}>
              <Text style={[styles.contactText, { color: '#fff' }]}>WhatsApp</Text>
            </Pressable>
          </View>
        </Section>

        {isAuthed || !IS_REAL ? (
          <Section title={t.tradeInquireTitle}>
            <TextInput
              style={styles.input}
              placeholder={t.tradeInquireMessage}
              value={msg}
              onChangeText={setMsg}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder={t.tradeOfferPrice}
              keyboardType="number-pad"
              value={offer}
              onChangeText={setOffer}
            />
            <Pressable style={styles.cta} onPress={submitInquiry} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t.tradeSendInquiry}</Text>}
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 28 },
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text, flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: 240, height: 180, borderRadius: radius.md, marginRight: spacing.sm },
  placeholder: {
    height: 180,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  price: { fontSize: font.xxl, fontWeight: '800', color: colors.primaryDark },
  meta: { color: colors.textMuted, marginTop: spacing.xs },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  body: { color: colors.text, fontSize: font.md },
  muted: { color: colors.textMuted, fontSize: font.sm, marginTop: spacing.xs },
  contactRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  contactBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  contactText: { color: colors.primaryDark, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
