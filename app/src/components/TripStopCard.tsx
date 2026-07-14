import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { PlaceImage } from "./PlaceImage";
import { StopActionMenu } from "./StopActionMenu";
import { TimelineRail } from "./TimelineRail";

interface Props {
  stop: TripStop;
  position: number | null;
  isLast: boolean;
  canRemove: boolean;
  editable?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function TripStopCard(props: Props): React.ReactElement {
  const { stop, position } = props;
  const selected = position !== null;
  const [actionsOpen, setActionsOpen] = useState(false);
  const runAction = (action: () => void): void => {
    setActionsOpen(false);
    action();
  };
  return (
    <View style={styles.timelineRow}>
      <TimelineRail position={position} isLast={props.isLast} />
      <View style={[styles.card, !selected && styles.inactive]}>
        <PlaceImage
          placeId={stop.place_id}
          placePhotoAvailable={stop.place_photo_available}
          fallbackUrl={stop.image_url}
          placeAttributions={stop.place_photo_attributions}
          fallbackAttributions={stop.image_attributions}
          style={styles.image}
        />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.name}>{stop.name}</Text>
              {stop.address ? (
                <Text style={styles.address} numberOfLines={2}>
                  {stop.address}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel="More stop actions"
              style={styles.more}
              onPress={() => setActionsOpen((open) => !open)}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={colors.ink}
              />
            </Pressable>
          </View>
          {actionsOpen ? (
            <StopActionMenu
              selected={selected}
              canRemove={props.canRemove}
              editable={props.editable !== false}
              hasEasybook={Boolean(stop.easybook_url)}
              onViewSource={() =>
                runAction(() => void openSource(stop.sources[0].url))
              }
              onToggle={() => runAction(props.onToggle)}
              onEasybook={() =>
                runAction(() => void openEasybook(stop.easybook_url ?? ""))
              }
              onDelete={() => runAction(props.onDelete)}
              onClose={() => setActionsOpen(false)}
            />
          ) : null}
          <View style={styles.chips}>
            <Text style={styles.chip}>{stop.duration_minutes} min</Text>
            {stop.estimated_spend_myr !== null ? (
              <Text style={styles.chip}>RM{stop.estimated_spend_myr}</Text>
            ) : null}
            <Text style={styles.chip}>From source</Text>
          </View>
          <Text style={styles.activityLabel}>What to do</Text>
          <Text style={styles.summary}>{stop.summary}</Text>
        </View>
      </View>
    </View>
  );
}

async function openSource(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert(
    "Could not open source",
    "Copy the source link and open it in your browser.",
  );
}

async function openEasybook(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open EasyBook", "Try the route again later.");
}

const styles = StyleSheet.create({
  timelineRow: { flexDirection: "row", gap: spacing(2), alignItems: "stretch" },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: spacing(3),
    ...hairline,
  },
  inactive: { opacity: 0.72 },
  image: { width: "100%", height: 184 },
  body: { padding: spacing(3.5), gap: spacing(2) },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2) },
  titleCopy: { flex: 1, gap: spacing(1) },
  name: { ...type.heading, color: colors.ink },
  address: { ...type.caption, color: colors.inkSoft },
  more: {
    width: 38,
    height: 38,
    borderRadius: radius.control,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  chip: {
    ...type.caption,
    color: colors.sageDeep,
    backgroundColor: colors.halo,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  activityLabel: { ...type.label, color: colors.sageDeep },
  summary: { ...type.body, color: colors.inkSoft },
});
