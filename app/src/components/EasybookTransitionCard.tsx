import { useState } from "react";
import { Alert, Image, Linking, StyleSheet, Text, View } from "react-native";
import type { TripStop } from "@shared/trip";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { formatDuration } from "@/lib/travelLeg";
import { ActionButton } from "./ActionButton";
import { TimelineRail } from "./TimelineRail";

const EASYBOOK_LOGO = "https://upload.wikimedia.org/wikipedia/commons/5/54/Easybook-logo.png";

interface Props {
  stop: TripStop;
  from: string;
  to: string;
  nextStop?: string;
  editable: boolean;
  onRemove: () => void;
}

export function EasybookTransitionCard(props: Props): React.ReactElement {
  const [logoFailed, setLogoFailed] = useState(false);
  const easybook = props.stop.transport_provider === "easybook" || Boolean(props.stop.easybook_url);
  const ktmb = props.stop.transport_provider === "ktmb";
  const intercity = easybook || ktmb;
  const mode = props.stop.transport_mode ?? (props.stop.sources.length > 1 ? "Coach + ferry" : "Coach");
  const openRoute = (): void =>
    void openExternal(props.stop.transport_url ?? props.stop.easybook_url ?? "", providerName(props.stop));
  return (
    <View style={styles.row}>
      <TimelineRail variant="transport" isLast={false} />
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{intercity ? "INTERCITY TRANSPORT" : "LAST-MILE TRANSFER"}</Text>
          {ktmb ? (
            <Text style={styles.wordmark}>KTMB · KITS</Text>
          ) : easybook ? (
            logoFailed ? (
              <Text style={styles.wordmark}>EasyBook</Text>
            ) : (
              <Image
                source={{ uri: EASYBOOK_LOGO }}
                style={styles.logo}
                resizeMode="contain"
                onError={() => setLogoFailed(true)}
              />
            )
          ) : (
            <Text style={styles.wordmarkSoft}>Operator pickup</Text>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.route}>
            {props.from} to {props.to}
          </Text>
          <Text style={styles.meta}>
            {mode} · about {formatDuration(props.stop.duration_minutes)}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {props.stop.summary}
          </Text>
          {props.nextStop ? <Text style={styles.continue}>Then Jalan2 continues to {props.nextStop}.</Text> : null}
          <ActionButton
            variant="primary"
            block
            accessibilityRole="link"
            label={ktmb ? "Open KITS" : easybook ? "Check on EasyBook" : "Check Grab availability"}
            onPress={openRoute}
          />
          <Text style={styles.disclaimer}>
            {intercity
              ? "External search only. No live inventory or booking confirmed."
              : "Operator pickup preferred. Check Grab coverage and fares in the app."}
          </Text>
          {props.editable ? (
            <ActionButton variant="ghost" underline label="Remove leg" onPress={props.onRemove} style={styles.remove} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function providerName(stop: TripStop): string {
  if (stop.transport_provider === "operator") return "Grab transport";
  return stop.transport_provider === "ktmb" ? "KTMB KITS" : "EasyBook route";
}

async function openExternal(url: string, label: string): Promise<void> {
  if (url && (await tryOpenExternalUrl(url, Linking.openURL))) return;
  Alert.alert(`Could not open ${label}`, "Try the link again later.");
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(2), alignItems: "stretch" },
  card: {
    flex: 1,
    marginBottom: spacing(2),
    borderRadius: radius.card,
    backgroundColor: colors.card,
    overflow: "hidden",
    ...hairline,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(2),
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
  },
  eyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  wordmark: { ...type.heading, color: colors.ink },
  wordmarkSoft: { ...type.label, color: colors.inkSoft },
  logo: { width: 116, height: 26 },
  body: { padding: spacing(3.5), gap: spacing(2) },
  route: { ...type.heading, color: colors.ink },
  meta: { ...type.label, color: colors.sageDeep },
  summary: { ...type.body, color: colors.inkSoft },
  continue: { ...type.label, color: colors.ink },
  disclaimer: { ...type.caption, color: colors.inkSoft },
  remove: { alignSelf: "flex-start" },
});
