import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import type { PipelineStage } from "@shared/status";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SocialGuideComposer } from "@/components/SocialGuideComposer";
import { StageProgress } from "@/components/StageProgress";
import { guideDestination } from "@/lib/ingestDestination";
import { generateSocialGuide, parseSocialUrls } from "@/lib/socialPlanner";
import { colors, spacing } from "@/lib/theme";

export default function SocialPlanScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ urls?: string | string[]; auto?: string }>();
  const initialUrls = useMemo(() => parseSocialUrls(paramText(params.urls)), [params.urls]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<PipelineStage>("QUEUED");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const generate = useCallback(async (urls: string[]): Promise<void> => {
    setBusy(true);
    setStage("EXTRACTING");
    setError(null);
    try {
      const result = await generateSocialGuide(urls, setStage);
      router.replace(guideDestination(result.trip.id, result.bookingId));
    } catch {
      setError("Could not generate this guide. Check the links and try again.");
    } finally {
      setBusy(false);
    }
  }, [router]);
  useEffect(() => {
    if (params.auto !== "1" || started.current || initialUrls.length === 0) return;
    started.current = true;
    void generate(initialUrls);
  }, [generate, initialUrls, params.auto]);
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Create a guide" eyebrowText="XHS + TIKTOK" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {busy ? <StageProgress stage={stage} error={null} /> : null}
        <SocialGuideComposer initialUrls={initialUrls} busy={busy} error={error} onGenerate={(urls) => void generate(urls)} />
      </ScrollView>
    </View>
  );
}

function paramText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join("\n");
  return value ?? "";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(4) },
});
