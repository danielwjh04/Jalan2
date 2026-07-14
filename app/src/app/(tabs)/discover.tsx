import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { DirectoryEntry, DiscoveryCard as DiscoveryCardData } from "@shared/api";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { OperatorCard } from "@/components/OperatorCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { StateCard } from "@/components/StateCard";
import { getDirectory, getDiscoveries } from "@/lib/api";
import {
  discoveriesForCatalog,
  sectionFromParam,
  type DiscoverSection,
} from "@/lib/discoverPresentation";
import { colors, eyebrow, spacing, type } from "@/lib/theme";
import { useSavedDiscoveryTrips } from "@/lib/useSavedDiscoveryTrips";

const SECTIONS = [
  { value: "places", label: "Places" },
  { value: "operators", label: "Operators" },
] as const;

export default function DiscoverScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ section?: string }>();
  const router = useRouter();
  const [section, setSection] = useState<DiscoverSection>(() => sectionFromParam(params.section));
  const { discoveries, operators, loading, error, load } = useDiscoverData();
  const saved = useSavedDiscoveryTrips();
  useEffect(() => setSection(sectionFromParam(params.section)), [params.section]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useFocusEffect(useCallback(() => { void saved.load(); }, [saved.load]));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrowText="Made in Malaysia" title="Discover" />
      <SegmentedControl
        options={SECTIONS}
        value={section}
        onChange={(value) => router.setParams({ section: sectionFromParam(value) })}
      />
      {loading && discoveries.length === 0 ? <ActivityIndicator color={colors.sage} /> : null}
      {error ? (
        <StateCard
          title="Discover needs a refresh"
          message={error}
          actionLabel="Retry"
          onAction={() => void load()}
        />
      ) : section === "places" ? (
        <Places
          discoveries={discoveries}
          savedTrips={saved.savedTrips}
          planningId={saved.busyId}
          onOpen={(id) => router.push(`/trip/${id}`)}
          onPlan={(id) => void saved.plan(id).then((trip) => router.push(`/trip/${trip.id}`)).catch(() => undefined)}
        />
      ) : (
        <Operators entries={operators} onOpen={(id) => router.push(`/experience/${id}`)} />
      )}
    </ScrollView>
  );
}

function useDiscoverData(): { discoveries: DiscoveryCardData[]; operators: DirectoryEntry[]; loading: boolean; error: string | null; load: () => Promise<void> } {
  const [discoveries, setDiscoveries] = useState<DiscoveryCardData[]>([]);
  const [operators, setOperators] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [nextDiscoveries, nextOperators] = await Promise.all([getDiscoveries(), getDirectory()]);
      setDiscoveries(nextDiscoveries);
      setOperators(nextOperators);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Discover");
    } finally {
      setLoading(false);
    }
  }, []);
  return { discoveries, operators, loading, error, load };
}

interface PlacesProps {
  discoveries: DiscoveryCardData[];
  savedTrips: import("@shared/api").SavedTripSummary[];
  planningId: string | null;
  onOpen: (id: string) => void;
  onPlan: (id: string) => void;
}

function Places({ discoveries, savedTrips, planningId, onOpen, onPlan }: PlacesProps): React.ReactElement {
  if (discoveries.length === 0) {
    return <StateCard title="No discoveries yet" message="Try again when the curated Malaysia catalog is available." />;
  }
  return (
    <View style={styles.list}>
      <View><Text style={styles.eyebrow}>CURATED JOURNEYS</Text><Text style={styles.heading}>Malaysia through local eyes</Text></View>
      {discoveriesForCatalog(discoveries).map((discovery) => (
        <DiscoveryCard
          key={discovery.id}
          discovery={discovery}
          savedTripId={savedTrips.find((trip) => trip.sourceDiscoveryId === discovery.id)?.id}
          planning={planningId === discovery.id}
          onPress={() => onOpen(discovery.id)}
          onPlan={() => onPlan(discovery.id)}
        />
      ))}
    </View>
  );
}

function Operators({ entries, onOpen }: { entries: DirectoryEntry[]; onOpen: (id: string) => void }): React.ReactElement {
  if (entries.length === 0) {
    return <StateCard title="No operators yet" message="Book a local discovery and the operator will appear here with their consent status." />;
  }
  return (
    <View style={styles.list}>
      <View><Text style={styles.eyebrow}>LOCAL PEOPLE</Text><Text style={styles.heading}>Meet the operators</Text></View>
      {entries.map((entry) => (
        <OperatorCard key={entry.experienceId} entry={entry} onPress={() => onOpen(entry.experienceId)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(4) },
  list: { gap: spacing(4) },
  eyebrow: { ...eyebrow },
  heading: { ...type.title, color: colors.ink, marginTop: spacing(1) },
});
