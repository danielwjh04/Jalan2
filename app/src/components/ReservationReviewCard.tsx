import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ReservationPreviewStop } from "@shared/reservation";
import type { TripReservationState } from "@/lib/useTripReservations";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { GradientButton } from "./GradientButton";
import { SurfaceCard } from "./SurfaceCard";

export function ReservationReviewCard({
  state,
}: {
  state: TripReservationState;
}): React.ReactElement {
  if (!state.preview) throw new Error("Reservation preview is required");
  return (
    <SurfaceCard style={styles.stack}>
      <Text style={styles.title}>Review reservation requests</Text>
      <DatePicker
        dates={state.dates}
        selected={state.tripDate}
        onSelect={state.setTripDate}
      />
      <PaxPicker value={state.pax} onChange={state.setPax} />
      {state.preview.stops.map((stop) => (
        <PreviewRow
          key={stop.stopId}
          stop={stop}
          time={state.times[stop.stopId] ?? stop.suggestedTime}
          onTime={(time) => state.setTime(stop.stopId, time)}
        />
      ))}
      <GradientButton
        label="Send reservation requests"
        busy={state.busy}
        onPress={() => void state.send()}
      />
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
    </SurfaceCard>
  );
}

function DatePicker({
  dates,
  selected,
  onSelect,
}: {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
}): React.ReactElement {
  return (
    <View style={styles.row}>
      {dates.map((date) => (
        <Pressable
          key={date}
          style={[styles.pill, date === selected && styles.selected]}
          onPress={() => onSelect(date)}
        >
          <Text style={styles.pillText}>{date.slice(5)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PaxPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): React.ReactElement {
  return (
    <View style={styles.pax}>
      <Text style={styles.label}>Guests</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.step}
          onPress={() => onChange(Math.max(1, value - 1))}
        >
          <Text>-</Text>
        </Pressable>
        <Text style={styles.paxValue}>{value}</Text>
        <Pressable
          style={styles.step}
          onPress={() => onChange(Math.min(20, value + 1))}
        >
          <Text>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PreviewRow({
  stop,
  time,
  onTime,
}: {
  stop: ReservationPreviewStop;
  time: string;
  onTime: (time: string) => void;
}): React.ReactElement {
  const bookable = stop.eligibility === "BOOKABLE";
  return (
    <View style={styles.stop}>
      {stop.imageUrl ? (
        <Image source={{ uri: stop.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.fallback]} />
      )}
      <View style={styles.stopCopy}>
        <Text style={styles.label}>{stop.stopName}</Text>
        <Text style={styles.meta}>{eligibilityLabel(stop)}</Text>
      </View>
      {bookable ? (
        <TextInput
          accessibilityLabel={`Time for ${stop.stopName}`}
          value={time}
          onChangeText={onTime}
          style={styles.time}
          maxLength={5}
        />
      ) : null}
    </View>
  );
}

function eligibilityLabel(stop: ReservationPreviewStop): string {
  if (stop.eligibility === "BOOKABLE") return "Reservation request";
  return stop.eligibility === "WALK_IN" ? "Walk in" : "Contact unavailable";
}

const styles = StyleSheet.create({
  stack: { gap: spacing(3) },
  title: { ...type.title, color: colors.ink },
  error: { ...type.caption, color: colors.danger },
  row: { flexDirection: "row", gap: spacing(2), alignItems: "center" },
  pill: {
    flex: 1,
    padding: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: "center",
    ...hairline,
  },
  selected: { backgroundColor: colors.halo, borderColor: colors.sage },
  pillText: { ...type.label, color: colors.ink },
  pax: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  step: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    ...hairline,
  },
  paxValue: {
    ...type.heading,
    color: colors.ink,
    minWidth: 28,
    textAlign: "center",
  },
  stop: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    paddingTop: spacing(3),
  },
  image: { width: 58, height: 58, borderRadius: radius.control },
  fallback: { backgroundColor: colors.halo },
  stopCopy: { flex: 1, gap: spacing(1) },
  label: { ...type.label, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft },
  time: {
    width: 64,
    padding: spacing(2),
    borderRadius: radius.control,
    backgroundColor: colors.canvas,
    color: colors.ink,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.mist,
  },
});
