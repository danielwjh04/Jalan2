import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { serverUrl } from '@/lib/api';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';

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
      {fixture.priceMyr !== null && (
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>RM{fixture.priceMyr} / pax</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{fixture.activity ?? fixture.slug}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[fixture.operatorName, fixture.meetingPointName].filter(Boolean).join(' · ') ||
            fixture.url}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  cover: { width: '100%', height: 150 },
  coverFallback: { backgroundColor: colors.tideSoft },
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
  body: { padding: spacing(3.5), gap: spacing(1) },
  title: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.inkSoft, fontSize: 13 },
});
