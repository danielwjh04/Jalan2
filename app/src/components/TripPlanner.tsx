import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { isTransportStop, type PlaceCandidate, type TripPlan } from "@shared/trip";
import type { TripPlannerState } from "@/lib/useTripPlanner";
import { useUserPreferences } from "@/lib/useUserPreferences";
import { colors, eyebrow, radius, spacing, type } from "@/lib/theme";
import { BoboCard } from "./BoboCard";
import { DestinationSearch } from "./DestinationSearch";
import { GradientButton } from "./GradientButton";
import { SafetyBriefCard } from "./SafetyBriefCard";
import { SmartSuggestions } from "./SmartSuggestions";
import { SmartJourneyOverview } from "./SmartJourneyOverview";
import { SurfaceCard } from "./SurfaceCard";
import { TripBookingSection } from "./TripBookingSection";
import { TripFeasibilityCard } from "./TripFeasibilityCard";
import { TripMap } from "./TripMap";
import { TripPreferencesCard } from "./TripPreferencesCard";
import { TripStopList } from "./TripStopList";
import { TripReservationSection } from "./TripReservationSection";
import { useSavedDiscoveryTrips } from "@/lib/useSavedDiscoveryTrips";
import { addTripPlace } from "@/lib/api";

interface Props extends Omit<TripPlannerState, "trip"> {
  trip: TripPlan;
  bookingId?: string;
}

export function TripPlanner(props: Props): React.ReactElement {
  const user = useUserPreferences();
  const router = useRouter();
  const saved = useSavedDiscoveryTrips();
  const curated = props.trip.origin === "curated";
  const smart = props.trip.origin === "smart_plan";
  useEffect(() => { if (curated) void saved.load(); }, [curated, saved.load]);
  const savedId = saved.savedByDiscovery.get(props.trip.id);
  const planDiscovery = async (): Promise<void> => {
    try {
      if (savedId) {
        router.replace(`/trip/${savedId}`);
        return;
      }
      const trip = await saved.plan(props.trip.id);
      router.replace(`/trip/${trip.id}`);
    } catch {
      return;
    }
  };
  const addSuggestion = async (place: PlaceCandidate): Promise<void> => {
    if (!curated) return props.addDestination(place);
    const editable = await saved.plan(props.trip.id);
    const updated = await addTripPlace(editable.id, place);
    router.replace(`/trip/${updated.id}`);
  };
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TripSummary {...props} />
      <View style={styles.mapFrame}>
        <TripMap tripId={props.trip.id} stops={props.trip.stops} orderedIds={props.selected} path={props.trip.route?.path ?? []} planning={props.trip.planning} />
      </View>
      {props.trip.planning ? <SmartJourneyOverview planning={props.trip.planning} stops={props.trip.stops} /> : null}
      <TripFeasibilityCard trip={props.trip} selected={props.selected} />
      <SmartSuggestions suggestions={props.suggestions} loaded={props.suggestionsLoaded} busy={props.busy} onLoad={props.suggest} onAdd={addSuggestion} />
      {curated ? (
        <SurfaceCard style={styles.planCard}>
          <Text style={styles.planTitle}>Make this journey yours</Text>
          <Text style={styles.description}>Add all stops to Trips, then edit the route and reserve eligible places.</Text>
          <GradientButton label={savedId ? "Open my trip" : "Add to my trips"} busy={saved.busyId === props.trip.id} onPress={() => void planDiscovery()} />
          {saved.error ? <Text style={styles.warning}>{saved.error}</Text> : null}
        </SurfaceCard>
      ) : smart ? null : (
        <TripPreferencesCard
          stops={props.trip.stops}
          selected={props.selected}
          preferences={props.preferences}
          onChange={props.setPreferences}
          onApplyDefaults={props.applyDefaults}
        />
      )}
      {props.bookingId ? <TripBookingSection bookingId={props.bookingId} /> : null}
      {!curated ? <TripReservationSection trip={props.trip} /> : null}
      <TripStopList trip={props.trip} selected={props.selected} editable={!curated && !smart} onToggle={(id) => void props.toggle(id)} onDelete={(id) => void props.removeDestination(id)} />
      {!curated && !smart ? (
        <DestinationSearch
          results={props.searchResults}
          busy={props.busy}
          onSearch={props.search}
          onAdd={props.addDestination}
        />
      ) : null}
      <BoboCard compact title="Bobo route note" message={routeNote(props.trip)} />
      {props.trip.origin === "video" ? (
        <SafetyBriefCard
          tripId={props.trip.demo ? props.trip.id : undefined}
          itineraryId={!props.trip.demo ? props.bookingId : undefined}
          initialLanguage={user.defaults.safetyLanguage}
        />
      ) : null}
    </ScrollView>
  );
}

function TripSummary(props: Props): React.ReactElement {
  const route = props.trip.route;
  const placeCount = props.selected.filter((id) => {
    const stop = props.trip.stops.find((candidate) => candidate.id === id);
    return stop ? !isTransportStop(stop) : false;
  }).length;
  return (
    <SurfaceCard style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryCopy}>
          <Text style={styles.eyebrow}>{tripEyebrow(props.trip)}</Text>
          <Text style={styles.title}>{props.trip.title}</Text>
          <Text style={styles.subtitle}>{props.trip.region} | {props.trip.source_creator}</Text>
          {props.trip.summary ? <Text style={styles.description}>{props.trip.summary}</Text> : null}
        </View>
        {props.trip.origin !== "curated" && props.trip.origin !== "smart_plan" ? <Pressable style={styles.optimize} disabled={props.busy} onPress={() => void props.optimize()}>
          {props.busy ? <ActivityIndicator color={colors.kopi} /> : <Text style={styles.optimizeText}>Optimize</Text>}
        </Pressable> : null}
      </View>
      <View style={styles.metrics}>
        <Metric value={`${placeCount}`} label="places" />
        <Metric value={route ? `${(route.distance_meters / 1000).toFixed(1)} km` : "Not set"} label="distance" />
        <Metric value={route ? `${route.duration_minutes} min` : "Ready"} label="route" />
      </View>
      {route?.estimated_spend_myr !== undefined ? (
        <Text style={styles.spend}>
          {route.estimated_spend_myr > 0 ? `Known spend RM${route.estimated_spend_myr}` : "No stop prices available"}
        </Text>
      ) : null}
      {route?.warnings?.map((warning) => <Text key={warning} style={styles.warning}>{warning}</Text>)}
      {props.error ? <Text style={styles.warning}>{props.error}</Text> : null}
    </SurfaceCard>
  );
}

function Metric({ value, label }: { value: string; label: string }): React.ReactElement {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function routeNote(trip: TripPlan): string {
  const warning = trip.route?.warnings?.[0];
  if (warning) return warning;
  if (trip.stops.some(({ opening_window: window }) => window !== null && window !== undefined)) {
    return "Some stops include opening windows. Optimize again after changing your start time.";
  }
  if (trip.origin === "curated") {
    return "This is a ready-made Jalan2 route. Open each stop for its map source, then optimize after changing your selections.";
  }
  if (trip.origin === "smart_plan") {
    return "The planning agents separated provider-backed facts, estimates and actions that still need confirmation. Rebuild the plan after changing its core route.";
  }
  return `These stops are grounded in ${trip.source_creator}'s source. Open each stop for its original link.`;
}

function tripEyebrow(trip: TripPlan): string {
  if (trip.origin === "curated") return "CURATED BY JALAN2";
  if (trip.origin === "smart_plan") return "BUILT BY JALAN2 PLANNING AGENTS";
  return trip.demo ? "FROM A LOCAL VIDEO" : "EDITABLE TRIP";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 1040, boxSizing: "border-box", alignSelf: "center", padding: spacing(5), paddingBottom: spacing(34), gap: spacing(4) },
  summaryCard: { gap: spacing(3) },
  planCard: { gap: spacing(3) },
  planTitle: { ...type.heading, color: colors.ink },
  summaryTop: { flexDirection: "row", gap: spacing(3), alignItems: "flex-start" },
  summaryCopy: { flex: 1, gap: spacing(1) },
  eyebrow: { ...eyebrow },
  title: { ...type.display, color: colors.ink, fontSize: 27, lineHeight: 32 },
  subtitle: { ...type.caption, color: colors.inkSoft },
  description: { ...type.body, color: colors.inkSoft, marginTop: spacing(1) },
  optimize: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.kaya, paddingHorizontal: spacing(3), alignItems: "center", justifyContent: "center" },
  optimizeText: { ...type.label, color: colors.kopi },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  metric: { flex: 1, minWidth: 110, backgroundColor: colors.canvas, borderRadius: radius.control, padding: spacing(2.5) },
  metricValue: { ...type.label, color: colors.ink },
  metricLabel: { ...type.caption, color: colors.inkSoft },
  spend: { ...type.label, color: colors.sageDeep },
  warning: { ...type.caption, color: colors.danger },
  mapFrame: { borderRadius: radius.card, overflow: "hidden" },
});
