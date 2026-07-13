import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TripStop } from "@shared/trip";
import { colors, fonts, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";

interface Props {
  stop: TripStop;
  position: number | null;
  canRemove: boolean;
  onToggle: () => void;
}

export function TripStopCard({
  stop,
  position,
  canRemove,
  onToggle,
}: Props): React.ReactElement {
  const selected = position !== null;
  const source = stop.sources[0];
  const openSource = async (): Promise<void> => {
    if (await tryOpenExternalUrl(source.url, Linking.openURL)) return;
    Alert.alert(
      "Could not open source",
      "Copy the source link and open it in your browser.",
    );
  };
  return (
    <View style={[styles.card, !selected && styles.inactive]}>
      <View style={styles.row}>
        <View style={[styles.marker, selected && styles.markerSelected]}>
          <Text
            style={[styles.markerText, selected && styles.markerTextSelected]}
          >
            {selected ? position + 1 : "+"}
          </Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{stop.name}</Text>
          <Text style={styles.meta}>{stop.duration_minutes} min</Text>
          <Text style={styles.summary}>{stop.summary}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => void openSource()}>
              <Text style={styles.link}>View source</Text>
            </Pressable>
            <Pressable disabled={selected && !canRemove} onPress={onToggle}>
              <Text
                style={[
                  styles.toggle,
                  selected && !canRemove && styles.disabled,
                ]}
              >
                {selected ? "Remove" : "Add to trip"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.control,
    padding: spacing(4),
  },
  inactive: { opacity: 0.72 },
  row: { flexDirection: "row", gap: spacing(3) },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mist,
  },
  markerSelected: { backgroundColor: colors.tide },
  markerText: { ...type.label, color: colors.inkSoft },
  markerTextSelected: { color: colors.card, fontFamily: fonts.semibold },
  content: { flex: 1 },
  name: { ...type.heading, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 1 },
  summary: { ...type.body, color: colors.inkSoft, marginTop: spacing(2) },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing(3),
  },
  link: { ...type.label, color: colors.tide },
  toggle: { ...type.label, color: colors.tide },
  disabled: { color: colors.inkSoft },
});
