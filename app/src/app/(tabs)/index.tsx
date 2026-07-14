import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { BoboCard } from '@/components/BoboCard';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeDiscoveryPreview, HomeQuickActions } from "@/components/HomeSections";
import { PasteBar } from '@/components/PasteBar';
import { colors, spacing } from '@/lib/theme';
import { useHomeScreen } from "@/lib/useHomeScreen";

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { prefill, busy, discoveries, fixtures, submit, chooseMenuSource } = useHomeScreen();
  const regions = [...new Set(discoveries.map(({ region }) => region))];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <HomeHeader regions={regions} />
      <View style={styles.content}>
        <BoboCard
          hero
          eyebrow="BOBO SAYS SELAMAT DATANG"
          title="Where shall we jalan today?"
          message="Paste a Malaysian adventure video and I will shape it into a real day out."
        />
        <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
        <HomeQuickActions busy={busy} onMenu={chooseMenuSource} onOperators={() => router.push('/discover?section=operators')} />
        <HomeDiscoveryPreview
          discoveries={discoveries.slice(0, 2)}
          devFixture={fixtures[0]}
          busy={busy}
          onOpen={(id) => router.push(`/trip/${id}`)}
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
  content: { paddingHorizontal: spacing(5), gap: spacing(4) },
});
