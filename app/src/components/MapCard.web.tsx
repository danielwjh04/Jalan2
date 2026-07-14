import { StyleSheet, Text, View } from "react-native";
import type { MeetingPoint } from "@shared/transit";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";

export function MapCard({
  point,
}: {
  point: MeetingPoint;
}): React.ReactElement {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>MEETING POINT</Text>
      <Text style={styles.name}>{point.name}</Text>
      <Text style={styles.coordinates}>
        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 150,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.mist,
    backgroundColor: colors.halo,
    padding: spacing(5),
    justifyContent: "center",
    gap: spacing(2),
    ...cardShadow,
  },
  label: { ...type.caption, color: colors.inkSoft, letterSpacing: 1.2 },
  name: { ...type.title, color: colors.ink },
  coordinates: { ...type.caption, color: colors.inkSoft },
});
