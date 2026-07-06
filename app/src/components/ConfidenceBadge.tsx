import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  confidence: number;
  servedFrom: 'live' | 'cache' | null;
}

function tone(confidence: number): { color: string; bg: string } {
  if (confidence >= 0.8) return { color: colors.confirm, bg: colors.confirmSoft };
  if (confidence >= 0.5) return { color: colors.pending, bg: colors.pendingSoft };
  return { color: colors.danger, bg: colors.dangerSoft };
}

export function ConfidenceBadge({ confidence, servedFrom }: Props): React.ReactElement {
  const { color, bg } = tone(confidence);
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{Math.round(confidence * 100)}% match</Text>
      </View>
      {servedFrom === 'cache' && (
        <View style={[styles.badge, styles.cacheBadge]}>
          <Text style={[styles.badgeText, { color: colors.inkSoft }]}>cached</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2) },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  cacheBadge: { backgroundColor: colors.canvas },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
