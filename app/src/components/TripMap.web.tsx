import { StyleSheet, Text, View } from "react-native";
import type { GeoPoint, TripStop } from "@shared/trip";
import { colors, fonts, spacing, type } from "@/lib/theme";

interface Props {
  stops: TripStop[];
  orderedIds: string[];
  path: GeoPoint[];
}

export function TripMap({ stops, orderedIds }: Props): React.ReactElement {
  const ordered = orderedIds
    .map((id) => stops.find((stop) => stop.id === id))
    .filter((stop): stop is TripStop => !!stop);
  return (
    <View style={styles.map}>
      <Text style={styles.label}>ROUTE PREVIEW</Text>
      <View style={styles.route}>
        {ordered.map((stop, index) => (
          <View key={stop.id} style={styles.stop}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
            <Text style={styles.name}>{stop.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    minHeight: 220,
    backgroundColor: colors.tideSoft,
    padding: spacing(6),
    justifyContent: "center",
  },
  label: {
    ...type.caption,
    color: colors.inkSoft,
    letterSpacing: 1.2,
    marginBottom: spacing(4),
  },
  route: { gap: spacing(3) },
  stop: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.tide,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: { color: colors.black, fontFamily: fonts.semibold, fontSize: 13 },
  name: { ...type.label, color: colors.ink },
});
