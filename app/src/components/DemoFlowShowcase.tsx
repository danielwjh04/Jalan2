import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoveryCard } from "@shared/api";
import { mediaUrl } from "@/lib/api";
import { cardShadow, colors, eyebrow, fonts, hairline, radius, spacing, type } from "@/lib/theme";
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
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>LIVE DEMO FLOWS</Text>
          <Text style={styles.heading}>Three stories, one complete product</Text>
          <Text style={styles.intro}>Start with transport, then watch Bobo connect the local people and places the booking platforms miss.</Text>
        </View>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>READY TO RUN</Text></View>
      </View>
      <View style={styles.grid}>
        {featured.map((discovery, index) => (
          <DemoFlowCard key={discovery.id} discovery={discovery} index={index} width={cardWidth} onPress={() => onOpen(discovery.id)} />
        ))}
      </View>
    </View>
  );
}

function DemoFlowCard({ discovery, index, width, onPress }: { discovery: DiscoveryCard; index: number; width: number; onPress: () => void }): React.ReactElement {
  const cover = mediaUrl(discovery.coverUrl);
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.coverWrap}>
        <Pressable accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed} onPress={onPress}>
          {cover ? <Image source={{ uri: cover }} resizeMode="cover" style={styles.cover} /> : <View style={[styles.cover, styles.fallback]} />}
          <View style={styles.demoPill}><Text style={styles.demoText}>DEMO {String(index + 1).padStart(2, "0")}</Text></View>
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
          <Text style={styles.action}>Run this demo</Text>
          <View style={styles.actionIcon}><Ionicons name="arrow-forward" size={16} color={colors.kopi} /></View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(4), marginTop: spacing(2) },
  headingRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: spacing(3) },
  headingCopy: { flex: 1, minWidth: 260, maxWidth: 650, gap: spacing(1) },
  eyebrow: { ...eyebrow },
  heading: { ...type.display, color: colors.ink, fontSize: 28, lineHeight: 34 },
  intro: { ...type.body, color: colors.inkSoft, maxWidth: 620 },
  livePill: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), backgroundColor: colors.confirmSoft, borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(2) },
  liveDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.confirm },
  liveText: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1, color: colors.confirm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(4) },
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...hairline, ...cardShadow },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  coverWrap: { position: "relative" },
  cover: { width: "100%", height: 210 },
  fallback: { backgroundColor: colors.halo },
  demoPill: { position: "absolute", top: spacing(3), left: spacing(3), backgroundColor: "rgba(255,255,255,0.94)", borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5) },
  demoText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.1, color: colors.ink },
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
