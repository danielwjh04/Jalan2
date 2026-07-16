import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from '@/lib/theme';
import boboImage from '../../assets/images/bobo.png';

interface BoboCardProps {
  title: string;
  message: string;
  eyebrow?: string;
  compact?: boolean;
  hero?: boolean;
  landing?: boolean;
}

// Bobo always sits on a white surface inside his soft sage halo, so the navy
// silhouette stays readable. Hero cards use the Fraunces display face.
export function BoboCard({
  title,
  message,
  eyebrow: eyebrowText = 'BOBO GUIDE',
  compact = false,
  hero = false,
  landing = false,
}: BoboCardProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const narrowLanding = landing && width < 620;
  return (
    <View style={[styles.card, compact && styles.compactCard, landing && styles.landingCard, narrowLanding && styles.narrowLandingCard]}>
      <View style={[styles.copy, narrowLanding && styles.narrowLandingCopy]}>
        <Text style={[styles.eyebrow, narrowLanding && styles.centerText]}>{eyebrowText}</Text>
        <Text style={[hero ? styles.heroTitle : styles.title, narrowLanding && styles.centerText]}>{title}</Text>
        <Text style={[styles.message, narrowLanding && styles.centerText]}>{message}</Text>
      </View>
      <View style={[styles.stage, compact && styles.compactStage, landing && styles.landingStage, narrowLanding && styles.narrowLandingStage]}>
        <View style={[styles.haloRing, compact && styles.compactHaloRing, landing && styles.landingHaloRing, narrowLanding && styles.narrowLandingHaloRing]}>
          <View style={[styles.halo, compact && styles.compactHalo, landing && styles.landingHalo, narrowLanding && styles.narrowLandingHalo]} />
        </View>
        <Image
          accessibilityLabel="Bobo, Jalan2's Malayan tapir travel guide"
          source={boboImage}
          resizeMode="contain"
          style={[styles.image, compact && styles.compactImage, landing && styles.landingImage, narrowLanding && styles.narrowLandingImage]}
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
  landingCard: { minHeight: 276, paddingVertical: spacing(5), gap: spacing(2) },
  narrowLandingCard: { minHeight: 394, flexDirection: 'column-reverse', alignItems: 'stretch', justifyContent: 'center' },
  copy: { flex: 1, gap: spacing(1), zIndex: 1 },
  narrowLandingCopy: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minHeight: 154, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  heroTitle: { ...type.display, color: colors.ink },
  message: { ...type.caption, color: colors.inkSoft, maxWidth: 230 },
  centerText: { textAlign: 'center' },
  stage: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center' },
  compactStage: { width: 86, height: 86 },
  landingStage: { width: 236, height: 244 },
  narrowLandingStage: { width: 176, height: 178, alignSelf: 'center' },
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
  landingHaloRing: { width: 222, height: 222 },
  narrowLandingHaloRing: { width: 168, height: 168 },
  halo: { width: 94, height: 94, borderRadius: radius.pill, backgroundColor: colors.halo },
  compactHalo: { width: 70, height: 70 },
  landingHalo: { width: 194, height: 194 },
  narrowLandingHalo: { width: 148, height: 148 },
  image: { width: 96, height: 108 },
  compactImage: { width: 68, height: 80 },
  landingImage: { width: 210, height: 236 },
  narrowLandingImage: { width: 152, height: 172 },
});
