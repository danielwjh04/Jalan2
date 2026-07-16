import { StyleSheet, Text, View } from "react-native";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { TimelineRail } from "./TimelineRail";

export function TripOriginCard({ name }: { name: string }): React.ReactElement {
  return (
    <View style={styles.row}>
      <TimelineRail variant="origin" isLast={false} />
      <View style={styles.card}>
        <Text style={styles.label}>START HERE</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.note}>Your journey begins here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(2), alignItems: "stretch" },
  card: {
    flex: 1,
    minHeight: 84,
    marginBottom: spacing(2),
    padding: spacing(3),
    borderRadius: radius.card,
    backgroundColor: colors.card,
    justifyContent: "center",
    gap: spacing(0.5),
    ...hairline,
  },
  label: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  name: { ...type.heading, color: colors.ink },
  note: { ...type.caption, color: colors.inkSoft },
});
