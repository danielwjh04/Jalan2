import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  confidence: number;
  servedFrom: 'live' | 'cache' | null;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return colors.confirm;
  if (confidence >= 0.5) return colors.pending;
  return colors.danger;
}

export function ConfidenceBadge({ confidence, servedFrom }: Props): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { borderColor: confidenceColor(confidence) }]}>
        <Text style={[styles.badgeText, { color: confidenceColor(confidence) }]}>
          {Math.round(confidence * 100)}% match
        </Text>
      </View>
      {servedFrom === 'cache' && (
        <View style={[styles.badge, { borderColor: colors.textDim }]}>
          <Text style={[styles.badgeText, { color: colors.textDim }]}>cached</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2) },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
