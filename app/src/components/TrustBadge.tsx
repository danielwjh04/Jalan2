import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Trust } from '@shared/booking';
import { colors, radius, spacing } from '@/lib/theme';

function band(score: number): { label: string; color: string; soft: string } {
  if (score >= 0.6) return { label: 'Web presence: strong', color: colors.confirm, soft: colors.confirmSoft };
  if (score >= 0.3) return { label: 'Web presence: some', color: colors.pending, soft: colors.pendingSoft };
  return { label: 'Web presence: limited', color: colors.inkSoft, soft: colors.mist };
}

export function TrustBadge({ trust }: { trust: Trust }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { label, color, soft } = band(trust.score);
  return (
    <View style={styles.wrap}>
      <Pressable style={[styles.badge, { backgroundColor: soft }]} onPress={() => setOpen(!open)}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
        <Text style={[styles.chevron, { color }]}>{open ? 'hide' : 'evidence'}</Text>
      </Pressable>
      {open && (
        <View style={styles.evidence}>
          {trust.evidence.map((line) => (
            <Text key={line} style={styles.evidenceLine} numberOfLines={3}>
              {line}
            </Text>
          ))}
          <Text style={styles.disclaimer}>
            Automated due diligence signal, not a certification.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing(2) },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.control,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  badgeText: { fontSize: 12.5, fontWeight: '700' },
  chevron: { fontSize: 11, fontWeight: '600' },
  evidence: {
    backgroundColor: colors.canvas,
    borderRadius: radius.control,
    padding: spacing(3),
    gap: spacing(2),
  },
  evidenceLine: { color: colors.inkSoft, fontSize: 11.5, lineHeight: 16 },
  disclaimer: { color: colors.inkSoft, fontSize: 10, fontStyle: 'italic' },
});
