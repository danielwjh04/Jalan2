import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExperienceRecord } from "@shared/reviews";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { SurfaceCard } from "@/components/SurfaceCard";
import { getExperience, serverUrl } from "@/lib/api";
import { colors, eyebrow, gradients, radius, spacing, type } from "@/lib/theme";

const POLL_MS = 5000;

export default function ExperienceScreen(): React.ReactElement {
  const { id, bookingId } = useLocalSearchParams<{ id: string; bookingId?: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ExperienceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (showSpinner = false): Promise<void> => {
    if (showSpinner) setRefreshing(true);
    try {
      setRecord(await getExperience(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load operator record");
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Local operator" onBack={() => router.back()} />
      {!record ? (
        <View style={styles.center}>
          {error ? <StateCard title="Operator record could not load" message={error} actionLabel="Retry" onAction={() => void load(true)} /> : <ActivityIndicator color={colors.sage} />}
        </View>
      ) : <ExperienceContent record={record} bookingId={bookingId} refreshing={refreshing} onRefresh={() => void load(true)} onSaved={setRecord} />}
    </View>
  );
}

function ExperienceContent(props: {
  record: ExperienceRecord;
  bookingId?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onSaved: (record: ExperienceRecord) => void;
}): React.ReactElement {
  const { record } = props;
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} tintColor={colors.sage} />}
    >
      <ExperienceHero record={record} />
      <Text style={styles.confirmation}>{confirmationCopy(record)}</Text>
      <Text style={styles.source} onPress={() => void Linking.openURL(record.sourceUrl)}>Open original discovery source</Text>
      <EvidenceSummary record={record} />
      <PublicEvidence record={record} />
      <Text style={styles.reviewsTitle}>Reviews</Text>
      {record.reviews.length ? record.reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <Text style={styles.empty}>No reviews yet. New reviews appear here immediately.</Text>}
      <ReviewForm experienceId={record.id} bookingId={props.bookingId} onSaved={props.onSaved} />
    </ScrollView>
  );
}

function ExperienceHero({ record }: { record: ExperienceRecord }): React.ReactElement {
  if (!record.coverUrl) {
    return <SurfaceCard style={styles.plainHero}><Text style={styles.heroEyebrow}>JALAN2 LOCAL</Text><Text style={styles.plainTitle}>{record.activity}</Text><Text style={styles.plainMeta}>{record.operatorName} | {record.meetingPointName}</Text></SurfaceCard>;
  }
  return (
    <View style={styles.hero}>
      <Image source={{ uri: serverUrl(record.coverUrl) }} style={styles.heroImage} />
      <LinearGradient colors={gradients.scrim} style={StyleSheet.absoluteFillObject} />
      <View style={styles.heroCopy}><Text style={styles.heroEyebrow}>JALAN2 LOCAL</Text><Text style={styles.heroTitle}>{record.activity}</Text><Text style={styles.heroMeta}>{record.operatorName} | {record.meetingPointName}</Text></View>
    </View>
  );
}

function EvidenceSummary({ record }: { record: ExperienceRecord }): React.ReactElement {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.sectionTitle}>Traveler evidence</Text>
      <View style={styles.scoreRow}>
        <Score label="Accuracy" value={record.summary.averages.accuracy} />
        <Score label="Communication" value={record.summary.averages.communication} />
        <Score label="Value" value={record.summary.averages.value} />
      </View>
      <Text style={styles.counts}>{record.summary.bookingLinkedCount} booking linked | {record.summary.communityCount} community</Text>
    </SurfaceCard>
  );
}

function PublicEvidence({ record }: { record: ExperienceRecord }): React.ReactElement {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.sectionTitle}>Public web presence</Text>
      {record.publicEvidence.length ? record.publicEvidence.map((item, index) => <Text key={`${item}-${index}`} style={styles.evidence}>• {item}</Text>) : <Text style={styles.muted}>No public web evidence was attached.</Text>}
      <Text style={styles.disclaimer}>Public mentions are not registration, licensing, accreditation, or a safety assessment.</Text>
    </SurfaceCard>
  );
}

function Score({ label, value }: { label: string; value: number | null }): React.ReactElement {
  return <View style={styles.score}><Text style={styles.scoreValue}>{value === null ? "New" : `${value}/5`}</Text><Text style={styles.scoreLabel}>{label}</Text></View>;
}

function confirmationCopy(record: ExperienceRecord): string {
  return record.lastOperatorConfirmationAt ? `Last confirmed ${new Date(record.lastOperatorConfirmationAt).toLocaleString()}` : "No operator-confirmed Jalan2 booking yet";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing(5), gap: spacing(4), paddingBottom: spacing(34) },
  center: { flex: 1, justifyContent: "center", padding: spacing(5) },
  hero: { height: 330, borderRadius: radius.card, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  heroCopy: { position: "absolute", left: spacing(5), right: spacing(5), bottom: spacing(5), gap: spacing(1) },
  heroEyebrow: { ...eyebrow, color: "rgba(255,255,255,0.78)" },
  heroTitle: { ...type.display, color: colors.white, fontSize: 29, lineHeight: 34 },
  heroMeta: { ...type.body, color: "rgba(255,255,255,0.82)" },
  plainHero: { gap: spacing(2) },
  plainTitle: { ...type.display, color: colors.ink },
  plainMeta: { ...type.body, color: colors.inkSoft },
  confirmation: { ...type.caption, color: colors.confirm },
  source: { ...type.button, color: colors.sageDeep },
  card: { gap: spacing(3) },
  sectionTitle: { ...type.heading, color: colors.ink },
  scoreRow: { flexDirection: "row", gap: spacing(2) },
  score: { flex: 1, backgroundColor: colors.canvas, borderRadius: radius.control, padding: spacing(3), alignItems: "center" },
  scoreValue: { ...type.heading, color: colors.sageDeep },
  scoreLabel: { ...type.caption, color: colors.inkSoft, textAlign: "center" },
  counts: { ...type.caption, color: colors.inkSoft },
  evidence: { ...type.body, color: colors.ink },
  muted: { ...type.body, color: colors.inkSoft },
  disclaimer: { ...type.caption, color: colors.pending },
  reviewsTitle: { ...type.title, color: colors.ink },
  empty: { ...type.body, color: colors.inkSoft, textAlign: "center", paddingVertical: spacing(5) },
});
