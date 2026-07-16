import { ScrollView, StyleSheet, View } from "react-native";
import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { BoboCard } from '@/components/BoboCard';
import { CoreProductFlows } from '@/components/CoreProductFlows';
import { DemoFlowShowcase } from '@/components/DemoFlowShowcase';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeDiscoveryPreview, HomeQuickActions } from "@/components/HomeSections";
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
          title="Bring the post. I'll make it usable."
          message="Turn an XHS or TikTok find into a real trip, or scan a kopitiam menu and know exactly what to order."
        />
        <CoreProductFlows
          prefill={prefill}
          busy={busy}
          onSubmit={submit}
          onMultiSource={() => router.push('/social-plan')}
          onMenu={chooseMenuSource}
          onMenuDemo={startMenuDemo}
        />
        <DemoFlowShowcase discoveries={discoveries} onOpen={(id) => router.push(`/trip/${id}`)} />
        <SmartPlanComposer />
        <HomeQuickActions onOperators={() => router.push('/discover?section=operators')} />
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
