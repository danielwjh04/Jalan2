import { StyleSheet, Text, View } from 'react-native';
import type { ItineraryStatus } from '@shared/status';
import { colors, radius, spacing } from '@/lib/theme';

const APPEARANCE: Record<ItineraryStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Ready to book', color: colors.textDim },
  PENDING_CONFIRM: { label: 'Waiting for operator...', color: colors.pending },
  CONFIRMED: { label: 'CONFIRMED', color: colors.confirm },
  FAILED: { label: 'Failed', color: colors.danger },
};

export function StatusPill({ status }: { status: ItineraryStatus }): React.ReactElement {
  const { label, color } = APPEARANCE[status];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(1.5),
  },
  text: { fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});
