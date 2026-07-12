import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients, spacing, type } from '@/lib/theme';

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
  brand: { color: colors.card, fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.4 },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing(2),
  },
  title: { ...type.display, color: colors.card },
});
