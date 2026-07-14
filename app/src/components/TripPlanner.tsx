import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TripPlan, TripStop } from "@shared/trip";
import type { TripPlannerState } from "@/lib/useTripPlanner";
import { colors, eyebrow, radius, spacing, type } from "@/lib/theme";
import { SafetyBriefCard } from "./SafetyBriefCard";
import { TripMap } from "./TripMap";
import { TripStopCard } from "./TripStopCard";
import { TripBookingSection } from "./TripBookingSection";
import { DestinationSearch } from "./DestinationSearch";
import { TripPreferencesCard } from "./TripPreferencesCard";

interface Props extends Omit<TripPlannerState, "trip"> {
  trip: TripPlan;
  bookingId?: string;
}

function TripSummary({
  trip,
  selected,
  busy,
  error,
  optimize,
}: Props): React.ReactElement {
  const route = trip.route;
  return (
    <>
      <Text style={eyebrow}>
        {trip.demo ? "CURATED DEMO TRIP" : "EDITABLE TRIP"}
      </Text>
      <Text style={styles.title}>{trip.title}</Text>
      <Text style={styles.subtitle}>
        {trip.region} | Featured by {trip.source_creator}
      </Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summary}>{selected.length} stops</Text>
        <Text style={styles.summary}>
          {route
            ? `${(route.distance_meters / 1000).toFixed(1)} km | ${route.duration_minutes} min`
            : "Ready to optimize"}
        </Text>
      </View>
      {route?.estimated_spend_myr !== undefined ? (
        <Text style={styles.spend}>
          {route.estimated_spend_myr > 0
            ? `Known spend: RM${route.estimated_spend_myr}`
            : "No stop prices available"}
        </Text>
      ) : null}
      {route?.warnings?.map((warning) => (
        <Text key={warning} style={styles.warning}>{warning}</Text>
      ))}
      <Pressable
        style={styles.optimize}
        onPress={() => void optimize()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.kopi} />
        ) : (
          <Text style={styles.optimizeText}>Optimize route</Text>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

function StopList({ trip, selected, toggle, removeDestination }: Props): React.ReactElement {
  const ordered = selected
    .map((id) => trip.stops.find((stop) => stop.id === id))
    .filter((stop): stop is TripStop => !!stop);
  const available = trip.stops.filter((stop) => !selected.includes(stop.id));
  return (
    <>
      <Text style={styles.section}>Your itinerary</Text>
      <View style={styles.list}>
        {ordered.map((stop, index) => (
          <TripStopCard
            key={stop.id}
            stop={stop}
            position={index}
            canRemove={selected.length > 2}
            onToggle={() => void toggle(stop.id)}
            onDelete={() => void removeDestination(stop.id)}
          />
        ))}
      </View>
      {available.length ? (
        <Text style={styles.section}>Available places</Text>
      ) : null}
      <View style={styles.list}>
        {available.map((stop) => (
          <TripStopCard
            key={stop.id}
            stop={stop}
            position={null}
            canRemove
            onToggle={() => void toggle(stop.id)}
            onDelete={() => void removeDestination(stop.id)}
          />
        ))}
      </View>
    </>
  );
}

export function TripPlanner(props: Props): React.ReactElement {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TripMap
        stops={props.trip.stops}
        orderedIds={props.selected}
        path={props.trip.route?.path ?? []}
      />
      <View style={styles.body}>
        <TripSummary {...props} />
        <View style={styles.preferences}>
          <TripPreferencesCard
            stops={props.trip.stops}
            selected={props.selected}
            preferences={props.preferences}
            onChange={props.setPreferences}
          />
        </View>
        {props.bookingId ? (
          <TripBookingSection bookingId={props.bookingId} />
        ) : null}
        <StopList {...props} />
        <DestinationSearch
          results={props.searchResults}
          busy={props.busy}
          onSearch={props.search}
          onAdd={props.addDestination}
        />
        <View style={styles.safety}>
          <SafetyBriefCard
            tripId={props.trip.demo ? props.trip.id : undefined}
            itineraryId={!props.trip.demo ? props.bookingId : undefined}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: spacing(10) },
  body: { padding: spacing(5) },
  title: { ...type.display, color: colors.ink, marginTop: spacing(2) },
  subtitle: { ...type.body, color: colors.inkSoft, marginTop: spacing(1) },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing(4),
  },
  summary: { ...type.label, color: colors.ink },
  spend: { ...type.label, color: colors.ink, marginTop: spacing(2) },
  warning: { ...type.caption, color: colors.danger, marginTop: spacing(1) },
  optimize: {
    height: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.kaya,
    marginTop: spacing(4),
  },
  optimizeText: { ...type.button, color: colors.kopi },
  error: { ...type.caption, color: colors.danger, marginTop: spacing(2) },
  section: {
    ...type.title,
    color: colors.ink,
    marginTop: spacing(6),
    marginBottom: spacing(3),
  },
  list: { gap: spacing(3) },
  preferences: { marginTop: spacing(4) },
  safety: { marginTop: spacing(6) },
});
