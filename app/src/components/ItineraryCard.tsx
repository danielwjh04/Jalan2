import { StyleSheet, Text, View } from 'react-native';
import type { BookingJson } from '@shared/booking';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  booking: BookingJson;
  servedFrom: 'live' | 'cache' | null;
  showTitle?: boolean;
}

export function ItineraryCard({
  booking,
  servedFrom,
  showTitle = true,
}: Props): React.ReactElement {
  return (
    <View style={styles.card}>
      {showTitle && <Text style={styles.activity}>{booking.activity}</Text>}
      <Text style={styles.operator}>{booking.operator_name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.price}>
          {booking.price_myr === null ? 'Price on request' : `RM${booking.price_myr} / pax`}
        </Text>
        <ConfidenceBadge confidence={booking.confidence} servedFrom={servedFrom} />
      </View>
      <Text style={styles.meeting}>Meet: {booking.meeting_point.name}</Text>
      {booking.contact.whatsapp && (
        <Text style={styles.contact}>
          Operator WhatsApp found in {booking.contact.source}: {booking.contact.whatsapp}
        </Text>
      )}
      <View style={styles.evidenceBox}>
        <Text style={styles.evidence}>&ldquo;{booking.raw_evidence.transcript_span}&rdquo;</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(5),
    gap: spacing(2),
    ...cardShadow,
  },
  activity: { color: colors.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  operator: { color: colors.tide, fontSize: 15, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(1),
  },
  price: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  meeting: { color: colors.inkSoft, fontSize: 14 },
  contact: { color: colors.inkSoft, fontSize: 13 },
  evidenceBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.control,
    padding: spacing(3),
    marginTop: spacing(1),
  },
  evidence: { color: colors.inkSoft, fontSize: 12.5, fontStyle: 'italic', lineHeight: 18 },
});
