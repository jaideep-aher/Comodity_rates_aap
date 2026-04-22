import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict } from '../store/settingsStore';
import {
  browseBuyers,
  browseListings,
  browseTransportOffers,
  browseTransportRequests,
} from '../api/marketplace';
import type { BuyerProfile, Listing, TransportOffer, TransportRequest } from '../types';
import { ListingCard } from '../components/ListingCard';
import { formatRupees } from '../utils/format';
import { track } from '../utils/analytics';

type Tab = 'listings' | 'buyers' | 'transport';

type Props = {
  onOpenListing: (id: string) => void;
  onCreateListing: () => void;
  onCreateTransportRequest: () => void;
};

export function MarketplaceScreen({
  onOpenListing,
  onCreateListing,
  onCreateTransportRequest,
}: Props) {
  const t = useDict();
  const [tab, setTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'listings') setListings(await browseListings({ limit: 40 }));
      else if (tab === 'buyers') setBuyers(await browseBuyers({}));
      else {
        const [o, r] = await Promise.all([browseTransportOffers(), browseTransportRequests()]);
        setOffers(o);
        setRequests(r);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    track('marketplace_tab_view', { tab });
  }, [tab]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.tradeTitle}</Text>
      </View>

      <View style={styles.tabsRow}>
        {(['listings', 'buyers', 'transport'] as Tab[]).map((k) => (
          <Pressable key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>
              {k === 'listings' ? t.tradeListings : k === 'buyers' ? t.tradeBuyers : t.tradeTransport}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : tab === 'listings' ? (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => (
            <ListingCard item={item} onPress={() => onOpenListing(item.id)} />
          )}
          ListEmptyComponent={<EmptyState text={t.tradeEmptyListings} />}
          contentContainerStyle={styles.list}
        />
      ) : tab === 'buyers' ? (
        <FlatList
          data={buyers}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BuyerCard item={item} />}
          ListEmptyComponent={<EmptyState text="No buyers listed yet." />}
          contentContainerStyle={styles.list}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <SectionTitle>{t.transportOffers}</SectionTitle>
          {offers.length === 0 ? <EmptyState text="—" /> : null}
          {offers.map((o) => (
            <OfferCard key={o.id} item={o} />
          ))}
          <SectionTitle>{t.transportRequests}</SectionTitle>
          {requests.length === 0 ? <EmptyState text="—" /> : null}
          {requests.map((r) => (
            <RequestCard key={r.id} item={r} />
          ))}
        </ScrollView>
      )}

      {(tab === 'listings' || tab === 'transport') && (
        <Pressable
          style={styles.fab}
          onPress={() => (tab === 'listings' ? onCreateListing() : onCreateTransportRequest())}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function BuyerCard({ item }: { item: BuyerProfile }) {
  const call = () => Linking.openURL(`tel:${item.phone}`);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.bizName}>{item.business_name}</Text>
        {item.is_verified ? <Text style={styles.verified}>✓</Text> : null}
      </View>
      <Text style={styles.city}>{item.city}</Text>
      {item.buys_categories.length > 0 ? (
        <Text style={styles.meta}>Buys: {item.buys_categories.join(', ')}</Text>
      ) : null}
      {item.about_en || item.about_mr ? (
        <Text style={styles.about} numberOfLines={2}>
          {item.about_en ?? item.about_mr ?? ''}
        </Text>
      ) : null}
      <Pressable style={styles.callBtn} onPress={call}>
        <Text style={styles.callText}>Call {item.phone}</Text>
      </Pressable>
    </View>
  );
}

function OfferCard({ item }: { item: TransportOffer }) {
  const call = () => Linking.openURL(`tel:${item.operator_phone}`);
  return (
    <View style={styles.card}>
      <Text style={styles.offerRoute}>{item.from_city} → {item.to_city}</Text>
      <Text style={styles.meta}>
        {item.truck_type} · {item.capacity_qtl}q · {item.available_from}
      </Text>
      {item.price_quote ? (
        <Text style={styles.offerPrice}>{formatRupees(item.price_quote)} ({item.price_unit})</Text>
      ) : null}
      <Text style={styles.operator}>{item.operator_name} {item.is_verified ? '✓' : ''}</Text>
      <Pressable style={styles.callBtn} onPress={call}>
        <Text style={styles.callText}>Call {item.operator_phone}</Text>
      </Pressable>
    </View>
  );
}

function RequestCard({ item }: { item: TransportRequest }) {
  const call = () => Linking.openURL(`tel:${item.requester_phone}`);
  return (
    <View style={styles.card}>
      <Text style={styles.offerRoute}>{item.from_city} → {item.to_city}</Text>
      <Text style={styles.meta}>
        {item.quantity_qtl}q · needed by {item.needed_by}
        {item.max_budget ? ` · max ${formatRupees(item.max_budget)}` : ''}
      </Text>
      <Pressable style={styles.callBtn} onPress={call}>
        <Text style={styles.callText}>Call {item.requester_phone}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: font.sm },
  tabTextActive: { color: colors.primaryDark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: 96 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: font.md, textAlign: 'center' },
  sectionTitle: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bizName: { fontSize: font.md, fontWeight: '700', color: colors.text, flex: 1 },
  verified: { color: colors.success, fontSize: font.lg, fontWeight: '700' },
  city: { color: colors.textMuted, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: font.sm, marginTop: spacing.xs },
  about: { color: colors.text, fontSize: font.sm, marginTop: spacing.xs },
  callBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  callText: { color: colors.primaryDark, fontWeight: '700' },
  offerRoute: { fontSize: font.md, fontWeight: '700', color: colors.text },
  offerPrice: { fontSize: font.lg, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.xs },
  operator: { color: colors.text, marginTop: spacing.xs, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 34 },
});
