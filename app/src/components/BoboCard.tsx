import { Image, StyleSheet, Text, View } from 'react-native';
import { cardShadow, colors, eyebrow, radius, spacing, type } from '@/lib/theme';
import boboImage from '../../assets/images/bobo.png';

interface BoboCardProps {
  title: string;
  message: string;
  compact?: boolean;
  tone?: 'dark' | 'acid';
}

export function BoboCard({
  title,
  message,
  compact = false,
  tone = 'dark',
}: BoboCardProps): React.ReactElement {
  const acid = tone === 'acid';
  return (
    <View style={[styles.card, acid && styles.acidCard, compact && styles.compactCard]}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, acid && styles.acidSoft]}>BOBO GUIDE</Text>
        <Text style={[styles.title, acid && styles.acidText]}>{title}</Text>
        <Text style={[styles.message, acid && styles.acidSoft]}>{message}</Text>
      </View>
      <Image
        accessibilityLabel="Bobo, Jalan2's Malayan tapir travel guide"
        source={boboImage}
        resizeMode="contain"
        style={[styles.image, compact && styles.compactImage]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    backgroundColor: colors.card,
    borderColor: colors.mist,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...cardShadow,
  },
  acidCard: { backgroundColor: colors.tide, borderColor: colors.tide },
  compactCard: { minHeight: 116, paddingVertical: spacing(3) },
  copy: { flex: 1, gap: spacing(1), zIndex: 1 },
  eyebrow: { ...eyebrow, color: colors.tide },
  title: { ...type.title, color: colors.ink },
  message: { ...type.caption, color: colors.inkSoft, maxWidth: 230 },
  acidText: { color: colors.black },
  acidSoft: { color: 'rgba(5,5,5,0.62)' },
  image: { width: 105, height: 132, marginRight: -spacing(2), marginBottom: -spacing(3) },
  compactImage: { width: 78, height: 100, marginBottom: -spacing(2) },
});
