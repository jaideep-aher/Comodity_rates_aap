import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { useWatchlist } from '../store/watchlistStore';
import { useCropInstances } from '../store/cropInstancesStore';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { askAdvisor, SUGGESTED_QUESTIONS, type AdvisorAnswer } from '../utils/askAdvisor';
import { askBackend } from '../api/ask';
import { TtsButton } from '../components/TtsButton';

type Bubble =
  | { role: 'user'; text: string }
  | { role: 'bot'; text: string; title: string; emoji: string; source?: 'local' | 'llm' };

type Props = { onBack: () => void };

export function AskAdvisorScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const watchIds = useWatchlist((s) => s.ids);
  const instances = useCropInstances((s) => s.byId);
  const weather = useLiveWeather();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const initialBot: Bubble = useMemo(
    () => ({
      role: 'bot',
      title: lang === 'mr' ? 'नमस्कार! 🙏' : 'Hello! 🙏',
      text:
        lang === 'mr'
          ? 'मी तुमचा शेतीसल्लागार आहे. हवामान, पेरणी, फवारणी, काढणी — काहीही विचारा.'
          : "I'm your farming co-pilot. Ask me about weather, sowing, spraying, harvest — anything.",
      emoji: '🌾',
      source: 'local',
    }),
    [lang],
  );

  const [messages, setMessages] = useState<Bubble[]>([initialBot]);

  const ctx = useMemo(() => {
    const sowingByCommodityId: Record<number, { sowingDate: string | null; variety: string | null }> = {};
    for (const id of Object.keys(instances)) {
      const inst = instances[Number(id)];
      sowingByCommodityId[Number(id)] = {
        sowingDate: inst.sowingDate,
        variety: inst.variety,
      };
    }
    return {
      lang,
      today: weather.days[0] ?? null,
      upcoming: weather.days.slice(1),
      watchedCommodityIds: watchIds,
      sowingByCommodityId,
    };
  }, [lang, weather.days, watchIds, instances]);

  const sendQuestion = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setInput('');
    setSending(true);

    const userBubble: Bubble = { role: 'user', text: q };
    setMessages((m) => [...m, userBubble]);

    const localAns: AdvisorAnswer = askAdvisor(q, ctx);

    if (!localAns.needsEscalation) {
      setMessages((m) => [
        ...m,
        { role: 'bot', title: localAns.title, text: localAns.body, emoji: localAns.emoji, source: 'local' },
      ]);
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      return;
    }

    // Try backend LLM. If unavailable, show the rule fallback.
    const api = await askBackend(q, lang);
    if (api?.answer) {
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          title: lang === 'mr' ? 'किसान-AI' : 'Kisan-AI',
          text: api.answer,
          emoji: '🤖',
          source: 'llm',
        },
      ]);
    } else {
      setMessages((m) => [
        ...m,
        { role: 'bot', title: localAns.title, text: localAns.body, emoji: localAns.emoji, source: 'local' },
      ]);
    }
    setSending(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>🤖 {t.askAdvisorTitle}</Text>
        <Text style={styles.subtitle}>{t.askAdvisorSub}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m, i) => {
            if (m.role === 'user') {
              return (
                <View key={i} style={[styles.bubble, styles.bubbleUser]}>
                  <Text style={styles.bubbleUserText}>{m.text}</Text>
                </View>
              );
            }
            return (
              <View key={i} style={[styles.bubble, styles.bubbleBot]}>
                <View style={styles.botHeader}>
                  <Text style={styles.botEmoji}>{m.emoji}</Text>
                  <Text style={styles.botTitle} numberOfLines={2}>
                    {m.title}
                  </Text>
                  <TtsButton text={`${m.title}. ${m.text}`} compact />
                </View>
                <Text style={styles.botText}>{m.text}</Text>
                {m.source === 'llm' && (
                  <Text style={styles.sourceTag}>{t.askSourceLlm}</Text>
                )}
              </View>
            );
          })}
          {sending && (
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={styles.typing}>…</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.suggestionsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <Pressable
                key={i}
                onPress={() => sendQuestion(q[lang])}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{q[lang]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t.askPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            onSubmitEditing={() => sendQuestion(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => sendQuestion(input)}
            disabled={sending || !input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              (sending || !input.trim()) && { opacity: 0.4 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.sendText}>▶</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  back: { color: colors.primary, fontWeight: '700', fontSize: font.sm },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: font.sm, color: colors.textMuted },

  messages: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    maxWidth: '90%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleUserText: { color: '#fff', fontSize: font.md },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadow.card,
  },
  botHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  botEmoji: { fontSize: 22 },
  botTitle: { flex: 1, fontSize: font.md, fontWeight: '800', color: colors.text },
  botText: { fontSize: font.md, color: colors.text, lineHeight: 22 },
  sourceTag: {
    marginTop: 6,
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typing: { fontSize: 26, color: colors.textMuted },

  suggestionsWrap: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  suggestionText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: font.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.pop,
  },
  sendText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },
});
