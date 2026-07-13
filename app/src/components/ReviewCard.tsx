import { StyleSheet, Text, View } from "react-native";
import type { ExperienceReview } from "@shared/reviews";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";

export function ReviewCard({ review }: { review: ExperienceReview }): React.ReactElement {
  const linked = review.verification === "booking_linked";
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{review.authorName}</Text>
          <Text style={styles.date}>Visited {review.visitMonth}</Text>
        </View>
        <View style={[styles.badge, linked ? styles.linked : styles.community]}>
          <Text style={[styles.badgeText, linked && styles.linkedText]}>
            {linked ? "Booking linked" : "Community report"}
          </Text>
        </View>
      </View>
      <View style={styles.ratings}>
        <Text style={styles.rating}>Accuracy {review.ratings.accuracy}/5</Text>
        <Text style={styles.rating}>Communication {review.ratings.communication}/5</Text>
        <Text style={styles.rating}>Value {review.ratings.value}/5</Text>
      </View>
      <Text style={styles.body}>{review.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(3),
    ...cardShadow,
  },
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing(3) },
  name: { ...type.heading, color: colors.ink },
  date: { ...type.caption, color: colors.inkSoft },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1) },
  linked: { backgroundColor: colors.confirmSoft },
  community: { backgroundColor: colors.canvas },
  badgeText: { ...type.caption, color: colors.inkSoft },
  linkedText: { color: colors.confirm },
  ratings: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  rating: { ...type.caption, color: colors.tide, backgroundColor: colors.tideSoft, padding: spacing(1.5), borderRadius: radius.pill },
  body: { ...type.body, color: colors.ink },
});
