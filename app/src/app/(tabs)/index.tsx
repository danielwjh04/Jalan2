import { ScrollView, StyleSheet, View } from "react-native";
import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { BoboCard } from '@/components/BoboCard';
import { DemoFlowShowcase } from '@/components/DemoFlowShowcase';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeDiscoveryPreview, HomeQuickActions } from "@/components/HomeSections";
import { PasteBar } from '@/components/PasteBar';
import { SmartPlanComposer } from '@/components/SmartPlanComposer';
import { colors, spacing } from '@/lib/theme';
import { useHomeScreen } from "@/lib/useHomeScreen";
import { useSavedDiscoveryTrips } from "@/lib/useSavedDiscoveryTrips";

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { prefill, busy, discoveries, fixtures, submit, chooseMenuSource, startMenuDemo } = useHomeScreen();
  const saved = useSavedDiscoveryTrips();
  useFocusEffect(useCallback(() => { void saved.load(); }, [saved.load]));
  const regions = [...new Set(discoveries.map(({ region }) => region))];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <HomeHeader regions={regions} />
      <View style={styles.content}>
        <BoboCard
          hero
          landing
          eyebrow="BOBO SAYS SELAMAT DATANG"
          title="Pick a demo and let's jalan"
          message="Watch me connect transport, hidden operators and a route you can actually use."
        />
        <SmartPlanComposer />
        <DemoFlowShowcase discoveries={discoveries} onOpen={(id) => router.push(`/trip/${id}`)} />
        <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
        <HomeQuickActions busy={busy} onMenu={chooseMenuSource} onMenuDemo={startMenuDemo} onOperators={() => router.push('/discover?section=operators')} />
        <HomeDiscoveryPreview
          discoveries={discoveries.filter(({ featured }) => !featured).slice(0, 2)}
          devFixture={fixtures[0]}
          busy={busy}
          onOpen={(id) => router.push(`/trip/${id}`)}
          onPlan={(id) => void saved.plan(id).then((trip) => router.push(`/trip/${trip.id}`)).catch(() => undefined)}
          savedTrips={saved.savedTrips}
          planningId={saved.busyId}
          onSubmit={submit}
          onSeeAll={() => router.push("/discover")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  container: { paddingBottom: spacing(30) },
  content: { width: "100%", maxWidth: 1220, boxSizing: "border-box", alignSelf: "center", paddingHorizontal: spacing(5), gap: spacing(5) },
});
