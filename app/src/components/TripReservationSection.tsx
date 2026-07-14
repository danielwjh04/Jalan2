import { StyleSheet, Text, View } from "react-native";
import type { TripPlan } from "@shared/trip";
import { useTripReservations } from "@/lib/useTripReservations";
import { colors, eyebrow, spacing, type } from "@/lib/theme";
import { BoboCard } from "./BoboCard";
import { GradientButton } from "./GradientButton";
import { ReservationProgressCard } from "./ReservationProgressCard";
import { ReservationReviewCard } from "./ReservationReviewCard";
import { SurfaceCard } from "./SurfaceCard";

export function TripReservationSection({
  trip,
}: {
  trip: TripPlan;
}): React.ReactElement {
  const state = useTripReservations(trip);
  if (state.batch) return <ReservationProgressCard batch={state.batch} />;
  if (state.preview) {
    return (
      <View style={styles.stack}>
        <BoboCard
          compact
          title="Ready to ask, lah"
          message="Bobo is checking with each place separately. Walk-in stops stay in your plan."
        />
        <ReservationReviewCard state={state} />
      </View>
    );
  }
  return (
    <SurfaceCard style={styles.stack}>
      <Text style={styles.eyebrow}>BOOK AHEAD</Text>
      <Text style={styles.title}>Keep the good stops waiting for you</Text>
      <Text style={styles.copy}>
        Review dates and times first. Jalan2 only contacts eligible places after
        you confirm.
      </Text>
      <GradientButton
        label="Reserve my trip"
        busy={state.busy}
        onPress={() => void state.review()}
      />
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing(3) },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  copy: { ...type.body, color: colors.inkSoft },
  error: { ...type.caption, color: colors.danger },
});
