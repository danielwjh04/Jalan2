import { StyleSheet, Text, View } from "react-native";
import type { Itinerary } from "@shared/status";
import { formatBookingDate } from "@/lib/bookingDate";
import { colors, spacing, type } from "@/lib/theme";
import { StatusPill } from "./StatusPill";
import { SurfaceCard } from "./SurfaceCard";

export function BookingDetailsCard({ itinerary }: { itinerary: Itinerary }): React.ReactElement | null {
  const booking = itinerary.booking;
  if (!booking) return null;
  const requested = itinerary.requested;
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.activity}>{booking.activity}</Text>
      <Text style={styles.operator}>Featured by {booking.operator_name}</Text>
      <DetailRow label="Date" value={requested ? formatBookingDate(requested.dateISO) : "Choose below"} />
      <DetailRow label="Guests" value={requested ? `${requested.pax} ${requested.pax === 1 ? "adult" : "adults"}` : "Choose below"} />
      <DetailRow label="Meet at" value={booking.meeting_point.name} />
      <View style={styles.statusRow}><Text style={styles.label}>Status</Text><StatusPill status={itinerary.status} /></View>
    </SurfaceCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { gap: spacing(2.5) },
  activity: { ...type.title, color: colors.ink },
  operator: { ...type.label, color: colors.sageDeep, marginBottom: spacing(1) },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing(4), borderTopWidth: 1, borderTopColor: colors.mist, paddingTop: spacing(2.5) },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing(4), borderTopWidth: 1, borderTopColor: colors.mist, paddingTop: spacing(2.5) },
  label: { ...type.caption, color: colors.inkSoft },
  value: { ...type.label, color: colors.ink, flex: 1, textAlign: "right" },
});
