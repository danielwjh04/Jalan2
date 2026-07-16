import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoveryCard } from "@shared/api";
import { mediaUrl } from "@/lib/api";
import { cardShadow, colors, hairline, radius, spacing, type } from "@/lib/theme";
import { ImageAttribution } from "./ImageAttribution";

interface Props {
  discoveries: DiscoveryCard[];
  onOpen: (id: string) => void;
}

export function DemoFlowShowcase({ discoveries, onOpen }: Props): React.ReactElement | null {
  const { width } = useWindowDimensions();
  const featured = discoveries.filter(({ featured }) => featured).slice(0, 3);
  if (featured.length === 0) return null;
  const available = Math.min(width - spacing(10), 1180);
  const columns = available >= 960 ? 3 : available >= 620 ? 2 : 1;
  const cardWidth = (available - spacing(4) * (columns - 1)) / columns;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Guides other users created</Text>
      <View style={styles.grid}>
        {featured.map((discovery) => (
          <DemoFlowCard key={discovery.id} discovery={discovery} width={cardWidth} onPress={() => onOpen(discovery.id)} />
        ))}
      </View>
    </View>
  );
}

function DemoFlowCard({ discovery, width, onPress }: { discovery: DiscoveryCard; width: number; onPress: () => void }): React.ReactElement {
  const cover = mediaUrl(discovery.coverUrl);
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.coverWrap}>
        <Pressable accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed} onPress={onPress}>
          {cover ? <Image source={{ uri: cover }} resizeMode="cover" style={styles.cover} /> : <View style={[styles.cover, styles.fallback]} />}
        </Pressable>
        <ImageAttribution items={discovery.coverAttributions} />
      </View>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.body, pressed && styles.pressed]} onPress={onPress}>
        <View style={styles.transportRow}>
          <Ionicons name="navigate-circle-outline" size={18} color={colors.sageDeep} />
          <Text style={styles.transport}>{discovery.transportLabel}</Text>
        </View>
        <Text style={styles.title}>{discovery.title}</Text>
        <Text style={styles.summary} numberOfLines={3}>{discovery.summary}</Text>
        <View style={styles.highlights}>
          {discovery.highlights.map((highlight) => <Text key={highlight} style={styles.highlight} numberOfLines={1}>{highlight}</Text>)}
        </View>
        <View style={styles.actionRow}>
          <Text style={styles.action}>Open guide</Text>
          <View style={styles.actionIcon}><Ionicons name="arrow-forward" size={16} color={colors.kopi} /></View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(4), marginTop: spacing(2) },
  heading: { ...type.display, color: colors.ink, fontSize: 28, lineHeight: 34 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(4) },
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...hairline, ...cardShadow },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  coverWrap: { position: "relative" },
  cover: { width: "100%", height: 210 },
  fallback: { backgroundColor: colors.halo },
  body: { padding: spacing(4), gap: spacing(2) },
  transportRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  transport: { ...type.label, color: colors.sageDeep },
  title: { ...type.title, color: colors.ink },
  summary: { ...type.body, color: colors.inkSoft },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  highlight: { ...type.caption, color: colors.ink, backgroundColor: colors.halo, borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1), maxWidth: "100%" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing(1) },
  action: { ...type.button, color: colors.kopi },
  actionIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.kaya },
});
