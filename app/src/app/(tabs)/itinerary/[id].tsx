import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookingPanel } from "@/components/BookingPanel";
import { MapCard } from "@/components/MapCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { TransitButton } from "@/components/TransitButton";
import { bookingViewFor } from "@/lib/bookingPresentation";
import { HOME_ROUTE } from "@/lib/navigation";
import { useItinerary } from "@/lib/useItinerary";
import { colors, spacing } from "@/lib/theme";

export default function ItineraryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const state = useItinerary(id);
  if (!state.itinerary) {
    const view = bookingViewFor(null, state.error);
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Booking" onBack={() => router.back()} />
        <View style={styles.center}>
          {view === "loading" ? <ActivityIndicator color={colors.sage} /> : (
            <StateCard
              title={view === "expired" ? "This demo session expired" : "Booking could not load"}
              message={view === "expired"
                ? "The demo server restarted, so this in-memory itinerary is no longer available."
                : state.error ?? "Check the server connection and try again."}
              actionLabel={view === "expired" ? "Start a fresh trip" : "Retry"}
              onAction={view === "expired" ? () => router.replace(HOME_ROUTE) : state.retry}
            />
          )}
        </View>
      </View>
    );
  }
  const itinerary = state.itinerary;
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Booking" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <BookingPanel
          itinerary={itinerary}
          onBooked={state.apply}
          onViewTrip={itinerary.tripId ? () => router.push(`/trip/${itinerary.tripId}?bookingId=${itinerary.id}`) : undefined}
          onStartFresh={() => router.replace(HOME_ROUTE)}
        />
        {itinerary.booking ? (
          <>
            <MapCard point={itinerary.booking.meeting_point} />
            <TransitButton point={itinerary.booking.meeting_point} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: "center", padding: spacing(5) },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(34), gap: spacing(4) },
});
