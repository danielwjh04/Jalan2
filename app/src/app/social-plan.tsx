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
    const progress = createProgressController(setStage);
    try {
      const result = await generateSocialGuide(urls, progress.report);
      await progress.finish();
      router.replace(guideDestination(result.trip.id, result.bookingId));
    } catch {
      setError("Could not generate this guide. Check the links and try again.");
    } finally {
      progress.stop();
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

const PROGRESS_STAGES: PipelineStage[] = ["EXTRACTING", "TRANSCRIBING", "READING_FRAMES", "FUSING", "READY"];

function createProgressController(setStage: (stage: PipelineStage) => void): {
  report: (stage: PipelineStage) => void;
  finish: () => Promise<void>;
  stop: () => void;
} {
  let current = 0;
  let target = 0;
  let finishResolve: (() => void) | null = null;
  let settled = false;
  const tick = (): void => {
    if (current < target) {
      current += 1;
      setStage(PROGRESS_STAGES[current]);
    }
    if (finishResolve && current === PROGRESS_STAGES.length - 1 && !settled) {
      settled = true;
      setTimeout(() => finishResolve?.(), 280);
    }
  };
  const timer = setInterval(tick, 620);
  return {
    report: (stage) => {
      const index = PROGRESS_STAGES.indexOf(stage);
      if (index >= 0) target = Math.max(target, index);
    },
    finish: () => {
      target = PROGRESS_STAGES.length - 1;
      return new Promise((resolve) => {
        finishResolve = resolve;
        tick();
      });
    },
    stop: () => clearInterval(timer),
  };
}

function paramText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join("\n");
  return value ?? "";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(4) },
});
