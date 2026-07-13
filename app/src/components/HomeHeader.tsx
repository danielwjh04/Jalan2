import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients, spacing, type } from '@/lib/theme';

// The region line comes from the server's fixture data, so it follows
// wherever the curated adventures actually are.
export function HomeHeader({ regions }: { regions: string[] }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const location = regions[0] ?? 'Malaysia';
  return (
    <LinearGradient
      colors={gradients.ocean}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing(4) }]}
    >
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>J2</Text>
          </View>
          <Text style={styles.brand}>Jalan2</Text>
        </View>
        <View style={styles.signal}>
          <View style={styles.signalDot} />
        </View>
      </View>
      <Text style={styles.eyebrow}>DISCOVERING NOW</Text>
      <Text style={styles.location}>{location}</Text>
      <Text style={styles.title}>Local stories.{'\n'}Bookable journeys.</Text>
      <Text style={styles.subtitle}>
        Turn the places you save on social into real Malaysian experiences.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(6),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(8),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2.5) },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tide,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.black, fontFamily: fonts.semibold, fontSize: 12 },
  brand: { color: colors.white, fontFamily: fonts.semibold, fontSize: 17, letterSpacing: 0.2 },
  signal: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tide },
  eyebrow: {
    color: colors.inkSoft,
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing(1),
  },
  location: { ...type.heading, color: colors.tide, marginBottom: spacing(5) },
  title: { ...type.display, color: colors.white, fontSize: 34, lineHeight: 40 },
  subtitle: { ...type.body, color: colors.inkSoft, marginTop: spacing(3), maxWidth: 340 },
});
