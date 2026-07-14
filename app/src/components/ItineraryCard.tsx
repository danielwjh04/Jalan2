import { StyleSheet, Text, View } from "react-native";
import type { BookingJson } from "@shared/booking";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";
import { TrustBadge } from "./TrustBadge";

interface Props {
  booking: BookingJson;
  servedFrom: "live" | "cache" | null;
  showTitle?: boolean;
}

export function ItineraryCard({
  booking,
  servedFrom,
  showTitle = true,
}: Props): React.ReactElement {
  return (
    <View style={styles.card}>
      {showTitle && <Text style={styles.activity}>{booking.activity}</Text>}
      <Text style={styles.operator}>Featured by {booking.operator_name}</Text>
      {servedFrom === "cache" ? (
        <Text style={styles.prepared}>Prepared demo details</Text>
      ) : null}
      {booking.price_myr !== null ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>
            RM{booking.price_myr} per person
          </Text>
        </View>
      ) : null}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Meeting point</Text>
        <Text style={styles.detailValue}>{booking.meeting_point.name}</Text>
      </View>
      {booking.trust && <TrustBadge trust={booking.trust} />}
      {booking.contact.whatsapp && (
        <Text style={styles.contact}>
          Operator WhatsApp found in {booking.contact.source}:{" "}
          {booking.contact.whatsapp}
        </Text>
      )}
      {booking.raw_evidence.transcript_span.trim() ? (
        <View style={styles.evidenceBox}>
          <Text style={styles.evidence}>
            &ldquo;{booking.raw_evidence.transcript_span}&rdquo;
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(5),
    gap: spacing(2),
    ...cardShadow,
  },
  activity: { ...type.title, color: colors.ink },
  operator: { ...type.label, color: colors.sageDeep },
  prepared: { ...type.caption, color: colors.inkSoft },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing(4),
    marginTop: spacing(1),
  },
  detailLabel: { ...type.caption, color: colors.inkSoft },
  detailValue: {
    ...type.label,
    color: colors.ink,
    flex: 1,
    textAlign: "right",
  },
  contact: { ...type.caption, color: colors.inkSoft },
  evidenceBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.control,
    padding: spacing(3),
    marginTop: spacing(1),
  },
  evidence: { ...type.caption, color: colors.inkSoft },
});
