import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, type } from "@/lib/theme";

export function ExperienceLink({
  experienceId,
  bookingId,
}: {
  experienceId: string;
  bookingId?: string;
}): React.ReactElement {
  const suffix = bookingId ? `?bookingId=${encodeURIComponent(bookingId)}` : "";
  return (
    <Link href={`/experience/${experienceId}${suffix}` as Href} asChild>
      <Pressable style={styles.link}>
        <Text style={styles.text}>See live reviews and evidence</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    borderColor: colors.tide,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    alignItems: "center",
  },
  text: { ...type.button, color: colors.tide },
});
