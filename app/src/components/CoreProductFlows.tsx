import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from "@/lib/theme";
import { MenuHowItWorks } from "./MenuHowItWorks";
import { SocialGuideComposer } from "./SocialGuideComposer";

interface Props {
  prefill: string;
  busy: boolean;
  onGenerate: (urls: string[]) => void;
  onMenu: () => void;
  onMenuDemo: () => void;
}

export function CoreProductFlows(props: Props): React.ReactElement {
  const { width } = useWindowDimensions();
  const [showMenuHelp, setShowMenuHelp] = useState(false);
  const stacked = width < 820;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>START HERE</Text>
        <Text style={styles.title}>What would you like to create?</Text>
      </View>
      <View style={[styles.grid, stacked && styles.gridStacked]}>
        <View style={[styles.card, styles.socialCard, stacked && styles.stackedCard]}>
          <FlowHeader icon="phone-portrait-outline" label="XHS + TIKTOK TO TRIP" title="Turn saved posts into one guide" detail="Add one or more public links, then generate a guide with every place in route order." />
          <SocialGuideComposer prefill={props.prefill} busy={props.busy} onGenerate={props.onGenerate} />
        </View>
        <View style={[styles.card, styles.foodCard, stacked && styles.stackedCard]}>
          <View style={styles.foodHeader}>
            <FlowHeader icon="restaurant-outline" label="KOPITIAM FOOD RECOGNITION" title="Know what you are ordering" detail="Scan a menu for dish photos, taste notes and a local ordering phrase." />
            <Pressable accessibilityLabel="How menu scanning works" accessibilityRole="button" onPress={() => setShowMenuHelp(true)} style={styles.helpButton}>
              <Ionicons name="help" size={19} color={colors.sageDeep} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onMenu} style={styles.primaryButton}>
            <Ionicons name="camera-outline" size={19} color={colors.kopi} />
            <Text style={styles.primaryText}>Scan or upload a menu</Text>
          </Pressable>
        </View>
      </View>
      <MenuHowItWorks visible={showMenuHelp} busy={props.busy} onClose={() => setShowMenuHelp(false)} onDemo={props.onMenuDemo} />
    </View>
  );
}

function FlowHeader({ icon, label, title, detail }: { icon: keyof typeof Ionicons.glyphMap; label: string; title: string; detail: string }): React.ReactElement {
  return (
    <View style={styles.flowCopy}>
      <View style={styles.labelRow}><Ionicons name={icon} size={17} color={colors.sageDeep} /><Text style={styles.label}>{label}</Text></View>
      <Text style={styles.flowTitle}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(4) },
  heading: { gap: spacing(1), maxWidth: 720 },
  eyebrow: { ...eyebrow },
  title: { ...type.display, color: colors.ink },
  grid: { flexDirection: "row", alignItems: "stretch", gap: spacing(4) },
  gridStacked: { flexDirection: "column" },
  card: { minWidth: 0, padding: spacing(5), gap: spacing(4), borderRadius: radius.card, ...hairline, ...cardShadow },
  socialCard: { flex: 1.35, backgroundColor: colors.card },
  foodCard: { flex: 1, backgroundColor: colors.kayaTint },
  stackedCard: { width: "100%" },
  flowCopy: { flex: 1, gap: spacing(1.25) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  label: { ...type.caption, color: colors.sageDeep, letterSpacing: 0.9 },
  flowTitle: { ...type.title, color: colors.ink, fontSize: 22, lineHeight: 28 },
  detail: { ...type.body, color: colors.inkSoft },
  foodHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2) },
  helpButton: { width: 40, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  primaryButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(2), borderRadius: radius.control, backgroundColor: colors.kaya, paddingHorizontal: spacing(3) },
  primaryText: { ...type.button, color: colors.kopi },
});
