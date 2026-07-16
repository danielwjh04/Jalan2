import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SmartPlanningMetadata } from "@shared/planner";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { colors, radius, spacing, type } from "@/lib/theme";
import { SurfaceCard } from "./SurfaceCard";

export function SmartJourneyOverview({ planning, stops }: { planning: SmartPlanningMetadata; stops: TripStop[] }): React.ReactElement {
  const names = new Map(stops.map((stop) => [stop.id, stop.name]));
  const transportHandoffs = planning.handoffs.filter((handoff) => handoff.kind === "transport");
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>PLANNING CONTROL CENTRE</Text><Text style={styles.title}>{planning.agents.length} agents, one connected plan</Text></View><Text style={styles.readiness}>{planning.checks.some((check) => check.severity === "blocking") ? "CHECK NEEDED" : "ACTIONABLE"}</Text></View>
      {planning.critique ? <View style={styles.critique}><Text style={styles.critiqueScore}>{planning.critique.score}/100</Text><View style={styles.critiqueCopy}><Text style={styles.critiqueTitle}>End-to-end reasonableness</Text><Text style={styles.critiqueSummary}>{planning.critique.summary}</Text></View></View> : null}
      <View style={styles.boundary}><Ionicons name={planning.request.return_to_origin ? "repeat" : "flag"} size={20} color={colors.sageDeep} /><View style={styles.boundaryCopy}><Text style={styles.boundaryLabel}>WHOLE-JOURNEY BOUNDARY</Text><Text style={styles.boundaryText}>{planning.request.origin} → {planning.request.return_to_origin ? planning.request.origin : planning.request.end_destination}</Text><Text style={styles.boundaryNote}>{planning.request.return_to_origin ? "Return transport is included in the plan." : "The itinerary finishes at the stated endpoint; no return is assumed."}</Text></View></View>
      <View style={styles.agents}>{planning.agents.map((agent) => <View key={agent.id} style={styles.agent}><View style={[styles.dot, agent.status !== "ready" && styles.dotLimited]} /><View style={styles.agentCopy}><Text style={styles.agentLabel}>{agent.label}</Text><Text style={styles.agentSummary}>{agent.summary}</Text></View></View>)}</View>
      <Text style={styles.sectionTitle}>Day-by-day shape</Text>
      <View style={styles.days}>{planning.days.map((day) => <View key={day.day} style={styles.day}><Text style={styles.dayNumber}>DAY {day.day}</Text><Text style={styles.dayTime}>{formatMinutes(day.estimated_minutes)}</Text><Text style={styles.dayStops}>{day.stop_ids.map((id) => names.get(id) ?? id).join(" · ") || "Leave room for arrival and rest"}</Text></View>)}</View>
      <Text style={styles.sectionTitle}>Connected transport legs</Text>
      {planning.legs.map((leg) => <Pressable key={leg.id} disabled={!leg.handoff_url} style={styles.leg} onPress={() => void openHandoff(leg.handoff_url)}><View style={styles.legIcon}><Ionicons name={leg.mode === "flight" ? "airplane" : leg.mode === "ferry" ? "boat" : leg.mode === "train" ? "train" : leg.mode === "coach" ? "bus" : "navigate"} size={17} color={colors.sageDeep} /></View><View style={styles.legCopy}><Text style={styles.legTitle}>{names.get(leg.from_stop_id)} → {names.get(leg.to_stop_id)}</Text><Text style={styles.legMeta}>{label(leg.mode === "ferry" ? "water taxi" : leg.mode)} · {formatMinutes(leg.duration_minutes)} · {evidenceLabel(leg.evidence)}</Text><Text style={styles.legNote}>{leg.explanation}</Text></View>{leg.handoff_url ? <Ionicons name="open-outline" size={17} color={colors.inkSoft} /> : null}</Pressable>)}
      {transportHandoffs.length ? <View style={styles.handoffs}><Text style={styles.sectionTitle}>Ticket and transfer options</Text><Text style={styles.handoffIntro}>Jalan2 checks each intercity boundary in both directions. Open the provider to confirm the actual departure, fare and seats.</Text>{transportHandoffs.map((handoff, index) => <Pressable key={`${handoff.provider}-${handoff.label}-${index}`} disabled={!handoff.url} style={styles.handoff} onPress={() => void openHandoff(handoff.url)}><View style={styles.providerIcon}><Ionicons name={/ktmb/i.test(handoff.provider) ? "train-outline" : /easybook/i.test(handoff.provider) ? "bus-outline" : "swap-horizontal-outline"} size={18} color={colors.sageDeep} /></View><View style={styles.legCopy}><Text style={styles.legTitle}>{handoff.provider}</Text><Text style={styles.legMeta}>{handoff.label}</Text><Text style={styles.legNote}>{handoff.disclaimer}</Text></View>{handoff.url ? <Ionicons name="open-outline" size={17} color={colors.inkSoft} /> : null}</Pressable>)}</View> : null}
      {planning.checks.length > 0 ? <View style={styles.checks}><Text style={styles.sectionTitle}>Critic checks</Text>{planning.checks.map((check, index) => <View key={`${check.message}-${index}`} style={styles.check}><Ionicons name={check.severity === "blocking" ? "alert-circle" : "information-circle"} size={17} color={check.severity === "blocking" ? colors.danger : colors.pending} /><View style={styles.checkCopy}><Text style={styles.checkMessage}>{check.message}</Text><Text style={styles.checkResolution}>{check.resolution}</Text></View></View>)}</View> : null}
    </SurfaceCard>
  );
}

async function openHandoff(url: string | null): Promise<void> {
  if (url && await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open handoff", "Try this provider again later.");
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}h ` : ""}${rest ? `${rest}m` : ""}`.trim();
}

function label(value: string): string {
  return value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function evidenceLabel(value: string): string {
  if (value === "provider_verified") return "Provider verified";
  if (value === "needs_confirmation") return "Needs confirmation";
  return "Estimated";
}

const styles = StyleSheet.create({
  card: { gap: spacing(3.5) },
  header: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing(2) },
  eyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  title: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  readiness: { ...type.caption, color: colors.danger, backgroundColor: colors.dangerSoft, paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: radius.pill, overflow: "hidden" },
  critique: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3), borderRadius: radius.control, backgroundColor: colors.halo },
  critiqueScore: { ...type.heading, color: colors.sageDeep },
  critiqueCopy: { flex: 1, gap: 2 },
  critiqueTitle: { ...type.label, color: colors.ink },
  critiqueSummary: { ...type.caption, color: colors.inkSoft },
  boundary: { flexDirection: "row", gap: spacing(2.5), padding: spacing(3), borderRadius: radius.control, backgroundColor: colors.kayaTint },
  boundaryCopy: { flex: 1, gap: 2 },
  boundaryLabel: { ...type.caption, color: colors.sageDeep, letterSpacing: 0.8 },
  boundaryText: { ...type.heading, color: colors.ink },
  boundaryNote: { ...type.caption, color: colors.inkSoft },
  agents: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  agent: { flexDirection: "row", gap: spacing(2), flex: 1, minWidth: 255, padding: spacing(2.5), backgroundColor: colors.canvas, borderRadius: radius.control },
  dot: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.confirm, marginTop: 4 },
  dotLimited: { backgroundColor: colors.pending },
  agentCopy: { flex: 1, gap: 2 },
  agentLabel: { ...type.label, color: colors.ink },
  agentSummary: { ...type.caption, color: colors.inkSoft },
  sectionTitle: { ...type.heading, color: colors.ink },
  days: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  day: { flex: 1, minWidth: 210, padding: spacing(3), gap: spacing(1), backgroundColor: colors.halo, borderRadius: radius.control },
  dayNumber: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  dayTime: { ...type.heading, color: colors.ink },
  dayStops: { ...type.caption, color: colors.inkSoft },
  leg: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2), paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: colors.mist },
  legIcon: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.halo, alignItems: "center", justifyContent: "center" },
  legCopy: { flex: 1, gap: 3 },
  legTitle: { ...type.label, color: colors.ink },
  legMeta: { ...type.caption, color: colors.sageDeep },
  legNote: { ...type.caption, color: colors.inkSoft },
  handoffs: { gap: spacing(2) },
  handoffIntro: { ...type.caption, color: colors.inkSoft },
  handoff: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2), padding: spacing(3), borderRadius: radius.control, backgroundColor: colors.halo },
  providerIcon: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  checks: { gap: spacing(2) },
  check: { flexDirection: "row", gap: spacing(2), padding: spacing(2.5), backgroundColor: colors.pendingSoft, borderRadius: radius.control },
  checkCopy: { flex: 1, gap: 2 },
  checkMessage: { ...type.label, color: colors.ink },
  checkResolution: { ...type.caption, color: colors.inkSoft },
});
