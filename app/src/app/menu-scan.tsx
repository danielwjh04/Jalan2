import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AgentProgress, type AgentProgressStep } from "@/components/AgentProgress";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { postMenu, postMenuDemo } from "@/lib/api";
import { cacheMenuResponse, pendingMenuScan } from "@/lib/menuScanSession";
import { colors, spacing } from "@/lib/theme";

const STEPS: AgentProgressStep[] = [
  { label: "Vision agent finds every menu row", detail: "Detecting text blocks and keeping a bounding box for each visible dish." },
  { label: "Language agent translates local names", detail: "Reading Chinese, Malay and handwritten labels without flattening regional differences." },
  { label: "Food agent identifies the Malaysian dish", detail: "Separating lookalikes such as yee mee, ban mian and Malaysian Hokkien mee." },
  { label: "Photo agent verifies each match", detail: "Searching licensed photos and rejecting images that depict the wrong regional recipe." },
  { label: "Ordering agent prepares the guide", detail: "Adding taste notes, allergens, pointing boxes and Malay, Cantonese and Mandarin phrases." },
];

export default function MenuScanScreen(): React.ReactElement {
  const { session } = useLocalSearchParams<{ session: string }>();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (): Promise<void> => {
    const scan = session ? pendingMenuScan(session) : null;
    if (!scan) {
      setError("The selected menu photo is no longer available. Choose it again.");
      return;
    }
    setError(null);
    setActiveIndex(0);
    const timer = setInterval(() => setActiveIndex((index) => Math.min(index + 1, STEPS.length - 1)), 650);
    try {
      const request = scan.mode === "demo"
        ? postMenuDemo()
        : postMenu({ imageBase64: scan.imageBase64, mimeType: scan.mimeType });
      const [menu] = await Promise.all([request, delay(2_850)]);
      cacheMenuResponse(menu);
      setActiveIndex(STEPS.length - 1);
      await delay(280);
      router.replace(`/menu/${menu.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this menu");
    } finally {
      clearInterval(timer);
    }
  }, [router, session]);
  useEffect(() => { void run(); }, [run]);
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Reading menu" onBack={() => router.back()} />
      <View style={styles.content}>
        {error ? (
          <StateCard title="Menu could not be read" message={error} actionLabel="Try again" onAction={() => void run()} />
        ) : (
          <AgentProgress title="Building your kopitiam food guide" intro="The agents keep the photographed row, the identified dish and the example photo separate so you can point and order with confidence." steps={STEPS} activeIndex={activeIndex} />
        )}
      </View>
    </View>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center", justifyContent: "center", padding: spacing(5) },
});
