import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PlaceCandidate } from "@shared/trip";
import { colors, radius, spacing, type } from "@/lib/theme";
import { PlaceImage } from "./PlaceImage";
import { SurfaceCard } from "./SurfaceCard";

interface Props {
  suggestions: PlaceCandidate[];
  loaded: boolean;
  busy: boolean;
  onLoad: () => Promise<void>;
  onAdd: (place: PlaceCandidate) => Promise<void>;
}

export function SmartSuggestions(props: Props): React.ReactElement {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Ionicons name="sparkles" size={18} color={colors.kopi} /></View>
        <View style={styles.copy}>
          <Text style={styles.title}>Popular stops on your way</Text>
          <Text style={styles.help}>Google Places supplies ratings and coordinates. Jalan2 samples the route and removes stops more than 5 km away. No AI guessing.</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={props.loaded ? "Refresh route suggestions" : "Find stops on my way"} style={[styles.find, props.busy && styles.disabled]} disabled={props.busy} onPress={() => void props.onLoad()}>
        {props.busy ? <ActivityIndicator color={colors.kopi} /> : <Ionicons name="navigate-outline" size={17} color={colors.kopi} />}
        <Text style={styles.findText}>{props.loaded ? "Refresh suggestions" : "Find stops on my way"}</Text>
      </Pressable>
      {props.loaded && props.suggestions.length === 0 ? <Text style={styles.empty}>No worthwhile detours found on this route.</Text> : null}
      {props.suggestions.map((place) => <Suggestion key={place.place_id} place={place} busy={props.busy} onAdd={props.onAdd} />)}
    </SurfaceCard>
  );
}

function Suggestion({ place, busy, onAdd }: { place: PlaceCandidate; busy: boolean; onAdd: (place: PlaceCandidate) => Promise<void> }): React.ReactElement {
  return (
    <View style={styles.result}>
      <PlaceImage placeId={place.place_id} placePhotoAvailable={place.place_photo_available} fallbackUrl={place.image_url} placeAttributions={place.place_photo_attributions} fallbackAttributions={place.image_attributions} style={styles.image} />
      <View style={styles.resultBody}>
        <Text style={styles.name} numberOfLines={2}>{place.name}</Text>
        <Text style={styles.meta}>{suggestionMeta(place)}</Text>
        <Pressable style={[styles.add, busy && styles.disabled]} disabled={busy} onPress={() => void onAdd(place)}><Text style={styles.addText}>Add to trip</Text></Pressable>
      </View>
    </View>
  );
}

function suggestionMeta(place: PlaceCandidate): string {
  const parts: string[] = [];
  if (place.rating) parts.push(`★ ${place.rating.toFixed(1)}${place.user_rating_count ? ` (${place.user_rating_count.toLocaleString()})` : ""}`);
  if (place.route_distance_meters !== undefined) parts.push(`${detourLabel(place.route_distance_meters)} from route`);
  return parts.join(" | ") || "Popular near your route";
}

function detourLabel(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 50) * 50} m` : `${(meters / 1000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  header: { flexDirection: "row", gap: spacing(3), alignItems: "center" },
  icon: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.kaya, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: spacing(1) },
  title: { ...type.title, color: colors.ink },
  help: { ...type.caption, color: colors.inkSoft },
  find: { minHeight: 46, borderRadius: radius.control, backgroundColor: colors.kayaTint, flexDirection: "row", gap: spacing(2), alignItems: "center", justifyContent: "center" },
  findText: { ...type.label, color: colors.kopi },
  empty: { ...type.caption, color: colors.inkSoft, textAlign: "center" },
  result: { width: "100%", flexDirection: "row", gap: spacing(3), borderTopWidth: 1, borderTopColor: colors.mist, paddingTop: spacing(3), overflow: "hidden" },
  image: { width: 112, height: 112, borderRadius: radius.control },
  resultBody: { flex: 1, minWidth: 0, justifyContent: "center", gap: spacing(1.5), overflow: "hidden" },
  name: { ...type.heading, color: colors.ink },
  meta: { ...type.caption, color: colors.sageDeep },
  add: { alignSelf: "flex-start", borderRadius: radius.control, backgroundColor: colors.halo, paddingHorizontal: spacing(3), paddingVertical: spacing(2) },
  addText: { ...type.label, color: colors.sageDeep },
  disabled: { opacity: 0.5 },
});
