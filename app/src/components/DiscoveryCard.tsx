import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoveryCard as DiscoveryCardData } from "@shared/api";
import { cardShadow, colors, fonts, hairline, radius, spacing, type } from "@/lib/theme";
import { ImageAttribution } from "./ImageAttribution";

interface Props {
  discovery: DiscoveryCardData;
  onPress: () => void;
  onPlan: () => void;
  savedTripId?: string;
  planning?: boolean;
}

export function DiscoveryCard({ discovery, onPress, onPlan, savedTripId, planning = false }: Props): React.ReactElement {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.coverWrap}>
          {discovery.coverUrl ? (
            <Image source={{ uri: discovery.coverUrl }} style={styles.cover} />
          ) : <View style={[styles.cover, styles.coverFallback]} />}
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>CURATED TRIP</Text>
          </View>
        </View>
        <View style={styles.body}>
          <ImageAttribution items={discovery.coverAttributions} />
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.inkSoft} />
            <Text style={styles.meta}>{discovery.region}</Text>
          </View>
          <Text style={styles.title}>{discovery.title}</Text>
          <Text style={styles.summary} numberOfLines={2}>{discovery.summary}</Text>
        </View>
      </Pressable>
      <View style={styles.footer}>
        <Text style={styles.metrics}>{discovery.stopCount} stops | {durationLabel(discovery.durationMinutes)}</Text>
        <Pressable style={styles.action} disabled={planning} onPress={onPlan}>
          {planning ? <ActivityIndicator color={colors.kopi} /> : <Text style={styles.actionText}>{savedTripId ? "Open my trip" : "Plan this trip"}</Text>}
          {!planning ? <Ionicons name="arrow-forward" size={16} color={colors.kopi} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...hairline, ...cardShadow },
  coverWrap: { position: "relative" },
  cover: { width: "100%", height: 200 },
  coverFallback: { backgroundColor: colors.halo },
  sourcePill: { position: "absolute", top: spacing(3), left: spacing(3), backgroundColor: "rgba(255,255,255,0.92)", borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5) },
  sourceText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1 },
  body: { padding: spacing(4), gap: spacing(1.5) },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  meta: { ...type.caption, color: colors.inkSoft },
  title: { ...type.title, color: colors.ink },
  summary: { ...type.body, color: colors.inkSoft },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing(2), paddingHorizontal: spacing(4), paddingBottom: spacing(4) },
  metrics: { ...type.label, color: colors.sageDeep },
  action: { minHeight: 40, flexDirection: "row", gap: spacing(1), borderRadius: radius.pill, backgroundColor: colors.kaya, paddingHorizontal: spacing(3), alignItems: "center", justifyContent: "center" },
  actionText: { ...type.label, color: colors.kopi },
});
