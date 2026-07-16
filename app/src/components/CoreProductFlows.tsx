import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from "@/lib/theme";
import { PasteBar } from "./PasteBar";

interface Props {
  prefill: string;
  busy: boolean;
  onSubmit: (raw: string) => void;
  onMultiSource: () => void;
  onMenu: () => void;
  onMenuDemo: () => void;
}

export function CoreProductFlows(props: Props): React.ReactElement {
  const { width } = useWindowDimensions();
  const stacked = width < 820;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>START HERE</Text>
        <Text style={styles.title}>Two ways into Jalan2</Text>
        <Text style={styles.intro}>Bring us the messy local information. Jalan2 turns it into something a traveler can use.</Text>
      </View>
      <View style={[styles.grid, stacked && styles.gridStacked]}>
        <View style={[styles.card, styles.socialCard, stacked && styles.stackedCard]}>
          <FlowHeader
            number="1"
            icon="phone-portrait-outline"
            label="XHS + TIKTOK TO TRIP"
            title="Paste the post. Get the whole itinerary."
            detail="Jalan2 extracts the creator's places and media, grounds them on Google, checks the route, then connects transport and local operators."
          />
          <View style={styles.steps}>
            <Step icon="scan-outline" text="Read the post" />
            <Step icon="location-outline" text="Ground places" />
            <Step icon="map-outline" text="Plan end to end" />
          </View>
          <View style={styles.platforms}>
            <Text style={styles.platform}>小红书 XHS</Text>
            <Text style={styles.platform}>TikTok</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.multiButton} onPress={props.onMultiSource}>
            <Ionicons name="layers-outline" size={19} color={colors.white} />
            <View style={styles.multiCopy}><Text style={styles.multiTitle}>Combine multiple posts</Text><Text style={styles.multiDetail}>Choose places, then optimize one route</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>
          <Text style={styles.quickLabel}>Or start quickly with one post</Text>
          <PasteBar prefill={props.prefill} busy={props.busy} onSubmit={props.onSubmit} />
          <Text style={styles.boundary}>Use a public XHS or TikTok link. Source evidence and uncertain matches stay visible.</Text>
        </View>

        <View style={[styles.card, styles.foodCard, stacked && styles.stackedCard]}>
          <FlowHeader
            number="2"
            icon="restaurant-outline"
            label="KOPITIAM FOOD RECOGNITION"
            title="Scan the menu. Know what you are ordering."
            detail="Read Chinese and handwritten Malay dishes, then swipe through real photos, taste notes, prices, allergens and a local order phrase."
          />
          <View style={styles.foodFeatures}>
            <Feature text="22 visible rows, not just the easy ones" />
            <Feature text="Taste, texture and dietary context" />
            <Feature text="Swipe to build an order shortlist" />
          </View>
          <Pressable accessibilityRole="button" style={styles.primaryButton} disabled={props.busy} onPress={props.onMenu}>
            <Ionicons name="camera-outline" size={19} color={colors.kopi} />
            <Text style={styles.primaryText}>Scan or upload a menu</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} disabled={props.busy} onPress={props.onMenuDemo}>
            <Ionicons name="sparkles-outline" size={18} color={colors.sageDeep} />
            <Text style={styles.secondaryText}>Try the 22-dish demo</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FlowHeader(props: {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  detail: string;
}): React.ReactElement {
  return (
    <View style={styles.flowHeader}>
      <View style={styles.number}><Text style={styles.numberText}>{props.number}</Text></View>
      <View style={styles.flowCopy}>
        <View style={styles.labelRow}><Ionicons name={props.icon} size={17} color={colors.sageDeep} /><Text style={styles.label}>{props.label}</Text></View>
        <Text style={styles.flowTitle}>{props.title}</Text>
        <Text style={styles.detail}>{props.detail}</Text>
      </View>
    </View>
  );
}

function Step({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }): React.ReactElement {
  return <View style={styles.step}><Ionicons name={icon} size={17} color={colors.sageDeep} /><Text style={styles.stepText}>{text}</Text></View>;
}

function Feature({ text }: { text: string }): React.ReactElement {
  return <View style={styles.feature}><Ionicons name="checkmark-circle" size={17} color={colors.confirm} /><Text style={styles.featureText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  section: { gap: spacing(4) },
  heading: { gap: spacing(1), maxWidth: 720 },
  eyebrow: { ...eyebrow },
  title: { ...type.display, color: colors.ink },
  intro: { ...type.body, color: colors.inkSoft },
  grid: { flexDirection: "row", alignItems: "stretch", gap: spacing(4) },
  gridStacked: { flexDirection: "column" },
  card: { minWidth: 0, padding: spacing(5), gap: spacing(3), borderRadius: radius.card, ...hairline, ...cardShadow },
  socialCard: { flex: 1.35, backgroundColor: colors.card },
  foodCard: { flex: 1, backgroundColor: colors.kayaTint },
  stackedCard: { width: "100%" },
  flowHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing(3) },
  number: { width: 38, height: 38, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.sageDeep },
  numberText: { ...type.button, color: colors.white },
  flowCopy: { flex: 1, gap: spacing(1.25) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  label: { ...type.caption, color: colors.sageDeep, letterSpacing: 0.9 },
  flowTitle: { ...type.title, color: colors.ink, fontSize: 22, lineHeight: 28 },
  detail: { ...type.body, color: colors.inkSoft },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  step: { flexDirection: "row", alignItems: "center", gap: spacing(1), paddingHorizontal: spacing(2.5), paddingVertical: spacing(1.5), borderRadius: radius.pill, backgroundColor: colors.halo },
  stepText: { ...type.caption, color: colors.ink },
  platforms: { flexDirection: "row", gap: spacing(2) },
  platform: { ...type.label, color: colors.sageDeep },
  multiButton: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing(2.5), paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.sageDeep },
  multiCopy: { flex: 1 },
  multiTitle: { ...type.button, color: colors.white },
  multiDetail: { ...type.caption, color: colors.halo },
  quickLabel: { ...type.caption, color: colors.inkSoft, marginBottom: -spacing(2) },
  boundary: { ...type.caption, color: colors.inkSoft },
  foodFeatures: { gap: spacing(2) },
  feature: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  featureText: { ...type.label, color: colors.ink, flex: 1 },
  primaryButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(2), paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.kaya },
  primaryText: { ...type.button, color: colors.kopi },
  secondaryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(2), paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.card },
  secondaryText: { ...type.button, color: colors.sageDeep },
});
