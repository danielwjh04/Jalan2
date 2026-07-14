import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BoboCard } from "@/components/BoboCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SavePreferencesButton } from "@/components/SavePreferencesButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useUserPreferences } from "@/lib/useUserPreferences";
import type { SafetyLanguage, TravelDefaults, TravelPace } from "@/lib/travelDefaults";
import { colors, radius, spacing, type } from "@/lib/theme";

const PACE_OPTIONS = [
  { value: "relaxed", label: "Relaxed" },
  { value: "balanced", label: "Balanced" },
  { value: "packed", label: "Packed" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa" },
  { value: "zh", label: "中文" },
] as const;

const SAVE_FEEDBACK_MS = 3_000;

export default function YouScreen(): React.ReactElement {
  const preferences = useUserPreferences();
  const [draft, setDraft] = useState<TravelDefaults>(preferences.defaults);
  const [saved, setSaved] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (preferences.loaded) setDraft(preferences.defaults);
  }, [preferences.defaults, preferences.loaded]);
  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);
  const saveDraft = async (): Promise<void> => {
    if (!await preferences.save(draft)) return;
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setSaved(true);
    feedbackTimer.current = setTimeout(() => setSaved(false), SAVE_FEEDBACK_MS);
  };
  if (!preferences.loaded) {
    return <View style={styles.loading}><ActivityIndicator color={colors.sage} /></View>;
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrowText="Your local defaults" title="You" />
      <BoboCard
        compact
        title="Travel your way"
        message="Save a starting point here, then choose Use my defaults inside any trip."
      />
      <PreferencesForm
        draft={draft}
        error={preferences.error}
        saved={saved}
        onChange={(next) => { setDraft(next); setSaved(false); }}
        onSave={() => void saveDraft()}
      />
    </ScrollView>
  );
}

interface PreferencesFormProps {
  draft: TravelDefaults;
  error: string | null;
  saved: boolean;
  onChange: (next: TravelDefaults) => void;
  onSave: () => void;
}

function PreferencesForm(props: PreferencesFormProps): React.ReactElement {
  const update = (next: Partial<TravelDefaults>): void => props.onChange({ ...props.draft, ...next });
  return (
    <SurfaceCard style={styles.form}>
      <PreferenceLabel title="Daily budget" detail="Leave empty for no limit" />
      <TextInput keyboardType="numeric" placeholder="No limit" placeholderTextColor={colors.inkSoft} value={props.draft.budgetMyr?.toString() ?? ""} onChangeText={(value) => update({ budgetMyr: parseBudget(value) })} style={styles.input} />
      <PreferenceLabel title="Start the day" detail="Tap to move by 30 minutes" />
      <Pressable style={styles.input} onPress={() => update({ dayStartMinute: (props.draft.dayStartMinute + 30) % 1440 })}>
        <Text style={styles.inputText}>{formatTime(props.draft.dayStartMinute)}</Text>
      </Pressable>
      <PreferenceLabel title="Travel pace" detail="Controls the initial stop count when applied" />
      <SegmentedControl options={PACE_OPTIONS} value={props.draft.travelPace} onChange={(value) => update({ travelPace: value as TravelPace })} />
      <PreferenceLabel title="Safety brief language" detail="Used first on trip and booking screens" />
      <SegmentedControl options={LANGUAGE_OPTIONS} value={props.draft.safetyLanguage} onChange={(value) => update({ safetyLanguage: value as SafetyLanguage })} />
      <SavePreferencesButton saved={props.saved} onPress={props.onSave} />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </SurfaceCard>
  );
}

function PreferenceLabel({ title, detail }: { title: string; detail: string }): React.ReactElement {
  return <View style={styles.label}><Text style={styles.labelTitle}>{title}</Text><Text style={styles.labelDetail}>{detail}</Text></View>;
}

function parseBudget(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(4) },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas },
  form: { gap: spacing(3) },
  label: { gap: spacing(0.5), marginTop: spacing(1) },
  labelTitle: { ...type.heading, color: colors.ink },
  labelDetail: { ...type.caption, color: colors.inkSoft },
  input: {
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.canvas,
    color: colors.ink,
    paddingHorizontal: spacing(3.5),
    justifyContent: "center",
  },
  inputText: { ...type.body, color: colors.ink },
  error: { ...type.caption, color: colors.danger, textAlign: "center" },
});
