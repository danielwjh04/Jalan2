import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { TripPlanner } from "@/components/TripPlanner";
import { colors, type } from "@/lib/theme";
import { useTripPlanner } from "@/lib/useTripPlanner";

export default function TripScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const planner = useTripPlanner(id);
  if (planner.trip) return <TripPlanner {...planner} trip={planner.trip} />;
  return (
    <View style={styles.loading}>
      {planner.error ? (
        <Text style={styles.error}>{planner.error}</Text>
      ) : (
        <ActivityIndicator color={colors.tide} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { ...type.body, color: colors.danger },
});
