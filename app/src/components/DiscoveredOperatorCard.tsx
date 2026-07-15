import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoveredOperator } from "@shared/status";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";

export function DiscoveredOperatorCard({
  discovered,
}: {
  discovered: DiscoveredOperator;
}): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>OPERATOR FOUND ONLINE</Text>
      <Text style={styles.name}>{discovered.name}</Text>
      {discovered.snippet ? (
        <Text style={styles.snippet} numberOfLines={3}>{discovered.snippet}</Text>
      ) : null}
      <View style={styles.footer}>
        {discovered.whatsapp ? (
          <View style={styles.chip}>
            <Ionicons name="logo-whatsapp" size={14} color={colors.sageDeep} />
            <Text style={styles.chipText}>{discovered.whatsapp}</Text>
          </View>
        ) : null}
        <Pressable style={styles.link} onPress={() => void openSource(discovered.url)}>
          <Text style={styles.linkText}>{domainOf(discovered.url)}</Text>
          <Ionicons name="open-outline" size={14} color={colors.sageDeep} />
        </Pressable>
      </View>
      <ChannelButtons discovered={discovered} />
      <Text style={styles.note}>
        The video named no operator, so Bobo searched public listings. Check the
        source before relying on it.
      </Text>
    </View>
  );
}

function ChannelButtons({
  discovered,
}: {
  discovered: DiscoveredOperator;
}): React.ReactElement | null {
  const channels = [
    { key: "facebook", url: discovered.facebook, icon: "logo-facebook" as const, label: "Message on Facebook" },
    { key: "instagram", url: discovered.instagram, icon: "logo-instagram" as const, label: "Message on Instagram" },
  ].filter((channel) => channel.url !== null);
  if (channels.length === 0) return null;
  return (
    <View style={styles.channels}>
      {channels.map((channel) => (
        <Pressable
          key={channel.key}
          style={styles.channel}
          onPress={() => void openSource(channel.url ?? "")}
        >
          <Ionicons name={channel.icon} size={16} color={colors.sageDeep} />
          <Text style={styles.channelText}>{channel.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

async function openSource(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open the source", url);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(5),
    gap: spacing(2),
    ...cardShadow,
  },
  eyebrow: { ...type.caption, color: colors.inkSoft, letterSpacing: 1.2 },
  name: { ...type.heading, color: colors.ink },
  snippet: { ...type.body, color: colors.inkSoft },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing(3), flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.halo,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  chipText: { ...type.label, color: colors.sageDeep },
  link: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  linkText: { ...type.label, color: colors.sageDeep },
  channels: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  channel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.mist,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  channelText: { ...type.label, color: colors.sageDeep },
  note: { ...type.caption, color: colors.inkSoft },
});
