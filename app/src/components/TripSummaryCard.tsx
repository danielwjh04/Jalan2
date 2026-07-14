import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ItinerarySummary } from "@shared/api";
import { serverUrl } from "@/lib/api";
import { cardShadow, colors, hairline, radius, spacing, type } from "@/lib/theme";
import { StatusPill } from "./StatusPill";

export function TripSummaryCard({
  summary,
  onPress,
  onDelete,
}: {
  summary: ItinerarySummary;
  onPress: () => void;
  onDelete?: () => void;
}): React.ReactElement {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        {summary.coverUrl ? (
          <Image source={{ uri: serverUrl(summary.coverUrl) }} style={styles.image} />
        ) : <View style={[styles.image, styles.fallback]} />}
        <View style={styles.body}>
          <StatusPill status={summary.status} />
          <Text style={styles.title}>{summary.activity ?? "Building your Malaysian trip"}</Text>
          <Text style={styles.operator}>{summary.operatorName ?? stageLabel(summary.stage)}</Text>
          <View style={styles.footer}>
            <Text style={styles.meeting} numberOfLines={1}>
              {summary.meetingPointName ?? "Details are still being prepared"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.sageDeep} />
          </View>
        </View>
      </Pressable>
      {onDelete ? (
        <Pressable accessibilityLabel="Delete failed trip" style={styles.delete} onPress={onDelete}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <Text style={styles.deleteText}>Delete failed trip</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function stageLabel(stage: ItinerarySummary["stage"]): string {
  return stage === "READY" ? "Ready to review" : stage.toLowerCase().replaceAll("_", " ");
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: "hidden",
    ...hairline,
    ...cardShadow,
  },
  image: { width: "100%", height: 150 },
  fallback: { backgroundColor: colors.halo },
  body: { padding: spacing(4), gap: spacing(1.5) },
  title: { ...type.title, color: colors.ink },
  operator: { ...type.label, color: colors.sageDeep },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  meeting: { ...type.caption, color: colors.inkSoft, flex: 1 },
  delete: { minHeight: 46, borderTopWidth: 1, borderTopColor: colors.mist, paddingHorizontal: spacing(4), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(2) },
  deleteText: { ...type.label, color: colors.danger },
});
