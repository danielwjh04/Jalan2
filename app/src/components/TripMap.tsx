import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { GeoPoint, TripStop } from "@shared/trip";
import type { SmartPlanningMetadata } from "@shared/planner";
import { colors } from "@/lib/theme";

interface Props {
  tripId: string;
  stops: TripStop[];
  orderedIds: string[];
  path: GeoPoint[];
  planning?: SmartPlanningMetadata | null;
}

export function TripMap({
  stops,
  orderedIds,
  path,
}: Props): React.ReactElement {
  const selected = orderedIds
    .map((id) => stops.find((stop) => stop.id === id))
    .filter((stop): stop is TripStop => !!stop);
  const points = path.length > 1 ? path : selected.map((stop) => stop.location);
  const region = mapRegion(points);
  return (
    <View style={styles.frame}>
      <MapView
        style={styles.map}
        initialRegion={region}
      >
        {points.length > 1 ? (
          <Polyline
            coordinates={points.map((point) => ({
              latitude: point.lat,
              longitude: point.lng,
            }))}
            strokeColor={colors.sage}
            strokeWidth={4}
          />
        ) : null}
        {selected.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.location.lat,
              longitude: stop.location.lng,
            }}
            title={`${index + 1}. ${stop.name}`}
            pinColor={index === 0 ? colors.kaya : colors.sage}
          />
        ))}
      </MapView>
    </View>
  );
}

function mapRegion(points: GeoPoint[]): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  const safe = points.length ? points : [{ lat: 1.56, lng: 110.35 }];
  const lats = safe.map((point) => point.lat);
  const lngs = safe.map((point) => point.lng);
  const latitudeDelta = Math.max(0.08, (Math.max(...lats) - Math.min(...lats)) * 1.35);
  const longitudeDelta = Math.max(0.08, (Math.max(...lngs) - Math.min(...lngs)) * 1.35);
  return { latitude: (Math.max(...lats) + Math.min(...lats)) / 2, longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2, latitudeDelta, longitudeDelta };
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.mist },
  map: { width: "100%", height: 300 },
});
