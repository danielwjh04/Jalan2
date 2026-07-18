import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import {
  formatDistance,
  formatDuration,
  googleDirectionsUrl,
  initialTravelMode,
  travelEstimate,
  type LocalTravelMode,
  type PlanningLeg,
  type TravelEstimate,
} from "@/lib/travelLeg";
import { openGrab } from "@/lib/travelActions";
import { colors, radius, spacing, type } from "@/lib/theme";
import { ActionButton } from "./ActionButton";
import { Chip } from "./Chip";
import { TimelineRail } from "./TimelineRail";

interface Props {
  from: TripStop;
  to: TripStop;
  leg?: PlanningLeg;
}

interface FixedTransfer {
  label: string;
  action: string;
  bundled?: boolean;
}

const MODES: Array<{ id: LocalTravelMode; label: string }> = [
  { id: "walk", label: "Walk" },
  { id: "transit", label: "Transit" },
  { id: "drive", label: "Drive" },
  { id: "grab", label: "Grab" },
];

export function TravelLegConnector({ from, to, leg }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<LocalTravelMode>(() => initialTravelMode(leg, from, to));
  const estimate = useMemo(() => travelEstimate(mode, from, to, leg), [from, leg, mode, to]);
  const fixed = fixedTransfer(leg);
  const action = fixed ? fixed.action : mode === "grab" ? "Open Grab" : "Directions";
  const onAction = async (): Promise<void> => {
    if (fixed?.bundled) return openGrab(to);
    if (fixed) return openTransfer(leg);
    if (mode === "grab") return openGrab(to);
    if (await tryOpenExternalUrl(googleDirectionsUrl(mode, from, to))) return;
    Alert.alert("Could not open directions", "Try Google Maps again later.");
  };
  return (
    <View style={styles.row}>
      <TimelineRail variant="dot" isLast={false} />
      <View style={styles.connector}>
        <View style={styles.head}>
          <Chip label={pillLabel(fixed, mode, estimate, leg)} style={[styles.pill, fixed && styles.pillFixed, fixed?.bundled && styles.pillBundled]} />
          <ActionButton
            variant="ghost"
            underline
            accessibilityRole="link"
            accessibilityLabel={`${action} from ${from.name} to ${to.name}`}
            label={action}
            onPress={() => void onAction()}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Transport options from ${from.name} to ${to.name}`}
            accessibilityState={{ expanded }}
            style={styles.chevron}
            onPress={() => setExpanded((value) => !value)}
          >
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.inkSoft} />
          </Pressable>
        </View>
        {expanded ? (
          <View style={styles.panel}>
            <Text style={styles.fromTo} numberOfLines={1}>
              {from.name} to {to.name}
            </Text>
            {!fixed ? (
              <View style={styles.options}>
                {MODES.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${option.label} from ${from.name} to ${to.name}`}
                    accessibilityState={{ selected: mode === option.id }}
                    style={[styles.option, mode === option.id && styles.optionSelected]}
                    onPress={() => setMode(option.id)}
                  >
                    <Text style={[styles.optionText, mode === option.id && styles.optionTextOn]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {fixed?.bundled ? (
              <View style={styles.optionalActions}>
                <ActionButton variant="primary" label="Open Grab to next stop" onPress={() => void openGrab(to)} />
                <ActionButton variant="tonal" label="Consider one driver" onPress={() => void openTransfer(leg)} />
              </View>
            ) : null}
            <Text style={styles.note}>{legNote(fixed, mode, estimate, leg)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function pillLabel(
  fixed: FixedTransfer | null,
  mode: LocalTravelMode,
  estimate: TravelEstimate,
  leg: PlanningLeg | undefined,
): string {
  const prefix = estimate.evidence === "provider_verified" ? "" : "~";
  const duration = `${prefix}${formatDuration(estimate.durationMinutes)}`;
  if (fixed) return `${fixed.label} - ${duration}${leg?.mode === "ferry" ? " - fare unknown" : ""}`;
  const label = MODES.find((option) => option.id === mode)?.label.toLowerCase() ?? mode;
  const suffix = leg?.booking === "external_search" ? " - live fare" : "";
  return `${duration} ${label} - ${formatDistance(estimate.distanceMeters)}${suffix}`;
}

function legNote(
  fixed: FixedTransfer | null,
  mode: LocalTravelMode,
  estimate: TravelEstimate,
  leg: PlanningLeg | undefined,
): string {
  if (fixed?.bundled) return `Grab opens with the exact next-stop pin. A hired driver remains optional. ${leg?.explanation ?? "Compare Grab availability with one bundled driver quote."}`;
  if (fixed) return leg?.explanation ?? "Confirm this transfer, fare and timing with the operator.";
  if (mode === "grab") return "Jalan2 copies the exact next-stop address, then opens Grab's booking screen.";
  return estimate.evidence === "provider_verified"
    ? "Travel time comes from the route provider."
    : "Travel time is an estimate; Google Maps confirms the live route.";
}

function fixedTransfer(leg: PlanningLeg | undefined): FixedTransfer | null {
  if (leg?.mode === "ferry") return { label: "Water taxi", action: "Transfer info" };
  if (leg?.provider === "operator" && /tioman|village corridor|water taxi|4wd/i.test(leg.explanation)) {
    return { label: leg.mode === "operator_pickup" ? "Local shuttle" : "Island transfer", action: "Transfer info" };
  }
  if (leg?.provider === "ktmb") return { label: "KTMB train", action: "Open KTMB ticketing" };
  if (leg?.provider === "easybook") return { label: "EasyBook", action: "Open EasyBook" };
  if (leg?.provider === "operator" && /rafting lorry|rafting operator|uphill/i.test(leg.explanation)) {
    return { label: "Rafting transfer", action: "Transfer details" };
  }
  if (leg?.provider === "operator" && leg.mode === "operator_pickup") {
    return { label: "Grab or driver", action: "Open Grab", bundled: true };
  }
  if (leg?.mode === "flight") return { label: "Flight", action: "Search flights" };
  return null;
}

async function openTransfer(leg: PlanningLeg | undefined): Promise<void> {
  if (leg?.handoff_url && (await tryOpenExternalUrl(leg.handoff_url))) return;
  if (leg?.provider === "operator" && leg.mode === "operator_pickup" && !/rafting lorry|rafting operator|uphill/i.test(leg.explanation)) {
    Alert.alert(
      "Optional driver bundle",
      "Grab is available per leg. If you prefer one vehicle for luggage, early pickups or Gopeng coverage, request a three-day driver quote and compare the total before confirming.",
    );
    return;
  }
  Alert.alert(
    "Transfer not confirmed",
    "Open the named provider or ask the local operator to confirm this exact transfer, fare and timing.",
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing(2), alignItems: "stretch", minHeight: 62 },
  connector: { flex: 1, paddingVertical: spacing(2), gap: spacing(2) },
  head: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing(1) },
  pill: { flexShrink: 1 },
  pillFixed: { backgroundColor: colors.pendingSoft, color: colors.pending },
  pillBundled: { backgroundColor: colors.halo, color: colors.sageDeep },
  chevron: { minHeight: 40, minWidth: 40, alignItems: "center", justifyContent: "center" },
  panel: {
    gap: spacing(2),
    padding: spacing(2.5),
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  fromTo: { ...type.caption, color: colors.inkSoft },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1) },
  optionalActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  option: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  optionSelected: { backgroundColor: colors.sageDeep },
  optionText: { ...type.label, color: colors.sageDeep },
  optionTextOn: { color: colors.white },
  note: { ...type.caption, color: colors.inkSoft },
});
