import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoveryCard as DiscoveryCardData, FixtureCard as FixtureCardData } from "@shared/api";
import { DiscoveryCard } from "./DiscoveryCard";
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from "@/lib/theme";

interface QuickActionsProps {
  busy: boolean;
  onMenu: () => void;
  onOperators: () => void;
}

export function HomeQuickActions(props: QuickActionsProps): React.ReactElement {
  return (
    <View style={styles.quickCard}>
      <QuickAction icon="restaurant-outline" tint={colors.kayaTint} title="Scan a kopitiam menu" detail="Dishes, prices and how to order" disabled={props.busy} onPress={props.onMenu} />
      <View style={styles.quickDivider} />
      <QuickAction icon="people-outline" tint={colors.halo} title="Meet the local operators" detail="The people behind the trips" onPress={props.onOperators} />
    </View>
  );
}

interface DiscoveryProps {
  discoveries: DiscoveryCardData[];
  devFixture?: FixtureCardData;
  busy: boolean;
  onOpen: (id: string) => void;
  onSubmit: (url: string) => void;
  onSeeAll: () => void;
}

export function HomeDiscoveryPreview(props: DiscoveryProps): React.ReactElement | null {
  if (props.discoveries.length === 0) return null;
  return (
    <>
      <View style={styles.sectionRow}>
        <View><Text style={styles.section}>SOCIAL DISCOVERIES</Text><Text style={styles.sectionTitle}>Discover Malaysia</Text></View>
        <Pressable style={styles.seeAll} onPress={props.onSeeAll}>
          <Text style={styles.seeAllText}>See all</Text><Ionicons name="arrow-forward" size={14} color={colors.sageDeep} />
        </Pressable>
      </View>
      {props.discoveries.map((discovery) => (
        <DiscoveryCard
          key={discovery.id}
          discovery={discovery}
          onPress={() => props.onOpen(discovery.id)}
        />
      ))}
      {__DEV__ && props.devFixture ? <DevShare fixture={props.devFixture} busy={props.busy} onSubmit={props.onSubmit} /> : null}
    </>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  detail: string;
  disabled?: boolean;
  onPress: () => void;
}

function QuickAction(props: QuickActionProps): React.ReactElement {
  const color = props.icon === "restaurant-outline" ? colors.kopi : colors.sageDeep;
  return (
    <Pressable style={styles.quickRow} disabled={props.disabled} onPress={props.onPress}>
      <View style={[styles.quickIcon, { backgroundColor: props.tint }]}><Ionicons name={props.icon} size={19} color={color} /></View>
      <View style={styles.quickCopy}><Text style={styles.quickTitle}>{props.title}</Text><Text style={styles.quickSub}>{props.detail}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
    </Pressable>
  );
}

function DevShare({ fixture, busy, onSubmit }: { fixture: FixtureCardData; busy: boolean; onSubmit: (url: string) => void }): React.ReactElement {
  return <Pressable style={styles.devButton} disabled={busy} onPress={() => onSubmit(fixture.url)}><Text style={styles.devButtonText}>Simulate iOS share (dev)</Text></Pressable>;
}

const styles = StyleSheet.create({
  quickCard: { backgroundColor: colors.card, borderRadius: radius.card, ...hairline, ...cardShadow },
  quickRow: { flexDirection: "row", alignItems: "center", gap: spacing(3), paddingHorizontal: spacing(4), paddingVertical: spacing(3.5) },
  quickDivider: { height: 1, backgroundColor: colors.mist, marginLeft: spacing(13) },
  quickIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickCopy: { flex: 1, gap: 1 },
  quickTitle: { ...type.label, color: colors.ink, fontSize: 14 },
  quickSub: { ...type.caption, color: colors.inkSoft },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing(2) },
  section: { ...eyebrow },
  sectionTitle: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  seeAll: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  seeAllText: { ...type.label, color: colors.sageDeep },
  devButton: { borderColor: colors.mist, borderWidth: 1, borderStyle: "dashed", borderRadius: radius.control, padding: spacing(3), alignItems: "center", marginTop: spacing(1) },
  devButtonText: { ...type.caption, color: colors.inkSoft },
});
