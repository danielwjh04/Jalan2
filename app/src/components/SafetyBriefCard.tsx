import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BriefLang, VoiceBriefResponse } from '@shared/api';
import { VoiceButton } from '@/components/VoiceButton';
import { getVoiceBrief, serverUrl } from '@/lib/api';
import { cardShadow, colors, eyebrow, radius, spacing } from '@/lib/theme';

const LANGS: readonly { key: BriefLang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ms', label: 'Bahasa' },
];

export function SafetyBriefCard({ itineraryId }: { itineraryId: string }): React.ReactElement {
  const [lang, setLang] = useState<BriefLang>('en');
  const [brief, setBrief] = useState<VoiceBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBrief(null);
    setError(null);
    getVoiceBrief(itineraryId, lang)
      .then((data) => {
        if (!cancelled) setBrief(data);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [itineraryId, lang]);

  const audioUrl = brief?.audioUrl ? serverUrl(brief.audioUrl) : null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={eyebrow}>Safety brief</Text>
        <View style={styles.langRow}>
          {LANGS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.langChip, lang === key && styles.langChipActive]}
              onPress={() => setLang(key)}
            >
              <Text style={[styles.langText, lang === key && styles.langTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {!brief && !error && <ActivityIndicator color={colors.tide} />}
      {brief && (
        <>
          <Text style={styles.body}>{brief.text}</Text>
          <VoiceButton key={audioUrl ?? 'none'} audioUrl={audioUrl} label="Play safety brief" />
          <View style={styles.footer}>
            <Text style={styles.caption}>Synthetic AI-generated voice</Text>
            {brief.servedFrom !== null && brief.servedFrom !== 'live' && (
              <Text style={styles.cachedTag}>cached</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(3),
    ...cardShadow,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langRow: { flexDirection: 'row', gap: spacing(1.5) },
  langChip: {
    borderRadius: radius.pill,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
    backgroundColor: colors.canvas,
  },
  langChipActive: { backgroundColor: colors.tideSoft },
  langText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  langTextActive: { color: colors.tide },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { color: colors.inkSoft, fontSize: 11 },
  cachedTag: {
    color: colors.pending,
    backgroundColor: colors.pendingSoft,
    fontSize: 10,
    fontWeight: '700',
    borderRadius: radius.pill,
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(2),
    overflow: 'hidden',
  },
  error: { color: colors.danger, fontSize: 12 },
});
