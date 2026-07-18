import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { mediaUrl } from "@/lib/api";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { isTiomanStop, TIOMAN_TRANSPORT_URL } from "@/lib/tiomanMobility";
import { formatDuration } from "@/lib/travelLeg";
import { openDirections, openGrab } from "@/lib/travelActions";
import { ActionButton } from "./ActionButton";
import { Chip } from "./Chip";
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
  const editable = props.editable !== false;
  const wide = useWindowDimensions().width >= 760;
  const [menuOpen, setMenuOpen] = useState(false);
  const onTioman = isTiomanStop(stop);
  const run = (action: () => void): void => {
    setMenuOpen(false);
    action();
  };
  return (
    <View style={styles.timelineRow}>
      <TimelineRail variant={selected ? "place" : "add"} position={position ?? undefined} isLast={props.isLast} />
      <View style={[styles.card, wide && styles.wideCard, !selected && styles.inactive]}>
        <View style={[styles.media, wide && styles.wideMedia]}>
          <PlaceImage
            placeId={stop.place_id}
            placePhotoAvailable={stop.place_photo_available}
            fallbackUrl={mediaUrl(stop.image_url)}
            placeAttributions={stop.place_photo_attributions}
            fallbackAttributions={stop.image_attributions}
            style={[styles.image, wide && styles.wideImage]}
          />
          <Chip tone="overlay" label={formatDuration(stop.duration_minutes)} style={styles.duration} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {stop.name}
            </Text>
            <Pressable
              accessibilityLabel="More stop actions"
              style={styles.more}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink} />
            </Pressable>
          </View>
          {menuOpen ? (
            <StopActionMenu
              selected={selected}
              canRemove={props.canRemove}
              editable={editable}
              onTioman={onTioman}
              hasEasybook={Boolean(stop.easybook_url)}
              onViewSource={() => run(() => void openSource(stop.sources[0].url))}
              onDirections={() => run(() => void openDirections(stop))}
              onGrab={() => run(() => void openGrab(stop))}
              onIslandTransport={() => run(() => void openIsland())}
              onRemove={() => run(props.onToggle)}
              onEasybook={() => run(() => void openEasybook(stop.easybook_url ?? ""))}
              onDelete={() => run(props.onDelete)}
              onClose={() => setMenuOpen(false)}
            />
          ) : null}
          <View style={styles.meta}>
            {stop.address ? (
              <Text style={styles.address} numberOfLines={1}>
                {stop.address}
              </Text>
            ) : (
              <View style={styles.metaSpacer} />
            )}
            {spendChip(stop)}
          </View>
          <Text style={styles.summary} numberOfLines={2}>
            {stop.summary}
          </Text>
          {!selected && editable ? (
            <ActionButton variant="tonal" block label="Add to itinerary" onPress={props.onToggle} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function spendChip(stop: TripStop): React.ReactElement | null {
  if (stop.estimated_spend_myr === null) return null;
  return <Chip label={stop.estimated_spend_myr > 0 ? `RM${stop.estimated_spend_myr}` : "Free"} />;
}

async function openSource(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url)) return;
  Alert.alert("Could not open source", "Copy the source link and open it in your browser.");
}

async function openEasybook(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url)) return;
  Alert.alert("Could not open EasyBook", "Try the route again later.");
}

async function openIsland(): Promise<void> {
  if (await tryOpenExternalUrl(TIOMAN_TRANSPORT_URL)) return;
  Alert.alert("Could not open Tioman transport guide", "Try the official Tioman transport page again later.");
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
  wideCard: { flexDirection: "row" },
  inactive: { opacity: 0.72 },
  media: { position: "relative", width: "100%" },
  wideMedia: { width: 300 },
  image: { width: "100%", height: 226 },
  wideImage: { width: 300, height: 260 },
  duration: { position: "absolute", left: spacing(2.5), bottom: spacing(2.5) },
  body: { flex: 1, padding: spacing(3.5), gap: spacing(2) },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2) },
  name: { ...type.heading, color: colors.ink, flex: 1 },
  more: {
    width: 34,
    height: 34,
    borderRadius: radius.control,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  address: { ...type.caption, color: colors.inkSoft, flex: 1 },
  metaSpacer: { flex: 1 },
  summary: { ...type.body, color: colors.inkSoft },
});
