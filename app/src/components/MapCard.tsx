import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { MeetingPoint } from '@shared/transit';
import type { TripStop } from '@shared/trip';
import { mediaUrl } from '@/lib/api';
import { cardShadow, colors, radius } from '@/lib/theme';
import { PlaceImage } from './PlaceImage';

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
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: point.lat,
          longitude: point.lng,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        <Marker
          coordinate={{ latitude: point.lat, longitude: point.lng }}
          title={point.name}
          description="Meeting point"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mist,
    backgroundColor: colors.card,
    ...cardShadow,
  },
  photo: { width: '100%', height: 140 },
  map: { width: '100%', height: 210 },
});
