import { StyleSheet, Text, View } from "react-native";
import type { ItineraryMessage } from "@shared/status";
import { colors, spacing, type } from "@/lib/theme";
import { SurfaceCard } from "./SurfaceCard";

export function BookingMessages({ messages }: { messages: ItineraryMessage[] }): React.ReactElement {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>WhatsApp updates</Text>
      {messages.length === 0 ? <Text style={styles.empty}>The request is sent. Operator replies appear here.</Text> : messages.map((message, index) => (
        <View key={`${message.at}-${index}`} style={[styles.bubble, message.direction === "inbound" && styles.inbound]}>
          <Text style={styles.label}>{message.direction === "inbound" ? "Operator" : "Your request"}</Text>
          <Text style={styles.message}>{message.text}</Text>
        </View>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing(2) },
  title: { ...type.heading, color: colors.ink },
  empty: { ...type.body, color: colors.inkSoft },
  bubble: { backgroundColor: colors.canvas, padding: spacing(3), borderRadius: 16, gap: spacing(1), alignSelf: "stretch" },
  inbound: { backgroundColor: colors.confirmSoft },
  label: { ...type.caption, color: colors.sageDeep },
  message: { ...type.body, color: colors.ink },
});
