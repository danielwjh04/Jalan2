import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import type { TripStop } from "@shared/trip";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { formatDuration } from "@/lib/travelLeg";
import { openGrab } from "@/lib/travelActions";
import { ActionButton } from "./ActionButton";
import { TimelineRail } from "./TimelineRail";

const EASYBOOK_LOGO = "https://upload.wikimedia.org/wikipedia/commons/5/54/Easybook-logo.png";

interface Props {
  stop: TripStop;
  from: string;
  to: string;
  nextStop?: TripStop;
  editable: boolean;
  onRemove: () => void;
}

export function EasybookTransitionCard(props: Props): React.ReactElement {
  const [logoFailed, setLogoFailed] = useState(false);
  const easybook = props.stop.transport_provider === "easybook" || Boolean(props.stop.easybook_url);
  const ktmb = props.stop.transport_provider === "ktmb";
  const choice = ktmb && Boolean(props.stop.easybook_url);
  const intercity = easybook || ktmb;
  const mode = props.stop.transport_mode ?? (props.stop.sources.length > 1 ? "Coach + ferry" : "Coach");
  const routeFrom = props.stop.transport_from ?? props.from;
  const routeTo = props.stop.transport_to ?? props.to;
  const ktmRouteUrl = routeBookingUrl("train", routeFrom, routeTo, props.stop.transport_url);
  const coachRouteUrl = routeBookingUrl("bus", routeFrom, routeTo, props.stop.easybook_url);
  const openRoute = (): void =>
    void openExternal(ktmb ? ktmRouteUrl : coachRouteUrl, providerName(props.stop));
  return (
    <View style={styles.row}>
      <TimelineRail variant="transport" isLast={false} />
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{intercity ? "INTERCITY TRANSPORT" : "LAST-MILE TRANSFER"}</Text>
          {ktmb ? (
            <Text style={styles.wordmark}>{choice ? "KTMB or EasyBook" : "KTMB · KITS"}</Text>
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
          {props.nextStop ? <Text style={styles.continue}>Then Jalan2 continues to {props.nextStop.name}.</Text> : null}
          <ActionButton
            variant="primary"
            block
            accessibilityRole="link"
            label={ktmb ? "Search KTM ETS route" : easybook ? "Open EasyBook route" : "Check transfer"}
            onPress={openRoute}
          />
          {choice ? (
            <ActionButton
              variant="tonal"
              block
              accessibilityRole="link"
              label="Compare exact coach route"
              onPress={() => void openExternal(coachRouteUrl, "EasyBook")}
            />
          ) : null}
          {props.nextStop ? (
            <ActionButton
              variant="tonal"
              block
              accessibilityRole="link"
              label="Open Grab from arrival"
              onPress={() => void openGrab(props.nextStop!)}
            />
          ) : null}
          <Text style={styles.disclaimer}>
            {intercity
              ? "Exact origin and destination are prefilled. Select the travel date; no live inventory or booking is confirmed in Jalan2."
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

function routeBookingUrl(
  product: "train" | "bus",
  from: string,
  to: string,
  fallback?: string | null,
): string {
  const origin = from.toLowerCase();
  const destination = to.toLowerCase();
  const fromKl = origin.includes("kuala lumpur") || origin.includes("kl sentral");
  const toKl = destination.includes("kuala lumpur") || destination.includes("kl sentral");
  const fromIpoh = origin.includes("ipoh");
  const toIpoh = destination.includes("ipoh");

  if (fromKl && toIpoh) return `https://www.easybook.com/en-my/${product}/booking/klsentral-to-ipoh`;
  if (fromIpoh && toKl) return `https://www.easybook.com/en-my/${product}/booking/ipoh-to-klsentral`;
  return fallback ?? "";
}

async function openExternal(url: string, label: string): Promise<void> {
  if (url && (await tryOpenExternalUrl(url))) return;
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
