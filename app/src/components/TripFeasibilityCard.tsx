import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTransportStop, type TripPlan } from "@shared/trip";
import { colors, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { SurfaceCard } from "./SurfaceCard";

interface Props { trip: TripPlan; selected: string[]; }

export function TripFeasibilityCard({ trip, selected }: Props): React.ReactElement {
  const stops = selected.map((id) => trip.stops.find((stop) => stop.id === id)).filter((stop): stop is TripPlan["stops"][number] => Boolean(stop));
  const minimumMinutes = trip.planning?.estimated_total_minutes ?? trip.route?.duration_minutes ?? stops.reduce((total, stop) => total + stop.duration_minutes, 0);
  const localMinutes = stops.filter((stop) => !isTransportStop(stop)).reduce((total, stop) => total + stop.duration_minutes, 0);
  const assessment = trip.planning
    ? assessmentForPlan(trip.planning.recommended_days, trip.planning.request.days)
    : assess(minimumMinutes);
  const destination = hotelDestination(trip.region);
  const stay = trip.planning?.stay;
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Ionicons name="time-outline" size={20} color={colors.kopi} /></View>
        <View style={styles.copy}><Text style={styles.title}>Can this fit in one day?</Text><Text style={styles.verdict}>{assessment.verdict}</Text></View>
      </View>
      <View style={styles.metrics}>
        <Metric label="Minimum plan" value={formatDuration(minimumMinutes)} />
        <Metric label="Activities alone" value={formatDuration(localMinutes)} />
        <Metric label="Recommended" value={`${assessment.days} day${assessment.days === 1 ? "" : "s"}`} />
      </View>
      <Text style={styles.note}>{assessment.note} This excludes queues, meals, check-in, weather delays and any transfer not yet routed.</Text>
      {assessment.days > 1 ? (
        <Pressable style={styles.hotel} onPress={() => void openHotelSearch(destination, trip.planning?.hotel_search_url)}>
          <View style={styles.hotelCopy}><Text style={styles.hotelTitle}>Find an overnight base in {stay?.destination ?? destination}</Text><Text style={styles.hotelNote}>{stay?.check_in && stay.check_out ? `${stay.check_in} to ${stay.check_out} · ${stay.rooms} room${stay.rooms === 1 ? "" : "s"} · ${stay.travelers} travelers` : "Choose dates on Agoda"}. External booking search.</Text></View>
          <Ionicons name="open-outline" size={19} color={colors.white} />
        </Pressable>
      ) : null}
    </SurfaceCard>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function assess(minutes: number): { days: number; verdict: string; note: string } {
  if (minutes > 720) return { days: Math.max(2, Math.ceil(minutes / 480)), verdict: "No. Split this route across multiple days.", note: "The fixed activities and transport already exceed a safe touring day." };
  if (minutes > 540) return { days: 2, verdict: "Technically aggressive. An overnight is the safer plan.", note: "It may work only with an early start and every transfer pre-arranged." };
  return { days: 1, verdict: "Yes, with some buffer.", note: "Recheck opening hours and optimize after adding any extra stop." };
}

function assessmentForPlan(days: number, requested: number): { days: number; verdict: string; note: string } {
  if (days > requested) return { days, verdict: "The requested duration is too tight.", note: "The scheduler added time instead of hiding an impossible connection." };
  if (days > 1) return { days, verdict: "Yes, split across grounded day plans.", note: "Critical transport confirmations must still be completed before travel." };
  return { days: 1, verdict: "Yes, with the current estimated buffers.", note: "Recheck provider handoffs and opening hours before departure." };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${rest ? ` ${rest}m` : ""}`;
}

function hotelDestination(region: string): string {
  return region.includes(" to ") ? region.split(" to ").at(-1) ?? region : region;
}

async function openHotelSearch(destination: string, plannedUrl?: string | null): Promise<void> {
  const url = plannedUrl ?? `https://www.agoda.com/search?text=${encodeURIComponent(destination)}`;
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open Agoda", "Search for accommodation again later.");
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  header: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  icon: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.kaya, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: spacing(0.5) },
  title: { ...type.title, color: colors.ink },
  verdict: { ...type.label, color: colors.danger },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  metric: { flex: 1, minWidth: 115, backgroundColor: colors.canvas, borderRadius: radius.control, padding: spacing(2.5) },
  metricValue: { ...type.heading, color: colors.ink },
  metricLabel: { ...type.caption, color: colors.inkSoft },
  note: { ...type.body, color: colors.inkSoft },
  hotel: { minHeight: 58, borderRadius: radius.control, backgroundColor: colors.sageDeep, padding: spacing(3), flexDirection: "row", alignItems: "center", gap: spacing(2) },
  hotelCopy: { flex: 1, gap: spacing(0.5) },
  hotelTitle: { ...type.label, color: colors.white },
  hotelNote: { ...type.caption, color: colors.halo },
});
