import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DirectoryEntry } from "@shared/api";
import { serverUrl } from "@/lib/api";
import { cardShadow, colors, hairline, radius, spacing, type } from "@/lib/theme";

export function OperatorCard({
  entry,
  onPress,
}: {
  entry: DirectoryEntry;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {entry.coverUrl ? (
        <Image source={{ uri: serverUrl(entry.coverUrl) }} style={styles.image} />
      ) : <View style={[styles.image, styles.fallback]} />}
      <View style={styles.body}>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{entry.source === "fixture" ? "DEMO DISCOVERY" : "LOCAL OPERATOR"}</Text>
          <Text style={[styles.status, entry.optedIn && styles.statusIn]}>
            {entry.optedIn ? "On Jalan2" : "Invitation pending"}
          </Text>
        </View>
        <Text style={styles.name}>{entry.operatorName}</Text>
        <Text style={styles.activity}>{entry.activity}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.inkSoft} />
          <Text style={styles.meta} numberOfLines={1}>{entry.meetingPointName}</Text>
        </View>
        <Text style={styles.signals}>
          {entry.source === "fixture"
            ? "Prepared local demo"
            : `${entry.demandCount} booking ${entry.demandCount === 1 ? "signal" : "signals"}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: "hidden",
    ...hairline,
    ...cardShadow,
  },
  image: { width: "100%", height: 170 },
  fallback: { backgroundColor: colors.halo },
  body: { padding: spacing(4), gap: spacing(1.5) },
  tagRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing(2) },
  tag: { ...type.caption, color: colors.sageDeep, fontSize: 10, letterSpacing: 0.8 },
  status: { ...type.caption, color: colors.inkSoft },
  statusIn: { color: colors.confirm },
  name: { ...type.title, color: colors.ink },
  activity: { ...type.body, color: colors.sageDeep },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  meta: { ...type.caption, color: colors.inkSoft, flex: 1 },
  signals: { ...type.caption, color: colors.inkSoft },
});
