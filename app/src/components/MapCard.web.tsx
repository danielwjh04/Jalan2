import { StyleSheet, Text, View } from "react-native";
import type { MeetingPoint } from "@shared/transit";
import type { TripStop } from "@shared/trip";
import { mediaUrl } from "@/lib/api";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";
import { PlaceImage } from "./PlaceImage";

export function MapCard({
  point,
  stop,
}: {
  point: MeetingPoint;
  stop?: TripStop | null;
}): React.ReactElement {
  return (
    <View style={styles.wrap}>
      {stop ? (
        <PlaceImage
          placeId={stop.place_id}
          placePhotoAvailable={stop.place_photo_available}
          fallbackUrl={mediaUrl(stop.image_url)}
          placeAttributions={stop.place_photo_attributions}
          fallbackAttributions={stop.image_attributions}
          style={styles.photo}
        />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.label}>MEETING POINT</Text>
        <Text style={styles.name}>{point.name}</Text>
        <Text style={styles.coordinates}>
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.mist,
    backgroundColor: colors.halo,
    overflow: "hidden",
    ...cardShadow,
  },
  photo: { width: "100%", height: 170 },
  body: {
    minHeight: 130,
    padding: spacing(5),
    justifyContent: "center",
    gap: spacing(2),
  },
  label: { ...type.caption, color: colors.inkSoft, letterSpacing: 1.2 },
  name: { ...type.title, color: colors.ink },
  coordinates: { ...type.caption, color: colors.inkSoft },
});
