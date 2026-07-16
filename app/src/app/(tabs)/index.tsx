import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { CoreProductFlows } from '@/components/CoreProductFlows';
import { DemoFlowShowcase } from '@/components/DemoFlowShowcase';
import { HomeHero } from '@/components/HomeHero';
import { colors, spacing } from '@/lib/theme';
import { useHomeScreen } from "@/lib/useHomeScreen";

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { prefill, busy, discoveries, chooseMenuSource, startMenuDemo } = useHomeScreen();
  const createGuide = (urls: string[]): void => {
    router.push({ pathname: "/social-plan", params: { urls: urls.join("\n"), auto: "1" } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <HomeHero />
      <View style={styles.content}>
        <CoreProductFlows
          prefill={prefill}
          busy={busy}
          onGenerate={createGuide}
          onMenu={chooseMenuSource}
          onMenuDemo={startMenuDemo}
        />
        <DemoFlowShowcase discoveries={discoveries} onOpen={(id) => router.push(`/trip/${id}`)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  container: { paddingBottom: spacing(30) },
  content: { width: "100%", maxWidth: 1220, boxSizing: "border-box", alignSelf: "center", paddingHorizontal: spacing(5), gap: spacing(5) },
});
