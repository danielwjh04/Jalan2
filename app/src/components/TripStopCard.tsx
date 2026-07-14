import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TripStop } from "@shared/trip";
import { colors, fonts, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { PlaceImage } from "./PlaceImage";

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
  return (
    <View style={[styles.card, !selected && styles.inactive]}>
      <PlaceImage
        placeId={stop.place_id}
        placePhotoAvailable={stop.place_photo_available}
        fallbackUrl={stop.image_url}
        placeAttributions={stop.place_photo_attributions}
        fallbackAttributions={stop.image_attributions}
        style={styles.image}
      />
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
          {stop.address ? (
            <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
          ) : null}
          <Text style={styles.activityLabel}>What to do</Text>
          <Text style={styles.summary} numberOfLines={2}>{stop.summary}</Text>
          <StopActions
            stop={stop}
            selected={selected}
            canRemove={canRemove}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        </View>
      </View>
    </View>
  );
}

function StopActions({
  stop,
  selected,
  canRemove,
  onToggle,
  onDelete,
}: Pick<Props, "stop" | "canRemove" | "onToggle" | "onDelete"> & {
  selected: boolean;
}): React.ReactElement {
  const easybookUrl = stop.easybook_url;
  return (
    <View style={styles.actions}>
      <Pressable onPress={() => void openSource(stop.sources[0].url)}>
        <Text style={styles.link}>View source</Text>
      </Pressable>
      <Pressable disabled={selected && !canRemove} onPress={onToggle}>
        <Text style={[styles.toggle, selected && !canRemove && styles.disabled]}>
          {selected ? "Remove" : "Add to trip"}
        </Text>
      </Pressable>
      {easybookUrl ? (
        <Pressable onPress={() => void openEasybook(easybookUrl)}>
          <Text style={styles.link}>EasyBook</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onDelete}>
        <Text style={styles.delete}>Delete</Text>
      </Pressable>
    </View>
  );
}

async function openSource(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open source", "Copy the source link and open it in your browser.");
}

async function openEasybook(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open EasyBook", "Try the route again later.");
}

// The photo takes about twice the vertical space of the text block below it,
// so the image leads and the copy stays a compact caption.
const IMAGE_HEIGHT = 184;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: "hidden",
    ...hairline,
  },
  inactive: { opacity: 0.72 },
  image: { width: "100%", height: IMAGE_HEIGHT },
  row: { flexDirection: "row", gap: spacing(3), padding: spacing(4) },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.halo,
  },
  markerSelected: { backgroundColor: colors.sage },
  markerText: { ...type.label, color: colors.sageDeep },
  markerTextSelected: { color: colors.white, fontFamily: fonts.semibold },
  content: { flex: 1 },
  name: { ...type.heading, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 1 },
  address: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  activityLabel: { ...type.label, color: colors.sageDeep, marginTop: spacing(1.5) },
  summary: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1.5) },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(3),
    marginTop: spacing(2.5),
  },
  link: { ...type.label, color: colors.sageDeep },
  toggle: { ...type.label, color: colors.sageDeep },
  delete: { ...type.label, color: colors.danger },
  disabled: { color: colors.inkSoft },
});
