import { StyleSheet, Text, View } from 'react-native';
import type { ItineraryStatus } from '@shared/status';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const APPEARANCE: Record<ItineraryStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Ready to book', color: colors.sageDeep, bg: colors.halo },
  PENDING_CONFIRM: { label: 'Waiting for operator...', color: colors.pending, bg: colors.pendingSoft },
  CONFIRMED: { label: 'Confirmed', color: colors.confirm, bg: colors.confirmSoft },
  FAILED: { label: 'Failed', color: colors.danger, bg: colors.dangerSoft },
};

export function StatusPill({ status }: { status: ItineraryStatus }): React.ReactElement {
  const { label, color, bg } = APPEARANCE[status];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  text: { fontFamily: fonts.medium, fontSize: 13 },
});
