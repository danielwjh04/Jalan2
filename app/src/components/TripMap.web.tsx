import { useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import type { SmartPlanningMetadata } from "@shared/planner";
import { isTransportStop, type GeoPoint, type TripStop } from "@shared/trip";
import { colors, fonts, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { tripMapUrl } from "@/lib/api";

interface Props {
  tripId: string;
  stops: TripStop[];
  orderedIds: string[];
  path: GeoPoint[];
  planning?: SmartPlanningMetadata | null;
}

interface LiveMapProps { stops: TripStop[]; }

export function TripMap({ tripId, stops, orderedIds, planning }: Props): React.ReactElement {
  const ordered = orderedIds.map((id) => stops.find((stop) => stop.id === id)).filter((stop): stop is TripStop => Boolean(stop));
  const physical = ordered.filter((stop) => !isTransportStop(stop));
  const local = localStops(physical, planning);
  const [wholeTrip, setWholeTrip] = useState(false);
  const shown = wholeTrip ? physical : local;
  const canChangeFocus = local.length !== physical.length;
  const mapUrl = tripMapUrl(tripId, shown.map((stop) => stop.id));
  const [googleFailed, setGoogleFailed] = useState(false);
  const [LiveMap, setLiveMap] = useState<ComponentType<LiveMapProps> | null>(null);
  useEffect(() => { setGoogleFailed(false); }, [mapUrl]);
  useEffect(() => {
    let active = true;
    void import("./LeafletRouteMap.web").then((module) => { if (active) setLiveMap(() => module.LeafletRouteMap); });
    return () => { active = false; };
  }, []);
  return (
    <View style={styles.frame}>
      <View style={styles.topline}>
        <View style={styles.headingCopy}><Text style={styles.label}>LIVE ROUTE MAP</Text><Text style={styles.title}>See the plan where it happens</Text></View>
        <View style={styles.actions}>
          {canChangeFocus ? <Pressable style={styles.focus} onPress={() => setWholeTrip((value) => !value)}><Text style={styles.focusText}>{wholeTrip ? "Focus destination" : "Show whole trip"}</Text></Pressable> : null}
          <Pressable style={styles.open} onPress={() => void openGoogleMaps(ordered)}>
            <Ionicons name="navigate-outline" size={17} color={colors.kopi} />
            <Text style={styles.openText}>Directions</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.mapShell}>
        {!googleFailed ? (
          <>
            <Image source={{ uri: mapUrl }} style={styles.googleMap} resizeMode="cover" onError={() => setGoogleFailed(true)} accessibilityLabel="Google Maps itinerary preview" />
            <View style={styles.googleBadge}><Text style={styles.googleBadgeText}>Google Maps</Text></View>
          </>
        ) : LiveMap ? (
          <LiveMap stops={shown} />
        ) : (
          <View style={styles.loadingMap}><Ionicons name="map-outline" size={28} color={colors.sageDeep} /><Text style={styles.loadingText}>Loading map fallback...</Text></View>
        )}
      </View>
      <View style={styles.legend}>{shown.map((stop, index) => <View key={stop.id} style={styles.legendItem}><Text style={styles.legendNumber}>{index + 1}</Text><Text style={styles.legendName} numberOfLines={1}>{stop.name}</Text></View>)}</View>
      <Text style={styles.note}>{googleFailed ? "Google Maps is unavailable, so this is the live OpenStreetMap fallback." : "Google Maps shows the destination area and itinerary order."} Open Directions for turn-by-turn road routing.</Text>
    </View>
  );
}

function localStops(stops: TripStop[], planning?: SmartPlanningMetadata | null): TripStop[] {
  const longLeg = planning?.legs.find((leg) => ["coach", "train", "ferry", "flight", "multimodal"].includes(leg.mode) && (leg.distance_meters ?? 0) > 80_000);
  if (!longLeg) return stops;
  const focused = stops.filter((stop) => stop.id !== longLeg.from_stop_id);
  return focused.length > 0 ? focused : stops;
}

async function openGoogleMaps(stops: TripStop[]): Promise<void> {
  if (stops.length === 0) return;
  const coordinate = (stop: TripStop): string => `${stop.location.lat},${stop.location.lng}`;
  const waypoints = stops.slice(1, -1).map(coordinate).join("|");
  const params = new URLSearchParams({ api: "1", origin: coordinate(stops[0]), destination: coordinate(stops.at(-1) ?? stops[0]), travelmode: "driving" });
  if (waypoints) params.set("waypoints", waypoints);
  if (await tryOpenExternalUrl(`https://www.google.com/maps/dir/?${params.toString()}`, Linking.openURL)) return;
  Alert.alert("Could not open Google Maps", "Try the route again later.");
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(4), gap: spacing(3) },
  topline: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: spacing(3) },
  headingCopy: { minWidth: 220, flex: 1 },
  label: { ...type.caption, color: colors.sageDeep, letterSpacing: 1.2 },
  title: { ...type.title, color: colors.ink },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  focus: { minHeight: 42, justifyContent: "center", paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.halo },
  focusText: { ...type.label, color: colors.sageDeep },
  open: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing(1.5), paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.kayaTint },
  openText: { ...type.label, color: colors.kopi },
  mapShell: { height: 390, overflow: "hidden", borderRadius: radius.control, backgroundColor: colors.halo },
  googleMap: { width: "100%", height: "100%" },
  googleBadge: { position: "absolute", left: spacing(2), bottom: spacing(2), borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: spacing(2), paddingVertical: spacing(1) },
  googleBadgeText: { ...type.caption, color: colors.ink, fontFamily: fonts.semibold },
  loadingMap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing(2) },
  loadingText: { ...type.label, color: colors.sageDeep },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), minWidth: 155, flex: 1 },
  legendNumber: { width: 22, height: 22, textAlign: "center", paddingTop: 2, borderRadius: radius.pill, backgroundColor: colors.halo, color: colors.sageDeep, fontFamily: fonts.semibold, fontSize: 11 },
  legendName: { ...type.caption, color: colors.ink, flex: 1 },
  note: { ...type.caption, color: colors.inkSoft },
});
