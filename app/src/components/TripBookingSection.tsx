import { ActivityIndicator, StyleSheet, View } from "react-native";
import { BookingPanel } from "./BookingPanel";
import { StateCard } from "./StateCard";
import { useItinerary } from "@/lib/useItinerary";
import { colors, spacing } from "@/lib/theme";

export function TripBookingSection({ bookingId }: { bookingId: string }): React.ReactElement {
  const { itinerary, error, apply, retry } = useItinerary(bookingId);
  if (!itinerary) {
    return (
      <View style={styles.loading}>
        {error ? (
          <StateCard title="Booking could not load" message={error} actionLabel="Retry" onAction={retry} />
        ) : <ActivityIndicator color={colors.sage} />}
      </View>
    );
  }
  return <View style={styles.section}><BookingPanel itinerary={itinerary} onBooked={apply} /></View>;
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(3) },
  loading: { paddingVertical: spacing(8), alignItems: "center" },
});
