import { StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import type { TripPreferences, TripStop } from "@shared/trip";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  stops: TripStop[];
  selected: string[];
  preferences: TripPreferences;
  onChange: (preferences: TripPreferences) => void;
}

export function TripPreferencesCard(props: Props): React.ReactElement {
  const selectedStops = props.selected
    .map((id) => props.stops.find((stop) => stop.id === id))
    .filter((stop): stop is TripStop => Boolean(stop));
  const start = selectedStops.find((stop) => stop.id === props.preferences.start_stop_id);
  const end = selectedStops.find((stop) => stop.id === props.preferences.end_stop_id);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Plan constraints</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Budget MYR</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="No limit"
            placeholderTextColor={colors.inkSoft}
            value={props.preferences.budget_myr?.toString() ?? ""}
            onChangeText={(value) => props.onChange({
              ...props.preferences,
              budget_myr: value ? Number(value) : null,
            })}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Start time</Text>
          <Pressable
            style={styles.inputButton}
            onPress={() => props.onChange({
              ...props.preferences,
              day_start_minute: (props.preferences.day_start_minute + 30) % 1440,
            })}
          >
            <Text style={styles.inputButtonText}>{formatTime(props.preferences.day_start_minute)}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        <CycleButton
          label={`Start: ${start?.name ?? "First stop"}`}
          onPress={() => props.onChange({
            ...props.preferences,
            start_stop_id: nextId(selectedStops, props.preferences.start_stop_id, false),
          })}
        />
        <CycleButton
          label={`End: ${end?.name ?? "Flexible"}`}
          onPress={() => props.onChange({
            ...props.preferences,
            end_stop_id: nextId(selectedStops, props.preferences.end_stop_id, true),
          })}
        />
      </View>
    </View>
  );
}

function CycleButton({ label, onPress }: { label: string; onPress: () => void }): React.ReactElement {
  return (
    <Pressable style={styles.cycle} onPress={onPress}>
      <Text numberOfLines={2} style={styles.cycleText}>{label}</Text>
    </Pressable>
  );
}

function nextId(stops: TripStop[], current: string | null, allowNull: boolean): string | null {
  const ids = stops.map((stop) => stop.id);
  const index = current ? ids.indexOf(current) : -1;
  if (allowNull && index === ids.length - 1) return null;
  return ids[(index + 1) % ids.length] ?? null;
}

function formatTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(4), gap: spacing(3) },
  title: { ...type.title, color: colors.ink },
  row: { flexDirection: "row", gap: spacing(2) },
  field: { flex: 1, gap: spacing(1) },
  label: { ...type.caption, color: colors.inkSoft },
  input: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.canvas, color: colors.ink, paddingHorizontal: spacing(3) },
  inputButton: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.canvas, justifyContent: "center", paddingHorizontal: spacing(3) },
  inputButtonText: { ...type.body, color: colors.ink },
  cycle: { flex: 1, minHeight: 48, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.halo, padding: spacing(2) },
  cycleText: { ...type.label, color: colors.sageDeep, textAlign: "center" },
});
