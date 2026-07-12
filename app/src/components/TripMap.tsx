import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { GeoPoint, TripStop } from "@shared/trip";
import { colors } from "@/lib/theme";

interface Props {
  stops: TripStop[];
  orderedIds: string[];
  path: GeoPoint[];
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
  const first = selected[0]?.location ?? { lat: 1.56, lng: 110.35 };
  return (
    <View style={styles.frame}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: first.lat,
          longitude: first.lng,
          latitudeDelta: 0.22,
          longitudeDelta: 0.22,
        }}
      >
        {points.length > 1 ? (
          <Polyline
            coordinates={points.map((point) => ({
              latitude: point.lat,
              longitude: point.lng,
            }))}
            strokeColor={colors.tide}
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
            pinColor={index === 0 ? colors.sun : colors.tide}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.mist },
  map: { width: "100%", height: 300 },
});
