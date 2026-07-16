import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TripPlanner } from "@/components/TripPlanner";
import { colors, type } from "@/lib/theme";
import { useTripPlanner } from "@/lib/useTripPlanner";

export default function TripScreen(): React.ReactElement {
  const { id, bookingId, confirmationSeen } = useLocalSearchParams<{
    id: string;
    bookingId?: string;
    confirmationSeen?: string;
  }>();
  const router = useRouter();
  const planner = useTripPlanner(id);
  if (planner.trip) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Trip plan" onBack={() => router.back()} />
        <TripPlanner {...planner} trip={planner.trip} bookingId={bookingId} confirmationSeen={confirmationSeen === "1"} />
      </View>
    );
  }
  return (
    <View style={styles.loading}>
      {planner.error ? (
        <Text style={styles.error}>{planner.error}</Text>
      ) : (
        <ActivityIndicator color={colors.sage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { ...type.body, color: colors.danger },
});
