import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { serverUrl } from '@/lib/api';
import { cardShadow, colors, fonts, gradients, radius, spacing } from '@/lib/theme';

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
      <View style={styles.topRow}>
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>SOCIAL FIND</Text>
        </View>
        {fixture.priceMyr !== null && (
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>RM{fixture.priceMyr}/pax</Text>
          </View>
        )}
      </View>
      <View style={styles.overlay}>
        <Text style={styles.meta} numberOfLines={1}>⌖ {fixture.meetingPointName ?? 'Malaysia'}</Text>
        <Text style={styles.title}>{fixture.activity ?? fixture.slug}</Text>
        <View style={styles.footer}>
          <Text style={styles.subtitle} numberOfLines={1}>
            By {fixture.operatorName ?? 'local creator'}
          </Text>
          <View style={styles.action}><Text style={styles.actionText}>↗</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

const COVER_HEIGHT = 330;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  cover: { width: '100%', height: COVER_HEIGHT },
  coverFallback: { backgroundColor: colors.tideSoft },
  scrim: { ...StyleSheet.absoluteFillObject },
  topRow: {
    position: 'absolute',
    top: spacing(4),
    left: spacing(4),
    right: spacing(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourcePill: {
    backgroundColor: 'rgba(5,5,5,0.68)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  sourceText: { color: colors.white, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1 },
  pricePill: {
    backgroundColor: colors.tide,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  priceText: { color: colors.black, fontFamily: fonts.semibold, fontSize: 12 },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    padding: spacing(5),
    gap: spacing(1.5),
  },
  title: { color: colors.white, fontFamily: fonts.semibold, fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontFamily: fonts.regular, fontSize: 13, flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(1),
  },
  meta: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  action: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tide, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.black, fontFamily: fonts.medium, fontSize: 24 },
});
