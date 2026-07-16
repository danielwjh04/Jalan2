import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { TripPreferences, TripStop } from "@shared/trip";
import type { TravelDefaults } from "@/lib/travelDefaults";
import { useUserPreferences } from "@/lib/useUserPreferences";
import { colors, radius, spacing, type } from "@/lib/theme";
import { SurfaceCard } from "./SurfaceCard";

interface Props {
  stops: TripStop[];
  selected: string[];
  preferences: TripPreferences;
  onChange: (preferences: TripPreferences) => void;
  onApplyDefaults: (defaults: TravelDefaults) => Promise<void>;
}

export function TripPreferencesCard(props: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const saved = useUserPreferences();
  const selectedStops = selectedStopsFor(props);
  return (
    <SurfaceCard style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerCopy}><Text style={styles.title}>Journey boundaries</Text><Text style={styles.journey}>{journeyFor(props.preferences, selectedStops)}</Text><Text style={styles.summary}>{summaryFor(props.preferences)}</Text></View>
        <Text style={styles.expand}>{expanded ? "Hide" : "Edit"}</Text>
      </Pressable>
      <Pressable
        disabled={!saved.loaded}
        style={styles.defaults}
        onPress={() => void props.onApplyDefaults(saved.defaults)}
      >
        <Text style={styles.defaultsText}>Use my defaults</Text>
      </Pressable>
      {expanded ? <PreferenceFields {...props} selectedStops={selectedStops} /> : null}
    </SurfaceCard>
  );
}

function PreferenceFields(props: Props & { selectedStops: TripStop[] }): React.ReactElement {
  const { preferences } = props;
  const start = props.selectedStops.find(({ id }) => id === preferences.start_stop_id);
  const end = props.selectedStops.find(({ id }) => id === preferences.end_stop_id);
  return (
    <View style={styles.fields}>
      <View style={styles.row}>
        <Field label="Budget MYR"><TextInput keyboardType="numeric" placeholder="No limit" placeholderTextColor={colors.inkSoft} value={preferences.budget_myr?.toString() ?? ""} onChangeText={(value) => props.onChange({ ...preferences, budget_myr: parseBudget(value) })} style={styles.input} /></Field>
        <Field label="Start time"><Pressable style={styles.input} onPress={() => props.onChange({ ...preferences, day_start_minute: (preferences.day_start_minute + 30) % 1440 })}><Text style={styles.inputText}>{formatTime(preferences.day_start_minute)}</Text></Pressable></Field>
      </View>
      <View style={styles.row}>
        <Field label="Starting from"><TextInput placeholder={defaultOrigin(props.selectedStops)} placeholderTextColor={colors.inkSoft} value={preferences.journey_origin ?? ""} onChangeText={(value) => props.onChange({ ...preferences, journey_origin: nullableText(value) })} style={styles.input} /></Field>
        <Field label="Trip type"><Pressable style={[styles.input, preferences.return_to_origin && styles.returnActive]} onPress={() => props.onChange({ ...preferences, return_to_origin: !preferences.return_to_origin, journey_end: !preferences.return_to_origin ? preferences.journey_origin : preferences.journey_end })}><Text style={[styles.inputText, preferences.return_to_origin && styles.returnText]}>{preferences.return_to_origin ? "Return to start" : "Different endpoint"}</Text></Pressable></Field>
      </View>
      {!preferences.return_to_origin ? <Field label="Trip ends at"><TextInput placeholder={defaultEnd(props.selectedStops)} placeholderTextColor={colors.inkSoft} value={preferences.journey_end ?? ""} onChangeText={(value) => props.onChange({ ...preferences, journey_end: nullableText(value) })} style={styles.input} /></Field> : null}
      <View style={styles.row}>
        <CycleButton label={`Start: ${start?.name ?? "First stop"}`} onPress={() => props.onChange({ ...preferences, start_stop_id: nextId(props.selectedStops, preferences.start_stop_id, false) })} />
        <CycleButton label={`End: ${end?.name ?? "Flexible"}`} onPress={() => props.onChange({ ...preferences, end_stop_id: nextId(props.selectedStops, preferences.end_stop_id, true) })} />
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

function CycleButton({ label, onPress }: { label: string; onPress: () => void }): React.ReactElement {
  return <Pressable style={styles.cycle} onPress={onPress}><Text numberOfLines={2} style={styles.cycleText}>{label}</Text></Pressable>;
}

function selectedStopsFor(props: Props): TripStop[] {
  return props.selected.map((id) => props.stops.find((stop) => stop.id === id)).filter((stop): stop is TripStop => Boolean(stop));
}

function nextId(stops: TripStop[], current: string | null, allowNull: boolean): string | null {
  const ids = stops.map(({ id }) => id);
  const index = current ? ids.indexOf(current) : -1;
  if (allowNull && index === ids.length - 1) return null;
  return ids[(index + 1) % ids.length] ?? null;
}

function parseBudget(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function summaryFor(preferences: TripPreferences): string {
  const budget = preferences.budget_myr === null ? "No budget limit" : `RM${preferences.budget_myr}`;
  return `${budget} | Start ${formatTime(preferences.day_start_minute)}`;
}

function journeyFor(preferences: TripPreferences, stops: TripStop[]): string {
  const origin = preferences.journey_origin ?? defaultOrigin(stops);
  const endpoint = preferences.return_to_origin ? origin : preferences.journey_end ?? defaultEnd(stops);
  return `${origin} → ${endpoint}${preferences.return_to_origin ? " · return trip" : " · one-way"}`;
}

function defaultOrigin(stops: TripStop[]): string {
  return stops[0]?.transport_from ?? stops[0]?.name ?? "Choose a starting point";
}

function defaultEnd(stops: TripStop[]): string {
  return stops.at(-1)?.transport_to ?? stops.at(-1)?.name ?? "Choose an endpoint";
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length >= 2 ? trimmed : null;
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing(2) },
  headerCopy: { flex: 1 },
  title: { ...type.heading, color: colors.ink },
  summary: { ...type.caption, color: colors.inkSoft, marginTop: spacing(0.5) },
  journey: { ...type.label, color: colors.sageDeep, marginTop: spacing(0.5) },
  expand: { ...type.label, color: colors.sageDeep },
  defaults: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.halo, alignItems: "center", justifyContent: "center" },
  defaultsText: { ...type.button, color: colors.sageDeep },
  fields: { gap: spacing(3) },
  row: { flexDirection: "row", gap: spacing(2) },
  field: { flex: 1, gap: spacing(1) },
  label: { ...type.caption, color: colors.inkSoft },
  input: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.canvas, color: colors.ink, paddingHorizontal: spacing(3), justifyContent: "center" },
  inputText: { ...type.body, color: colors.ink },
  returnActive: { backgroundColor: colors.sageDeep },
  returnText: { color: colors.white },
  cycle: { flex: 1, minHeight: 48, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.canvas, padding: spacing(2) },
  cycleText: { ...type.label, color: colors.sageDeep, textAlign: "center" },
});
