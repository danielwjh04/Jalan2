import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { TimelineRail } from "./TimelineRail";

export function TripOriginCard({ name }: { name: string }): React.ReactElement {
  return (
    <View style={styles.row}>
      <TimelineRail position={0} isLast={false} />
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="location-outline" size={20} color={colors.sageDeep} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>START HERE</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.note}>Your journey begins here.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(2), alignItems: "stretch" },
  card: {
    flex: 1,
    minHeight: 96,
    marginBottom: spacing(2),
    padding: spacing(3),
    borderRadius: radius.card,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    ...hairline,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.halo,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: spacing(0.5) },
  label: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  name: { ...type.heading, color: colors.ink },
  note: { ...type.caption, color: colors.inkSoft },
});
