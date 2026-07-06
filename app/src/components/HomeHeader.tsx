import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '@/lib/theme';

// The region line comes from the server's fixture data, so it follows
// wherever the curated adventures actually are.
export function HomeHeader({ regions }: { regions: string[] }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const eyebrow = ['Visit Malaysia 2026', ...regions].join(' · ');
  return (
    <LinearGradient
      colors={gradients.ocean}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing(4) }]}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Jalan2</Text>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>Saw it on TikTok?{'\n'}Book it for real.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(12),
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: { alignItems: 'center', marginBottom: spacing(5) },
  brand: { color: colors.card, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing(2),
  },
  title: {
    color: colors.card,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 37,
  },
});
