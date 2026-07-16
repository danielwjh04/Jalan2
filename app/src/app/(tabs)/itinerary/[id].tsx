import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookingPanel } from "@/components/BookingPanel";
import { MapCard } from "@/components/MapCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { TransitButton } from "@/components/TransitButton";
import { bookingViewFor } from "@/lib/bookingPresentation";
import { guideDestination } from "@/lib/ingestDestination";
import { HOME_ROUTE } from "@/lib/navigation";
import { useItinerary } from "@/lib/useItinerary";
import { useMeetingPointStop } from "@/lib/useMeetingPointStop";
import { colors, spacing } from "@/lib/theme";

export default function ItineraryScreen(): React.ReactElement {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const router = useRouter();
  const state = useItinerary(id);
  const meetingStop = useMeetingPointStop(state.itinerary);
  const guideMode = view === "guide";
  useEffect(() => {
    const tripId = state.itinerary?.tripId;
    if (guideMode && tripId) router.replace(guideDestination(tripId, id));
  }, [guideMode, id, router, state.itinerary?.tripId]);
  if (guideMode) return <GuideProgress error={state.error ?? state.itinerary?.error ?? null} onBack={() => router.back()} onRetry={state.retry} />;
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
  const confirmed = bookingViewFor(itinerary, null) === "confirmed";
  const tripId = itinerary.tripId;
  const viewTrip = tripId ? (): void => {
    const params = { id: tripId, bookingId: itinerary.id };
    if (confirmed) router.replace({ pathname: "/trip/[id]", params: { ...params, confirmationSeen: "1" } });
    else router.push({ pathname: "/trip/[id]", params });
  } : undefined;
  return (
    <View style={styles.screen}>
      <ScreenHeader title={confirmed ? "Booking confirmed" : "Booking"} onBack={confirmed && viewTrip ? viewTrip : () => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <BookingPanel
          itinerary={itinerary}
          onBooked={state.apply}
          onViewTrip={viewTrip}
          onStartFresh={() => router.replace(HOME_ROUTE)}
        />
        {!confirmed && itinerary.booking ? (
          <>
            <MapCard point={itinerary.booking.meeting_point} stop={meetingStop} />
            <TransitButton point={itinerary.booking.meeting_point} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function GuideProgress({ error, onBack, onRetry }: { error: string | null; onBack: () => void; onRetry: () => void }): React.ReactElement {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Creating guide" onBack={onBack} />
      <View style={styles.center}>
        {error ? (
          <StateCard
            title="Guide could not be created"
            message="Check the link and try again."
            actionLabel="Retry"
            onAction={onRetry}
          />
        ) : <ActivityIndicator color={colors.sage} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: "center", padding: spacing(5) },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(34), gap: spacing(4) },
});
