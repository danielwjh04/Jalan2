import { Image, StyleSheet, Text, View } from 'react-native';
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from '@/lib/theme';
import boboImage from '../../assets/images/bobo.png';

interface BoboCardProps {
  title: string;
  message: string;
  eyebrow?: string;
  compact?: boolean;
  hero?: boolean;
}

// Bobo always sits on a white surface inside his soft sage halo, so the navy
// silhouette stays readable. Hero cards use the Fraunces display face.
export function BoboCard({
  title,
  message,
  eyebrow: eyebrowText = 'BOBO GUIDE',
  compact = false,
  hero = false,
}: BoboCardProps): React.ReactElement {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrowText}</Text>
        <Text style={hero ? styles.heroTitle : styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={[styles.stage, compact && styles.compactStage]}>
        <View style={[styles.haloRing, compact && styles.compactHaloRing]}>
          <View style={[styles.halo, compact && styles.compactHalo]} />
        </View>
        <Image
          accessibilityLabel="Bobo, Jalan2's Malayan tapir travel guide"
          source={boboImage}
          resizeMode="contain"
          style={[styles.image, compact && styles.compactImage]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    backgroundColor: colors.card,
    ...hairline,
    borderRadius: radius.card,
    padding: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...cardShadow,
  },
  compactCard: { minHeight: 112, paddingVertical: spacing(3) },
  copy: { flex: 1, gap: spacing(1), zIndex: 1 },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  heroTitle: { ...type.display, color: colors.ink },
  message: { ...type.caption, color: colors.inkSoft, maxWidth: 230 },
  stage: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center' },
  compactStage: { width: 86, height: 86 },
  haloRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(221,233,221,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHaloRing: { width: 84, height: 84 },
  halo: { width: 94, height: 94, borderRadius: radius.pill, backgroundColor: colors.halo },
  compactHalo: { width: 70, height: 70 },
  image: { width: 96, height: 108 },
  compactImage: { width: 68, height: 80 },
});
