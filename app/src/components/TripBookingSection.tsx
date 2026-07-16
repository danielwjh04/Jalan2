import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BookingPanel } from "./BookingPanel";
import { StateCard } from "./StateCard";
import { useItinerary } from "@/lib/useItinerary";
import { colors, spacing } from "@/lib/theme";

interface Props {
  bookingId: string;
  confirmationSeen?: boolean;
}

export function TripBookingSection({ bookingId, confirmationSeen }: Props): React.ReactElement | null {
  const router = useRouter();
  const { itinerary, error, apply, retry } = useItinerary(bookingId);
  const confirmed = itinerary?.status === "CONFIRMED";
  useEffect(() => {
    if (confirmed && !confirmationSeen) router.replace(`/itinerary/${bookingId}`);
  }, [bookingId, confirmationSeen, confirmed, router]);
  if (!itinerary) {
    return (
      <View style={styles.loading}>
        {error ? (
          <StateCard title="Booking could not load" message={error} actionLabel="Retry" onAction={retry} />
        ) : <ActivityIndicator color={colors.sage} />}
      </View>
    );
  }
  if (confirmed) return null;
  return <View style={styles.section}><BookingPanel itinerary={itinerary} onBooked={apply} /></View>;
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(3) },
  loading: { paddingVertical: spacing(8), alignItems: "center" },
});
