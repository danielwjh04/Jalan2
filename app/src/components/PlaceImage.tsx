import { useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ImageAttribution as Attribution } from '@shared/media';
import { colors } from '@/lib/theme';
import { placePhotoUrl } from '@/lib/api';
import { ImageAttribution } from './ImageAttribution';

type Source = 'place' | 'fallback' | 'none';

interface Props {
  placeId?: string | null;
  placePhotoAvailable: boolean;
  fallbackUrl?: string | null;
  placeAttributions: Attribution[];
  fallbackAttributions: Attribution[];
  style: StyleProp<ImageStyle>;
}

export function PlaceImage({
  placeId,
  placePhotoAvailable,
  fallbackUrl,
  placeAttributions,
  fallbackAttributions,
  style,
}: Props): React.ReactElement {
  const primary = placePhotoAvailable && placeId ? placePhotoUrl(placeId) : null;
  const initial = sourceFor(primary, fallbackUrl);
  const [source, setSource] = useState<Source>(initial);
  useEffect(() => setSource(initial), [initial]);
  const url = source === 'place' ? primary : fallbackUrl;
  const credits = source === 'place' ? placeAttributions : fallbackAttributions;
  return (
    <View>
      {url ? (
        <Image
          resizeMode="cover"
          source={{ uri: url }}
          style={style}
          onError={() => setSource(source === 'place' && fallbackUrl ? 'fallback' : 'none')}
        />
      ) : (
        <View accessibilityLabel="No place photo available" style={[style, styles.placeholder]}>
          <View style={styles.placeholderIcon}>
            <Ionicons name="location-outline" size={26} color={colors.sageDeep} />
          </View>
        </View>
      )}
      <ImageAttribution items={source === 'none' ? [] : credits} />
    </View>
  );
}

function sourceFor(primary: string | null, fallback?: string | null): Source {
  if (primary) return 'place';
  return fallback ? 'fallback' : 'none';
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.halo,
    justifyContent: 'center',
  },
  placeholderIcon: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
