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
  initialLanguage?: BriefLang;
}

export function SafetyBriefCard({
  itineraryId,
  tripId,
  initialLanguage = "en",
}: Props): React.ReactElement {
  const [lang, setLang] = useState<BriefLang>(initialLanguage);
  useEffect(() => setLang(initialLanguage), [initialLanguage]);
  const { brief, error } = useSafetyBrief(itineraryId, tripId, lang);
  const audioUrl = brief?.audioUrl ? serverUrl(brief.audioUrl) : null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={eyebrow}>Safety brief</Text>
        <LanguageSelector value={lang} onChange={setLang} />
      </View>
      <BriefContent brief={brief} error={error} audioUrl={audioUrl} />
    </View>
  );
}

function useSafetyBrief(itineraryId: string | undefined, tripId: string | undefined, lang: BriefLang): { brief: VoiceBriefResponse | null; error: string | null } {
  const [brief, setBrief] = useState<VoiceBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setBrief(null);
    setError(null);
    const request = tripId ? getTripVoiceBrief(tripId, lang) : getVoiceBrief(itineraryId ?? "", lang);
    request.then((data) => { if (active) setBrief(data); })
      .catch((cause: Error) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [itineraryId, lang, tripId]);
  return { brief, error };
}

function LanguageSelector({ value, onChange }: { value: BriefLang; onChange: (lang: BriefLang) => void }): React.ReactElement {
  return <View style={styles.langRow}>{LANGS.map(({ key, label }) => <Pressable key={key} style={[styles.langChip, value === key && styles.langChipActive]} onPress={() => onChange(key)}><Text style={[styles.langText, value === key && styles.langTextActive]}>{label}</Text></Pressable>)}</View>;
}

function BriefContent({ brief, error, audioUrl }: { brief: VoiceBriefResponse | null; error: string | null; audioUrl: string | null }): React.ReactElement {
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!brief) return <ActivityIndicator color={colors.sage} />;
  return <><Text style={styles.body}>{brief.text}</Text><VoiceButton key={audioUrl ?? "none"} audioUrl={audioUrl} label="Play safety brief" /><Text style={styles.caption}>Synthetic voice</Text></>;
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
