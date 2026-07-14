import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { BriefLang, VoiceBriefResponse } from "@shared/api";
import { VoiceButton } from "@/components/VoiceButton";
import { getTripVoiceBrief, getVoiceBrief, serverUrl } from "@/lib/api";
import {
  cardShadow,
  colors,
  eyebrow,
  radius,
  spacing,
  type,
} from "@/lib/theme";

const LANGS: readonly { key: BriefLang; label: string }[] = [
  { key: "en", label: "English" },
  { key: "ms", label: "Bahasa" },
  { key: "zh", label: "中文" },
];

interface Props {
  itineraryId?: string;
  tripId?: string;
}

export function SafetyBriefCard({
  itineraryId,
  tripId,
}: Props): React.ReactElement {
  const [lang, setLang] = useState<BriefLang>("en");
  const [brief, setBrief] = useState<VoiceBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBrief(null);
    setError(null);
    const load = tripId
      ? getTripVoiceBrief(tripId, lang)
      : getVoiceBrief(itineraryId ?? "", lang);
    load
      .then((data) => {
        if (!cancelled) setBrief(data);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [itineraryId, lang, tripId]);

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
              <Text
                style={[styles.langText, lang === key && styles.langTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {!brief && !error && <ActivityIndicator color={colors.sage} />}
      {brief && (
        <>
          <Text style={styles.body}>{brief.text}</Text>
          <VoiceButton
            key={audioUrl ?? "none"}
            audioUrl={audioUrl}
            label="Play safety brief"
          />
          <Text style={styles.caption}>Synthetic voice</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langRow: { flexDirection: "row", gap: spacing(1.5) },
  langChip: {
    borderRadius: radius.pill,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
    backgroundColor: colors.canvas,
  },
  langChipActive: { backgroundColor: colors.halo },
  langText: { ...type.label, color: colors.inkSoft },
  langTextActive: { color: colors.sageDeep },
  body: { ...type.body, color: colors.ink },
  caption: { ...type.caption, color: colors.inkSoft },
  error: { ...type.caption, color: colors.danger },
});
