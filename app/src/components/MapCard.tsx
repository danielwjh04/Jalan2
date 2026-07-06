import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { MeetingPoint } from '@shared/transit';
import { cardShadow, colors, radius } from '@/lib/theme';

export function MapCard({ point }: { point: MeetingPoint }): React.ReactElement {
  return (
    <View style={styles.wrap}>
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
  map: { width: '100%', height: 210 },
});
