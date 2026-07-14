import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, eyebrow, fonts, spacing } from '@/lib/theme';

// The region line comes from the server's fixture data, so it follows
// wherever the curated adventures actually are.
export function HomeHeader({ regions }: { regions: string[] }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const location = regions[0] ?? 'Malaysia';
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing(5) }]}>
      <View style={styles.brandRow}>
        <Text style={styles.wordmark}>Jalan2</Text>
        <View style={styles.wordmarkDot} />
      </View>
      <Text style={styles.tagline}>
        Discovering now | <Text style={styles.taglineLocation}>{location}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(4),
  },
  brandRow: { flexDirection: 'row', alignItems: 'flex-end' },
  wordmark: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  wordmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
    marginLeft: spacing(1),
    marginBottom: 5,
  },
  tagline: { ...eyebrow, color: colors.inkSoft, marginTop: spacing(2) },
  taglineLocation: { color: colors.sageDeep },
});
