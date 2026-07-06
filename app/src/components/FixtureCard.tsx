import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { serverUrl } from '@/lib/api';
import { cardShadow, colors, gradients, radius, spacing } from '@/lib/theme';

interface Props {
  fixture: FixtureCardData;
  disabled: boolean;
  onPress: () => void;
}

export function FixtureCard({ fixture, disabled, onPress }: Props): React.ReactElement {
  return (
    <Pressable style={styles.card} disabled={disabled} onPress={onPress}>
      {fixture.coverUrl ? (
        <Image source={{ uri: serverUrl(fixture.coverUrl) }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]} />
      )}
      <LinearGradient colors={gradients.scrim} style={styles.scrim} />
      {fixture.priceMyr !== null && (
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>RM{fixture.priceMyr} / pax</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{fixture.activity ?? fixture.slug}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {fixture.operatorName ?? fixture.url}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.meta} numberOfLines={1}>
          {fixture.meetingPointName ?? 'Meeting point from video'}
        </Text>
        <Text style={styles.action}>Plan trip {'→'}</Text>
      </View>
    </Pressable>
  );
}

const COVER_HEIGHT = 170;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  cover: { width: '100%', height: COVER_HEIGHT },
  coverFallback: { backgroundColor: colors.tideSoft },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, height: COVER_HEIGHT },
  pricePill: {
    position: 'absolute',
    top: spacing(3),
    right: spacing(3),
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  priceText: { color: colors.tide, fontWeight: '700', fontSize: 13 },
  overlay: {
    position: 'absolute',
    top: 0,
    height: COVER_HEIGHT,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    padding: spacing(3.5),
    gap: spacing(0.5),
  },
  title: { color: colors.card, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
  },
  meta: { color: colors.inkSoft, fontSize: 13, flex: 1, marginRight: spacing(2) },
  action: { color: colors.tide, fontSize: 13, fontWeight: '700' },
});
