import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SavedTripSummary } from "@shared/api";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";

export function SavedTripCard({ trip, onPress }: { trip: SavedTripSummary; onPress: () => void }): React.ReactElement {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {trip.coverUrl ? <Image source={{ uri: trip.coverUrl }} style={styles.image} /> : <View style={[styles.image, styles.fallback]} />}
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{trip.origin === "smart_plan" ? "AGENT-BUILT PLAN" : "SAVED DISCOVERY"}</Text>
        <Text style={styles.title}>{trip.title}</Text>
        <Text style={styles.meta}>{trip.region} | {trip.stopCount} stops</Text>
        <View style={styles.action}><Text style={styles.actionText}>Continue planning</Text><Ionicons name="arrow-forward" size={17} color={colors.kopi} /></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...cardShadow },
  image: { width: "100%", height: 150 },
  fallback: { backgroundColor: colors.halo },
  body: { padding: spacing(4), gap: spacing(1.5) },
  eyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  title: { ...type.title, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft },
  action: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(1) },
  actionText: { ...type.label, color: colors.kopi },
});
