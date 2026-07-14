import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import type { ExperienceRecord } from "@shared/reviews";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { getExperience, serverUrl } from "@/lib/api";
import { cardShadow, colors, eyebrow, gradients, radius, spacing, type } from "@/lib/theme";

const POLL_MS = 5000;

export default function ExperienceScreen(): React.ReactElement {
  const { id, bookingId } = useLocalSearchParams<{ id: string; bookingId?: string }>();
  const [record, setRecord] = useState<ExperienceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false): Promise<void> => {
    if (showSpinner) setRefreshing(true);
    try {
      setRecord(await getExperience(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!record) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.sage} />}
      </View>
    );
  }

  const confirmation = record.lastOperatorConfirmationAt
    ? new Date(record.lastOperatorConfirmationAt).toLocaleString()
    : "No operator-confirmed Jalan2 booking yet";
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.sage} />}
    >
      {record.coverUrl ? (
        <View style={styles.hero}>
          <Image source={{ uri: serverUrl(record.coverUrl) }} style={styles.heroImage} />
          <LinearGradient colors={gradients.scrim} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>JALAN2 LIVE</Text>
            <Text style={styles.heroTitle}>{record.activity}</Text>
            <Text style={styles.heroMeta}>{record.operatorName} | {record.meetingPointName}</Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={eyebrow}>JALAN2 LIVE</Text>
          <Text style={styles.title}>{record.activity}</Text>
          <Text style={styles.operator}>{record.operatorName} | {record.meetingPointName}</Text>
        </>
      )}
      <Text style={styles.confirmation}>{confirmation}</Text>
      <Text style={styles.source} onPress={() => void Linking.openURL(record.sourceUrl)}>
        Open original discovery source
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Traveler evidence</Text>
        <View style={styles.scoreRow}>
          <Score label="Accuracy" value={record.summary.averages.accuracy} />
          <Score label="Communication" value={record.summary.averages.communication} />
          <Score label="Value" value={record.summary.averages.value} />
        </View>
        <Text style={styles.counts}>
          {record.summary.bookingLinkedCount} booking linked | {record.summary.communityCount} community
        </Text>
      </View>

      <View style={styles.evidenceCard}>
        <Text style={styles.sectionTitle}>Public web presence</Text>
        {record.publicEvidence.length ? record.publicEvidence.map((item, index) => (
          <Text key={`${item}-${index}`} style={styles.evidence}>• {item}</Text>
        )) : <Text style={styles.muted}>No public web evidence was attached.</Text>}
        <Text style={styles.disclaimer}>
          Public mentions are not registration, licensing, accreditation, or a safety assessment.
        </Text>
      </View>

      <Text style={styles.reviewsTitle}>Reviews</Text>
      {record.reviews.length ? record.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      )) : <Text style={styles.empty}>No reviews yet. New reviews appear here immediately.</Text>}
      <ReviewForm experienceId={record.id} bookingId={bookingId} onSaved={setRecord} />
    </ScrollView>
  );
}

function Score({ label, value }: { label: string; value: number | null }): React.ReactElement {
  return (
    <View style={styles.score}>
      <Text style={styles.scoreValue}>{value === null ? "New" : `${value}/5`}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing(5), gap: spacing(4), paddingBottom: spacing(12) },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(6) },
  error: { ...type.body, color: colors.danger, textAlign: "center" },
  title: { ...type.display, color: colors.ink },
  operator: { ...type.body, color: colors.inkSoft },
  hero: { height: 360, borderRadius: radius.card, overflow: "hidden", ...cardShadow },
  heroImage: { width: "100%", height: "100%" },
  heroCopy: { position: "absolute", left: spacing(5), right: spacing(5), bottom: spacing(5), gap: spacing(1.5) },
  heroEyebrow: { ...eyebrow, color: "rgba(255,255,255,0.72)" },
  heroTitle: { ...type.display, color: colors.white, fontSize: 30, lineHeight: 35 },
  heroMeta: { ...type.body, color: "rgba(255,255,255,0.78)" },
  confirmation: { ...type.caption, color: colors.confirm },
  source: { ...type.button, color: colors.sageDeep },
  summaryCard: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(4), gap: spacing(3), ...cardShadow },
  sectionTitle: { ...type.heading, color: colors.ink },
  scoreRow: { flexDirection: "row", gap: spacing(2) },
  score: { flex: 1, backgroundColor: colors.canvas, borderRadius: radius.control, padding: spacing(3), alignItems: "center" },
  scoreValue: { ...type.heading, color: colors.sageDeep },
  scoreLabel: { ...type.caption, color: colors.inkSoft, textAlign: "center" },
  counts: { ...type.caption, color: colors.inkSoft },
  evidenceCard: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(4), gap: spacing(2), ...cardShadow },
  evidence: { ...type.body, color: colors.ink },
  muted: { ...type.body, color: colors.inkSoft },
  disclaimer: { ...type.caption, color: colors.pending, marginTop: spacing(1) },
  reviewsTitle: { ...type.title, color: colors.ink, marginTop: spacing(2) },
  empty: { ...type.body, color: colors.inkSoft, textAlign: "center", paddingVertical: spacing(6) },
});
