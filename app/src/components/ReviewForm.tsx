import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ExperienceRecord, ReviewRatings } from "@shared/reviews";
import { submitExperienceReview } from "@/lib/api";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";

const ratingFields: { key: keyof ReviewRatings; label: string }[] = [
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "value", label: "Value" },
];

export function ReviewForm({
  experienceId,
  bookingId,
  onSaved,
}: {
  experienceId: string;
  bookingId?: string;
  onSaved: (record: ExperienceRecord) => void;
}): React.ReactElement {
  const [authorName, setAuthorName] = useState("");
  const [visitMonth, setVisitMonth] = useState(new Date().toISOString().slice(0, 7));
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState<ReviewRatings>({ accuracy: 5, communication: 5, value: 5 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      const record = await submitExperienceReview(experienceId, {
        authorName,
        visitMonth,
        body,
        ratings,
        ...(bookingId ? { bookingId } : {}),
      });
      onSaved(record);
      setBody("");
      setMessage("Review published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Share what happened</Text>
      <Text style={styles.note}>
        {bookingId
          ? "Linked to this booking after operator confirmation. This does not verify attendance."
          : "Published as an unverified community report."}
      </Text>
      <TextInput style={styles.input} value={authorName} onChangeText={setAuthorName} placeholder="Display name" placeholderTextColor={colors.inkSoft} />
      <TextInput style={styles.input} value={visitMonth} onChangeText={setVisitMonth} placeholder="YYYY-MM" placeholderTextColor={colors.inkSoft} />
      {ratingFields.map((field) => (
        <View key={field.key} style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>{field.label}</Text>
          {[1, 2, 3, 4, 5].map((score) => (
            <Pressable key={score} style={[styles.score, ratings[field.key] === score && styles.scoreActive]} onPress={() => setRatings({ ...ratings, [field.key]: score })}>
              <Text style={[styles.scoreText, ratings[field.key] === score && styles.scoreTextActive]}>{score}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <TextInput style={[styles.input, styles.body]} value={body} onChangeText={setBody} placeholder="What should the next traveler know?" placeholderTextColor={colors.inkSoft} multiline maxLength={1000} />
      <Pressable style={styles.submit} onPress={() => void submit()} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.card} /> : <Text style={styles.submitText}>Publish review</Text>}
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(4), gap: spacing(3), ...cardShadow },
  title: { ...type.title, color: colors.ink },
  note: { ...type.caption, color: colors.inkSoft },
  input: { ...type.body, color: colors.ink, borderColor: colors.mist, borderWidth: 1, borderRadius: radius.control, padding: spacing(3) },
  body: { minHeight: 110, textAlignVertical: "top" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  ratingLabel: { ...type.label, color: colors.ink, flex: 1 },
  score: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  scoreActive: { backgroundColor: colors.tide },
  scoreText: { ...type.label, color: colors.inkSoft },
  scoreTextActive: { color: colors.card },
  submit: { height: 48, borderRadius: radius.control, backgroundColor: colors.tide, alignItems: "center", justifyContent: "center" },
  submitText: { ...type.button, color: colors.card },
  message: { ...type.caption, color: colors.inkSoft },
});
