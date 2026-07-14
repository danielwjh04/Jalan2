import {
  Alert,
  Image,
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
  onDelete: () => void;
}

export function TripStopCard({
  stop,
  position,
  canRemove,
  onToggle,
  onDelete,
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
  const openEasybook = async (): Promise<void> => {
    if (!stop.easybook_url) return;
    if (await tryOpenExternalUrl(stop.easybook_url, Linking.openURL)) return;
    Alert.alert("Could not open EasyBook", "Try the route again later.");
  };
  return (
    <View style={[styles.card, !selected && styles.inactive]}>
      {stop.image_url ? (
        <Image source={{ uri: stop.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
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
          {stop.address ? <Text style={styles.address}>{stop.address}</Text> : null}
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
            {stop.easybook_url ? (
              <Pressable onPress={() => void openEasybook()}>
                <Text style={styles.link}>EasyBook</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onDelete}>
              <Text style={styles.delete}>Delete</Text>
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
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.mist,
  },
  inactive: { opacity: 0.72 },
  image: { width: "100%", height: 154 },
  imageFallback: { backgroundColor: colors.tideSoft },
  row: { flexDirection: "row", gap: spacing(3), padding: spacing(4) },
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
  markerTextSelected: { color: colors.black, fontFamily: fonts.semibold },
  content: { flex: 1 },
  name: { ...type.heading, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 1 },
  address: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  summary: { ...type.body, color: colors.inkSoft, marginTop: spacing(2) },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(3),
    marginTop: spacing(3),
  },
  link: { ...type.label, color: colors.tide },
  toggle: { ...type.label, color: colors.tide },
  delete: { ...type.label, color: colors.danger },
  disabled: { color: colors.inkSoft },
});
