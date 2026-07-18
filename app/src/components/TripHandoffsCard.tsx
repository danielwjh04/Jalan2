import { Alert, StyleSheet, Text, View } from "react-native";
import type { SmartPlanningMetadata } from "@shared/planner";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { colors, spacing, type } from "@/lib/theme";
import { ActionButton } from "./ActionButton";
import { SurfaceCard } from "./SurfaceCard";

interface Props {
  planning?: SmartPlanningMetadata | null;
}

export function TripHandoffsCard({ planning }: Props): React.ReactElement | null {
  if (!planning?.handoffs.length) return null;
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>BOOKING & TRANSPORT LINKS</Text>
        <Text style={styles.title}>Finish the plan with the real providers</Text>
        <Text style={styles.note}>Opening a provider does not confirm a seat, room, fare or operator.</Text>
      </View>
      {planning.handoffs.map((handoff, index) => (
        <View key={`${handoff.provider}-${handoff.label}-${index}`} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.provider}>{handoff.provider}</Text>
            <Text style={styles.label}>{handoff.label}</Text>
            <Text style={styles.disclaimer}>{handoff.disclaimer}</Text>
          </View>
          <ActionButton
            variant={handoff.url ? "tonal" : "ghost"}
            accessibilityRole={handoff.url ? "link" : "button"}
            label={handoff.url ? "Open" : "Confirm locally"}
            onPress={() => void openHandoff(routeAwareHandoffUrl(handoff.url, handoff.provider, handoff.label), handoff.provider, handoff.disclaimer)}
          />
        </View>
      ))}
    </SurfaceCard>
  );
}

function routeAwareHandoffUrl(url: string | null, provider: string, label: string): string | null {
  const context = `${provider} ${label}`.toLowerCase();
  if (!context.includes("ipoh") || (!context.includes("kuala lumpur") && !context.includes("kl "))) return url;
  if (context.includes("ktm") || context.includes("ets")) {
    return "https://www.easybook.com/en-my/train/booking/klsentral-to-ipoh";
  }
  if (context.includes("easybook") || context.includes("coach")) {
    return "https://www.easybook.com/en-my/bus/booking/klsentral-to-ipoh";
  }
  return url;
}

async function openHandoff(url: string | null, provider: string, disclaimer: string): Promise<void> {
  if (url && await tryOpenExternalUrl(url)) return;
  Alert.alert(
    url ? `Could not open ${provider}` : `${provider} needs confirmation`,
    url ? "The provider link did not open. No booking was made." : disclaimer,
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  heading: { gap: spacing(1) },
  eyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  title: { ...type.heading, color: colors.ink },
  note: { ...type.caption, color: colors.inkSoft },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(2), paddingTop: spacing(2), borderTopWidth: 1, borderTopColor: colors.mist },
  copy: { flex: 1, gap: spacing(0.5) },
  provider: { ...type.label, color: colors.sageDeep },
  label: { ...type.body, color: colors.ink },
  disclaimer: { ...type.caption, color: colors.inkSoft },
});
