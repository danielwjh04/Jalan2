import { useCallback, useState } from "react";
import { Alert, ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { FixtureCard as FixtureCardData, ItinerarySummary } from "@shared/api";
import { FixtureCard } from "@/components/FixtureCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { deleteItinerary, getFixtures, getItineraries } from "@/lib/api";
import { groupItineraries } from "@/lib/tripSections";
import { colors, eyebrow, spacing, type } from "@/lib/theme";

export default function TripsScreen(): React.ReactElement {
  const router = useRouter();
  const data = useTripsData();
  useFocusEffect(useCallback(() => { void data.load(); }, [data.load]));
  const groups = groupItineraries(data.summaries);
  const requestDelete = (id: string): void => confirmFailedDeletion(
    () => void data.removeFailed(id),
  );
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrowText="Plans from your discoveries" title="Trips" />
      {data.loading && data.fixtures.length === 0 ? <ActivityIndicator color={colors.sage} /> : null}
      {data.error ? (
        <StateCard title="Trips could not load" message={data.error} actionLabel="Retry" onAction={() => void data.load()} />
      ) : (
        <>
          <Section title="Waiting" items={groups.waiting} onOpen={(id) => router.push(`/itinerary/${id}`)} />
          <Section title="Confirmed" items={groups.confirmed} onOpen={(id) => router.push(`/itinerary/${id}`)} />
          <Section title="Draft" items={groups.draft} onOpen={(id) => router.push(`/itinerary/${id}`)} />
          <Section title="Needs attention" items={groups.failed} onOpen={(id) => router.push(`/itinerary/${id}`)} onDelete={requestDelete} />
          {data.summaries.length === 0 ? (
            <StateCard title="No session trips yet" message="Paste a travel video on Home. Your drafts and confirmations will collect here until the demo server restarts." />
          ) : null}
          {data.fixtures.length > 0 ? (
            <View style={styles.list}>
              <View><Text style={styles.eyebrow}>READY TO EXPLORE</Text><Text style={styles.heading}>Demo journeys</Text></View>
              {data.fixtures.map((fixture) => (
                <FixtureCard key={fixture.slug} fixture={fixture} disabled={false} onPress={() => router.push(`/trip/${fixture.slug}`)} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function useTripsData(): { fixtures: FixtureCardData[]; summaries: ItinerarySummary[]; loading: boolean; error: string | null; load: () => Promise<void>; removeFailed: (id: string) => Promise<void> } {
  const [fixtures, setFixtures] = useState<FixtureCardData[]>([]);
  const [summaries, setSummaries] = useState<ItinerarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [nextFixtures, nextSummaries] = await Promise.all([getFixtures(), getItineraries()]);
      setFixtures(nextFixtures);
      setSummaries(nextSummaries);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Trips");
    } finally {
      setLoading(false);
    }
  }, []);
  const removeFailed = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteItinerary(id);
      setSummaries((items) => items.filter((item) => item.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete trip");
    }
  }, []);
  return { fixtures, summaries, loading, error, load, removeFailed };
}

function Section({ title, items, onOpen, onDelete }: { title: string; items: ItinerarySummary[]; onOpen: (id: string) => void; onDelete?: (id: string) => void }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View style={styles.list}>
      <Text style={styles.heading}>{title}</Text>
      {items.map((item) => <TripSummaryCard key={item.id} summary={item} onPress={() => onOpen(item.id)} onDelete={onDelete ? () => onDelete(item.id) : undefined} />)}
    </View>
  );
}

function confirmFailedDeletion(onConfirm: () => void): void {
  if (Platform.OS === "web") {
    if (window.confirm("Delete this failed trip?")) onConfirm();
    return;
  }
  Alert.alert("Delete failed trip?", "This removes it from your Trips list.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(5) },
  list: { gap: spacing(4) },
  eyebrow: { ...eyebrow },
  heading: { ...type.title, color: colors.ink, marginTop: spacing(1) },
});
