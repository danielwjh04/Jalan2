import { StyleSheet, Text, View } from 'react-native';
import type { BookingJson } from '@shared/booking';
import { colors, radius, spacing } from '@/lib/theme';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  booking: BookingJson;
  servedFrom: 'live' | 'cache' | null;
}

export function ItineraryCard({ booking, servedFrom }: Props): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.activity}>{booking.activity}</Text>
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
      <Text style={styles.evidence}>&ldquo;{booking.raw_evidence.transcript_span}&rdquo;</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(2),
  },
  activity: { color: colors.text, fontSize: 22, fontWeight: '800' },
  operator: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(1),
  },
  price: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meeting: { color: colors.textDim, fontSize: 14 },
  contact: { color: colors.textDim, fontSize: 13 },
  evidence: { color: colors.textDim, fontSize: 12, fontStyle: 'italic', marginTop: spacing(1) },
});
