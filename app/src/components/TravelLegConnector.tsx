import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import {
  destinationLabel,
  googleDirectionsUrl,
  GRAB_BOOKING_URL,
  initialTravelMode,
  travelEstimate,
  type LocalTravelMode,
  type PlanningLeg,
} from "@/lib/travelLeg";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  from: TripStop;
  to: TripStop;
  leg?: PlanningLeg;
}

const MODES: Array<{ id: LocalTravelMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "walk", label: "Walk", icon: "walk-outline" },
  { id: "transit", label: "Transit", icon: "train-outline" },
  { id: "drive", label: "Drive", icon: "car-outline" },
  { id: "grab", label: "Grab", icon: "navigate-circle-outline" },
];

export function TravelLegConnector({ from, to, leg }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<LocalTravelMode>(() => initialTravelMode(leg, from, to));
  const [copied, setCopied] = useState(false);
  const estimate = useMemo(() => travelEstimate(mode, from, to, leg), [from, leg, mode, to]);
  const fixedTransfer = fixedTransferPresentation(leg);
  const selected = fixedTransfer ?? MODES.find((option) => option.id === mode) ?? MODES[0];
  const distance = estimate.distanceMeters < 1_000
    ? `${Math.max(10, Math.round(estimate.distanceMeters / 10) * 10)} m`
    : `${(estimate.distanceMeters / 1_000).toFixed(1)} km`;

  const openRoute = async (): Promise<void> => {
    if (fixedTransfer) {
      if (leg?.handoff_url && await tryOpenExternalUrl(leg.handoff_url, Linking.openURL)) return;
      Alert.alert("Transfer not confirmed", "Open the named provider or ask the local operator to confirm this exact transfer, fare and timing.");
      return;
    }
    if (mode === "grab") {
      await Clipboard.setStringAsync(destinationLabel(to));
      setCopied(true);
      if (await tryOpenExternalUrl(GRAB_BOOKING_URL, Linking.openURL)) return;
      Alert.alert("Could not open Grab", "The exact destination was copied. Paste it into Grab when the app is available.");
      return;
    }
    if (await tryOpenExternalUrl(googleDirectionsUrl(mode, from, to), Linking.openURL)) return;
    Alert.alert("Could not open directions", "Try Google Maps again later.");
  };

  return (
    <View style={styles.row}>
      <View style={styles.rail}><View style={styles.dashes} /></View>
      <View style={styles.connector}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change transport from ${from.name} to ${to.name}`}
          accessibilityState={{ expanded }}
          style={({ pressed }) => [styles.summary, fixedTransfer && styles.fixedSummary, pressed && styles.pressed]}
          onPress={() => setExpanded((value) => !value)}
        >
          <Ionicons name={selected.icon} size={17} color={colors.sageDeep} />
          <Text numberOfLines={1} style={styles.summaryText}>
            {estimate.evidence === "provider_verified" ? "" : "~"}{estimate.durationMinutes} min {selected.label.toLowerCase()} · {distance}{leg?.mode === "ferry" ? " · fare unknown" : leg?.booking === "external_search" ? " · live fare" : ""}
          </Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.inkSoft} />
        </Pressable>
        <Pressable accessibilityRole="link" style={styles.directions} onPress={() => void openRoute()}>
          <Text style={styles.directionsText}>{fixedTransfer ? fixedTransfer.action : mode === "grab" ? (copied ? "Destination copied" : "Open Grab") : "Directions"}</Text>
        </Pressable>
        {expanded ? (
          <View style={styles.panel}>
            <Text style={styles.fromTo} numberOfLines={1}>{from.name} → {to.name}</Text>
            {!fixedTransfer ? <View style={styles.options}>
              {MODES.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option.label} from ${from.name} to ${to.name}`}
                  accessibilityState={{ selected: mode === option.id }}
                  style={[styles.option, mode === option.id && styles.optionSelected]}
                  onPress={() => { setMode(option.id); setCopied(false); }}
                >
                  <Ionicons name={option.icon} size={17} color={mode === option.id ? colors.white : colors.sageDeep} />
                  <Text style={[styles.optionText, mode === option.id && styles.optionTextSelected]}>{option.label}</Text>
                </Pressable>
              ))}
            </View> : null}
            <Text style={styles.note}>
              {fixedTransfer
                ? leg?.explanation
                : mode === "grab"
                ? "Jalan2 copies the exact next-stop address, then opens Grab's official booking screen."
                : estimate.evidence === "provider_verified"
                  ? "Travel time comes from the route provider."
                  : "Travel time is an estimate; Google Maps confirms the live route."}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function fixedTransferPresentation(leg: PlanningLeg | undefined): { label: string; action: string; icon: keyof typeof Ionicons.glyphMap } | null {
  if (leg?.mode === "ferry") return { label: "Water taxi", action: "Transfer info", icon: "boat-outline" };
  if (leg?.provider === "operator" && /tioman|village corridor|water taxi|4wd/i.test(leg.explanation)) {
    return { label: leg.mode === "operator_pickup" ? "Local shuttle" : "Island transfer", action: "Transfer info", icon: "car-outline" };
  }
  if (leg?.provider === "ktmb") return { label: "KTMB train", action: "Open KITS", icon: "train-outline" };
  if (leg?.provider === "easybook") return { label: "EasyBook", action: "Open EasyBook", icon: "bus-outline" };
  if (leg?.mode === "flight") return { label: "Flight", action: "Search flights", icon: "airplane-outline" };
  return null;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch", minHeight: 62 },
  rail: { width: 46, alignItems: "center" },
  dashes: { flex: 1, width: 2, borderLeftWidth: 2, borderStyle: "dashed", borderColor: colors.mist },
  connector: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing(1), paddingVertical: spacing(2) },
  summary: { minHeight: 40, maxWidth: "72%", flexDirection: "row", alignItems: "center", gap: spacing(1.5), paddingHorizontal: spacing(2.5), borderRadius: radius.pill, backgroundColor: colors.halo },
  pressed: { opacity: 0.72 },
  fixedSummary: { backgroundColor: colors.pendingSoft },
  summaryText: { ...type.label, flexShrink: 1, color: colors.ink },
  directions: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing(1.5) },
  directionsText: { ...type.label, color: colors.sageDeep, textDecorationLine: "underline" },
  panel: { width: "100%", gap: spacing(2), padding: spacing(2.5), marginBottom: spacing(1), borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.mist },
  fromTo: { ...type.caption, color: colors.inkSoft },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1) },
  option: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: spacing(1), paddingHorizontal: spacing(2.25), borderRadius: radius.pill, backgroundColor: colors.canvas },
  optionSelected: { backgroundColor: colors.sageDeep },
  optionText: { ...type.label, color: colors.sageDeep },
  optionTextSelected: { color: colors.white },
  note: { ...type.caption, color: colors.inkSoft },
});
