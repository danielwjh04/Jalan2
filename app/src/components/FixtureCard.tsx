import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { serverUrl } from '@/lib/api';
import { cardShadow, colors, fonts, hairline, radius, spacing, type } from '@/lib/theme';

interface Props {
  fixture: FixtureCardData;
  disabled: boolean;
  onPress: () => void;
}

// Photo-led card: the image carries the color and the name sits below it on
// white, at roughly a 2:1 photo-to-text vertical ratio.
export function FixtureCard({ fixture, disabled, onPress }: Props): React.ReactElement {
  return (
    <Pressable style={styles.card} disabled={disabled} onPress={onPress}>
      <View style={styles.coverWrap}>
        {fixture.coverUrl ? (
          <Image source={{ uri: serverUrl(fixture.coverUrl) }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>SOCIAL FIND</Text>
        </View>
        {fixture.priceMyr !== null && (
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>RM{fixture.priceMyr}/pax</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.inkSoft} />
          <Text style={styles.meta} numberOfLines={1}>{fixture.meetingPointName ?? 'Malaysia'}</Text>
        </View>
        <Text style={styles.title}>{fixture.activity ?? fixture.slug}</Text>
        <View style={styles.footer}>
          <Text style={styles.subtitle} numberOfLines={1}>
            By {fixture.operatorName ?? 'local creator'}
          </Text>
          <View style={styles.action}>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const COVER_HEIGHT = 200;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...hairline,
    ...cardShadow,
  },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: COVER_HEIGHT },
  coverFallback: { backgroundColor: colors.halo },
  sourcePill: {
    position: 'absolute',
    top: spacing(3),
    left: spacing(3),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  sourceText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1 },
  pricePill: {
    position: 'absolute',
    top: spacing(3),
    right: spacing(3),
    backgroundColor: colors.kaya,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  priceText: { color: colors.kopi, fontFamily: fonts.semibold, fontSize: 12 },
  body: { padding: spacing(4), gap: spacing(1.5) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  meta: { ...type.caption, color: colors.inkSoft, flex: 1 },
  title: { ...type.title, color: colors.ink },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(0.5),
  },
  subtitle: { ...type.caption, color: colors.inkSoft, flex: 1 },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
