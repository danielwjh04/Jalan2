import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, Text, type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ImageAttribution as Attribution } from '@shared/media';
import { colors } from '@/lib/theme';
import { placePhotoUrl } from '@/lib/api';
import { ImageAttribution } from './ImageAttribution';

type Source = 'place' | 'fallback' | 'none';
const MAX_PLACE_PHOTOS = 5;
const CONTROLS_IDLE_MS = 2_600;

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
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasGallery = Boolean(placePhotoAvailable && placeId);
  const showControls = useCallback(() => {
    if (!hasGallery) return;
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }, CONTROLS_IDLE_MS);
  }, [controlsOpacity, hasGallery]);
  useEffect(() => {
    setSource(initial);
    setPhotoIndex(0);
    setFailedIndexes([]);
    showControls();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [initial, showControls]);
  const url = source === 'place' && placeId ? placePhotoUrl(placeId, photoIndex) : fallbackUrl;
  const credits = source === 'place' ? placeAttributions : fallbackAttributions;
  const move = (direction: -1 | 1): void => {
    showControls();
    if (!hasGallery) return;
    const available = Array.from({ length: MAX_PLACE_PHOTOS }, (_, index) => index)
      .filter((index) => !failedIndexes.includes(index));
    const current = Math.max(0, available.indexOf(photoIndex));
    const next = available[(current + direction + available.length) % available.length];
    setSource('place');
    setPhotoIndex(next ?? 0);
  };
  const handleError = (): void => {
    if (source !== 'place') {
      setSource('none');
      return;
    }
    const failed = [...new Set([...failedIndexes, photoIndex])];
    setFailedIndexes(failed);
    const next = Array.from({ length: MAX_PLACE_PHOTOS }, (_, index) => index)
      .find((index) => !failed.includes(index));
    if (next !== undefined) setPhotoIndex(next);
    else setSource(fallbackUrl ? 'fallback' : 'none');
  };
  return (
    <View>
      <Pressable accessibilityRole={hasGallery ? 'button' : undefined} accessibilityLabel={hasGallery ? 'Show photo controls' : undefined} onPress={showControls}>
        {url ? (
          <Image
            resizeMode="cover"
            source={{ uri: url }}
            style={style}
            onError={handleError}
          />
        ) : (
          <View accessibilityLabel="No place photo available" style={[style, styles.placeholder]}>
            <View style={styles.placeholderIcon}>
              <Ionicons name="location-outline" size={26} color={colors.sageDeep} />
            </View>
          </View>
        )}
        {hasGallery && source === 'place' ? (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.controls, { opacity: controlsOpacity }]}>
            <Arrow direction="back" onPress={() => move(-1)} />
            <View style={styles.counter}><Text style={styles.counterText}>{photoIndex + 1}</Text></View>
            <Arrow direction="forward" onPress={() => move(1)} />
          </Animated.View>
        ) : null}
      </Pressable>
      <ImageAttribution items={source === 'none' ? [] : credits} />
    </View>
  );
}

function Arrow({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }): React.ReactElement {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={direction === 'back' ? 'Previous place photo' : 'Next place photo'} hitSlop={10} style={styles.arrow} onPress={onPress}>
      <Ionicons name={direction === 'back' ? 'chevron-back' : 'chevron-forward'} size={24} color={colors.white} />
    </Pressable>
  );
}

function sourceFor(primary: string | null, fallback?: string | null): Source {
  if (primary) return 'place';
  return fallback ? 'fallback' : 'none';
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  arrow: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,28,24,0.72)' },
  counter: { alignSelf: 'flex-end', marginBottom: 12, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(18,28,24,0.68)' },
  counterText: { color: colors.white, fontSize: 12 },
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
