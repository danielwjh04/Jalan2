import { useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";

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
  const openRoute = (): void => { void openExternal(props.stop.transport_url ?? props.stop.easybook_url ?? "", providerName(props.stop)); };
  return (
    <View style={styles.row}>
      <TransitionRail />
      <View style={styles.card}>
        <View style={styles.topline}>
          <Text style={styles.eyebrow}>{intercity ? "INTERCITY TRANSPORT" : "LAST-MILE TRANSFER"}</Text>
          <View style={styles.brand}>
            <Text style={styles.poweredBy}>{ktmb ? "Check with" : easybook ? "Powered by" : "Recommended"}</Text>
            {ktmb ? <Text style={styles.ktmbLogo}>KTMB · KITS</Text> : easybook ? (logoFailed ? <Text style={styles.logoFallback}>easybook</Text> : (
              <Image source={{ uri: EASYBOOK_LOGO }} style={styles.logo} resizeMode="contain" onError={() => setLogoFailed(true)} />
            )) : <Text style={styles.localBrand}>Operator pickup + Grab backup</Text>}
          </View>
        </View>
        <View style={styles.route}>
          <RoutePoint label="FROM" value={props.from} />
          <View style={styles.arrow}><Ionicons name="arrow-forward" size={20} color={colors.danger} /></View>
          <RoutePoint label="TO" value={props.to} />
        </View>
        <View style={styles.meta}>
          <Ionicons name="bus-outline" size={18} color={colors.sageDeep} />
          <Text style={styles.metaText}>{mode} | about {formatDuration(props.stop.duration_minutes)}</Text>
        </View>
        <Text style={styles.summary}>{props.stop.summary}</Text>
        {props.nextStop ? <Text style={styles.continue}>Then Jalan2 continues to {props.nextStop}.</Text> : null}
        <Pressable accessibilityRole="link" style={styles.button} onPress={openRoute}>
          <Text style={styles.buttonText}>{ktmb ? "Check trains on KTMB KITS" : easybook ? "Check live options on EasyBook" : "Check Grab availability"}</Text>
          <Ionicons name="open-outline" size={18} color={colors.white} />
        </Pressable>
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>{intercity ? "Official external ticket-search handoff. No partnership, live inventory or booking confirmation implied." : "Operator pickup is preferred. Grab coverage and fares must be checked in the app."}</Text>
          {props.editable ? <Pressable onPress={props.onRemove}><Text style={styles.remove}>Remove leg</Text></Pressable> : null}
        </View>
      </View>
    </View>
  );
}

function TransitionRail(): React.ReactElement {
  return <View style={styles.rail}><View style={styles.line} /><View style={styles.marker}><Ionicons name="bus" size={17} color={colors.white} /></View><View style={styles.line} /></View>;
}

function RoutePoint({ label, value }: { label: string; value: string }): React.ReactElement {
  return <View style={styles.routePoint}><Text style={styles.routeLabel}>{label}</Text><Text style={styles.routeValue}>{value}</Text></View>;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours} hr` : "", remainder ? `${remainder} min` : ""].filter(Boolean).join(" ");
}

function providerName(stop: TripStop): string {
  if (stop.transport_provider === "operator") return "Grab transport";
  return stop.transport_provider === "ktmb" ? "KTMB KITS" : "EasyBook route";
}

async function openExternal(url: string, label: string): Promise<void> {
  if (url && await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert(`Could not open ${label}`, "Try the link again later.");
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(2), alignItems: "stretch" },
  rail: { width: 36, alignItems: "center" },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.halo },
  marker: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.danger, borderWidth: 3, borderColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  card: { flex: 1, marginBottom: spacing(2), padding: spacing(3.5), gap: spacing(2.5), borderRadius: radius.card, backgroundColor: colors.kayaTint, ...hairline, borderColor: "#E8BC6B" },
  topline: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing(2) },
  eyebrow: { ...type.caption, color: colors.kopi, letterSpacing: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  poweredBy: { ...type.caption, color: colors.inkSoft },
  logo: { width: 124, height: 30 },
  logoFallback: { ...type.title, color: colors.danger, textTransform: "lowercase" },
  ktmbLogo: { ...type.heading, color: colors.danger },
  localBrand: { ...type.label, color: colors.danger },
  route: { flexDirection: "row", alignItems: "center", gap: spacing(2), paddingVertical: spacing(1) },
  routePoint: { flex: 1, gap: spacing(0.5) },
  routeLabel: { ...type.caption, color: colors.inkSoft, letterSpacing: 1 },
  routeValue: { ...type.heading, color: colors.ink },
  arrow: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  metaText: { ...type.label, color: colors.sageDeep },
  summary: { ...type.body, color: colors.inkSoft },
  continue: { ...type.label, color: colors.ink },
  button: { minHeight: 50, borderRadius: radius.control, backgroundColor: colors.danger, paddingHorizontal: spacing(4), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(2) },
  buttonText: { ...type.button, color: colors.white },
  footer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing(2) },
  disclaimer: { ...type.caption, color: colors.inkSoft, flex: 1, minWidth: 200 },
  remove: { ...type.caption, color: colors.danger, textDecorationLine: "underline" },
});
