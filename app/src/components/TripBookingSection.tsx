import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BookSheet } from "./BookSheet";
import { ExperienceLink } from "./ExperienceLink";
import { StatusPill } from "./StatusPill";
import { useItinerary } from "@/lib/useItinerary";
import {
  cardShadow,
  colors,
  eyebrow,
  radius,
  spacing,
  type,
} from "@/lib/theme";

export function TripBookingSection({
  bookingId,
}: {
  bookingId: string;
}): React.ReactElement {
  const { itinerary, error, apply } = useItinerary(bookingId);
  if (!itinerary) {
    return (
      <View style={styles.loading}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.sage} />
        )}
      </View>
    );
  }
  const booking = itinerary.booking;
  if (!booking)
    return <Text style={styles.error}>Booking details are unavailable.</Text>;
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={eyebrow}>DIRECT BOOKING</Text>
          <Text style={styles.title}>Contact the operator</Text>
        </View>
        <StatusPill status={itinerary.status} />
      </View>
      {itinerary.status === "DRAFT" ? (
        <BookSheet
          itineraryId={itinerary.id}
          booking={booking}
          onBooked={apply}
        />
      ) : (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            {itinerary.status === "CONFIRMED"
              ? "Operator confirmed"
              : "Waiting for operator"}
          </Text>
          <Text style={styles.statusBody}>
            {itinerary.status === "CONFIRMED"
              ? `Your ${booking.activity} is confirmed.`
              : `Your request was sent to ${booking.operator_name}.`}
          </Text>
          {itinerary.messages.map((message, index) => (
            <Text key={`${message.at}-${index}`} style={styles.message}>
              {message.direction === "inbound" ? "Operator" : "Request"}:{" "}
              {message.text}
            </Text>
          ))}
        </View>
      )}
      {itinerary.experienceId ? (
        <ExperienceLink experienceId={itinerary.experienceId} bookingId={itinerary.id} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(6), gap: spacing(3) },
  loading: { paddingVertical: spacing(8), alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: { gap: spacing(1) },
  title: { ...type.title, color: colors.ink },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(2),
    ...cardShadow,
  },
  statusTitle: { ...type.heading, color: colors.ink },
  statusBody: { ...type.body, color: colors.inkSoft },
  message: { ...type.caption, color: colors.inkSoft },
  error: { ...type.caption, color: colors.danger },
});
